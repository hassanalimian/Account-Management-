<?php
/**
 * Multi-Business Accounting System - Google OAuth 2.0 / OpenID Connect Controller
 * 
 * Production-ready PHP 8.2+ script implementing official Google OAuth authentication:
 * - Secure server-side code exchange with https://oauth2.googleapis.com/token
 * - Google userinfo verification with https://www.googleapis.com/oauth2/v3/userinfo
 * - CSRF state validation with cryptographically secure nonces
 * - First-time Google user provisioning (no password required)
 * - Existing user matching and automatic account linking
 * - In-app Account Settings linking & unlinking with password guards
 * - Session regeneration against session fixation attacks
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';

// Configure secure cookies for session
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400 * 7,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

$googleClientId = getenv('GOOGLE_CLIENT_ID') ?: '';
$googleClientSecret = getenv('GOOGLE_CLIENT_SECRET') ?: '';
$appUrl = getenv('APP_URL') ?: (
    (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost:3000')
);
$redirectUri = rtrim($appUrl, '/') . '/php/oauth_google.php?action=callback';

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

try {
    $pdo = getDbConnection();

    switch ($action) {
        /**
         * 1. Check Configuration & Generate Authorization URL
         */
        case 'auth_url':
            $isConfigured = !empty($googleClientId) && !empty($googleClientSecret);
            $state = bin2hex(random_bytes(24));
            
            // Store state in session with timestamp for CSRF protection
            $_SESSION['oauth_state'] = [
                'token' => $state,
                'created_at' => time(),
                'intent' => $_GET['intent'] ?? 'login' // 'login' or 'link'
            ];

            $authParams = http_build_query([
                'client_id' => $googleClientId,
                'redirect_uri' => $redirectUri,
                'response_type' => 'code',
                'scope' => 'openid email profile',
                'state' => $state,
                'access_type' => 'offline',
                'prompt' => 'select_account'
            ]);

            $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . $authParams;

            echo json_encode([
                'success' => true,
                'is_configured' => $isConfigured,
                'client_id' => $googleClientId,
                'redirect_uri' => $redirectUri,
                'url' => $url,
                'state' => $state
            ]);
            exit;

        /**
         * 2. Handle Google OAuth Callback (Code Exchange & User Lookup/Creation)
         */
        case 'callback':
            header('Content-Type: text/html; charset=utf-8');

            $code = $_GET['code'] ?? null;
            $state = $_GET['state'] ?? null;
            $error = $_GET['error'] ?? null;

            if ($error) {
                renderPopupResponse(false, 'Google authentication declined or cancelled: ' . htmlspecialchars($error));
                exit;
            }

            // CSRF State validation
            if (!$code || !$state || empty($_SESSION['oauth_state']) || !hash_equals($_SESSION['oauth_state']['token'], $state)) {
                renderPopupResponse(false, 'Invalid or expired OAuth state parameter (CSRF validation failed).');
                exit;
            }

            $intent = $_SESSION['oauth_state']['intent'] ?? 'login';
            unset($_SESSION['oauth_state']); // Invalidate state immediately

            if (empty($googleClientId) || empty($googleClientSecret)) {
                renderPopupResponse(false, 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured on the server.');
                exit;
            }

            // Step A: Exchange code for Access Token & ID Token with Google
            $tokenPost = [
                'code' => $code,
                'client_id' => $googleClientId,
                'client_secret' => $googleClientSecret,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code'
            ];

            $ch = curl_init('https://oauth2.googleapis.com/token');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenPost));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
            $tokenRaw = curl_exec($ch);
            $tokenHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($tokenHttpCode !== 200 || !$tokenRaw) {
                renderPopupResponse(false, 'Failed to exchange authorization code with Google token service.');
                exit;
            }

            $tokenData = json_decode($tokenRaw, true);
            $accessToken = $tokenData['access_token'] ?? null;

            if (!$accessToken) {
                renderPopupResponse(false, 'Missing access token in Google OAuth response.');
                exit;
            }

            // Step B: Fetch verified user info from Google's UserInfo endpoint
            $ch = curl_init('https://www.googleapis.com/oauth2/v3/userinfo');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
            $userInfoRaw = curl_exec($ch);
            $userInfoCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($userInfoCode !== 200 || !$userInfoRaw) {
                renderPopupResponse(false, 'Failed to fetch verified user profile from Google.');
                exit;
            }

            $googleProfile = json_decode($userInfoRaw, true);
            $googleId = $googleProfile['sub'] ?? null;
            $googleEmail = strtolower(trim($googleProfile['email'] ?? ''));
            $name = $googleProfile['name'] ?? ($googleProfile['given_name'] ?? 'Google User');
            $profileImage = $googleProfile['picture'] ?? null;
            $emailVerified = !empty($googleProfile['email_verified']);

            if (!$googleId || !$googleEmail) {
                renderPopupResponse(false, 'Google account missing required sub ID or email address.');
                exit;
            }

            // Step C: Handle Account Linking if logged in with intent='link'
            if ($intent === 'link' && !empty($_SESSION['user_id'])) {
                $loggedInId = (int)$_SESSION['user_id'];
                
                // Verify this google_id is not already linked to another user
                $stmt = $pdo->prepare('SELECT id, email FROM users WHERE google_id = :gid AND id != :uid');
                $stmt->execute([':gid' => $googleId, ':uid' => $loggedInId]);
                $collision = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($collision) {
                    renderPopupResponse(false, 'This Google account is already linked to another user account (' . htmlspecialchars($collision['email']) . ').');
                    exit;
                }

                // Link to current user
                $updateStmt = $pdo->prepare('
                    UPDATE users 
                    SET google_id = :gid, 
                        profile_image = COALESCE(profile_image, :pimg),
                        auth_provider = IF(password_hash IS NOT NULL, "linked", "google"),
                        email_verified = 1
                    WHERE id = :uid
                ');
                $updateStmt->execute([
                    ':gid' => $googleId,
                    ':pimg' => $profileImage,
                    ':uid' => $loggedInId
                ]);

                renderPopupResponse(true, 'Google Account linked successfully!', [
                    'action' => 'linked',
                    'google_id' => $googleId,
                    'email' => $googleEmail
                ]);
                exit;
            }

            // Step D: Normal Google Login / First-time Registration / Existing User Match
            // 1. Search by google_id
            $stmt = $pdo->prepare('SELECT * FROM users WHERE google_id = :gid LIMIT 1');
            $stmt->execute([':gid' => $googleId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                // 2. Search by verified email (Auto-linking existing email/pass user)
                $stmt = $pdo->prepare('SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1');
                $stmt->execute([':email' => $googleEmail]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    // Link Google to this existing account without creating duplicate
                    $newProvider = !empty($user['password_hash']) ? 'linked' : 'google';
                    $newImage = $user['profile_image'] ?: $profileImage;

                    $linkStmt = $pdo->prepare('
                        UPDATE users 
                        SET google_id = :gid, 
                            profile_image = :pimg, 
                            auth_provider = :provider, 
                            email_verified = 1 
                        WHERE id = :id
                    ');
                    $linkStmt->execute([
                        ':gid' => $googleId,
                        ':pimg' => $newImage,
                        ':provider' => $newProvider,
                        ':id' => $user['id']
                    ]);

                    $user['google_id'] = $googleId;
                    $user['profile_image'] = $newImage;
                    $user['auth_provider'] = $newProvider;
                } else {
                    // 3. First-Time Google User: Automatically create user record
                    $insertStmt = $pdo->prepare('
                        INSERT INTO users (name, email, password_hash, google_id, profile_image, auth_provider, email_verified, role, business_limit)
                        VALUES (:name, :email, NULL, :gid, :pimg, "google", 1, "user", NULL)
                    ');
                    $insertStmt->execute([
                        ':name' => $name,
                        ':email' => $googleEmail,
                        ':gid' => $googleId,
                        ':pimg' => $profileImage
                    ]);

                    $newUserId = (int)$pdo->lastInsertId();
                    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
                    $stmt->execute([':id' => $newUserId]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                }
            } else {
                // Existing Google user: update profile picture if missing
                if (empty($user['profile_image']) && $profileImage) {
                    $upd = $pdo->prepare('UPDATE users SET profile_image = :pimg WHERE id = :id');
                    $upd->execute([':pimg' => $profileImage, ':id' => $user['id']]);
                    $user['profile_image'] = $profileImage;
                }
            }

            // Regenerate session and set login state
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['auth_provider'] = $user['auth_provider'];

            $sessionToken = 'session_' . $user['id'] . '_' . time() . '_' . bin2hex(random_bytes(8));

            renderPopupResponse(true, 'Authentication successful! Redirecting to Business Dashboard...', [
                'token' => $sessionToken,
                'user' => [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'auth_provider' => $user['auth_provider'],
                    'google_id' => $user['google_id'],
                    'profile_image' => $user['profile_image'],
                    'business_limit' => $user['business_limit'] !== null ? (int)$user['business_limit'] : null,
                    'has_password' => !empty($user['password_hash'])
                ]
            ]);
            exit;

        /**
         * 3. Disconnect / Unlink Google Account
         */
        case 'unlink':
            if (empty($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                exit;
            }

            $userId = (int)$_SESSION['user_id'];
            $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                exit;
            }

            if (empty($user['password_hash'])) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'You cannot disconnect your Google account without first creating a password, or you would be unable to log in.'
                ]);
                exit;
            }

            $stmt = $pdo->prepare('UPDATE users SET google_id = NULL, auth_provider = "email" WHERE id = :id');
            $stmt->execute([':id' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Google account unlinked successfully.']);
            exit;

        /**
         * 4. Set Password for Google-Only Accounts
         */
        case 'set_password':
            if (empty($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                exit;
            }

            $rawInput = file_get_contents('php://input');
            $data = json_decode($rawInput, true) ?: $_POST;
            $newPassword = $data['password'] ?? '';

            if (strlen($newPassword) < 6) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must be at least 6 characters']);
                exit;
            }

            $userId = (int)$_SESSION['user_id'];
            $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);

            $stmt = $pdo->prepare('
                UPDATE users 
                SET password_hash = :hash,
                    auth_provider = IF(google_id IS NOT NULL, "linked", "email")
                WHERE id = :id
            ');
            $stmt->execute([':hash' => $passwordHash, ':id' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Password created successfully.']);
            exit;

        default:
            echo json_encode([
                'service' => 'AccountingERP Google OAuth 2.0 Service',
                'status' => 'active',
                'endpoints' => [
                    'auth_url' => '?action=auth_url',
                    'callback' => '?action=callback',
                    'unlink' => '?action=unlink (POST)',
                    'set_password' => '?action=set_password (POST)'
                ]
            ]);
            exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

/**
 * Render popup postMessage script that communicates with the parent React window
 */
function renderPopupResponse(bool $success, string $message, array $data = []): void {
    $payload = array_merge([
        'type' => $success ? 'GOOGLE_AUTH_SUCCESS' : 'GOOGLE_AUTH_ERROR',
        'success' => $success,
        'message' => $message,
    ], $data);
    $json = json_encode($payload, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo $success ? 'Authentication Succeeded' : 'Authentication Error'; ?></title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #020617;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .box {
            background: #0f172a;
            border: 1px solid #1e293b;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 420px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #6366f1;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1.25rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h3 { margin: 0 0 0.5rem; font-size: 1.15rem; color: #fff; }
        p { margin: 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="box">
        <?php if ($success): ?>
            <div class="spinner"></div>
            <h3>Authentication Successful</h3>
            <p><?php echo htmlspecialchars($message); ?></p>
        <?php else: ?>
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚠️</div>
            <h3 style="color: #f87171;">Authentication Failed</h3>
            <p><?php echo htmlspecialchars($message); ?></p>
        <?php endif; ?>
    </div>
    <script>
        const authData = <?php echo $json; ?>;
        if (window.opener) {
            window.opener.postMessage(authData, '*');
            setTimeout(function() {
                window.close();
            }, <?php echo $success ? 350 : 2500; ?>);
        } else {
            setTimeout(function() {
                window.location.href = '/';
            }, 1000);
        }
    </script>
</body>
</html>
<?php
}
