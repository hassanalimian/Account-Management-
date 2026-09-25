<?php
/**
 * Admin Panel Controller
 * Business Management, Global Limits & Per-User Overrides
 */

require_once __DIR__ . '/config/db.php';
require_admin();

$pdo = Database::getConnection();

// 1. Update Global Limit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_global_limit') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) die('Invalid CSRF');
    $limit = max(1, (int)$_POST['global_limit']);
    
    $stmt = $pdo->prepare("
        INSERT INTO system_settings (setting_key, setting_value) 
        VALUES ('max_businesses_per_user', ?)
        ON DUPLICATE KEY UPDATE setting_value = ?
    ");
    $stmt->execute([(string)$limit, (string)$limit]);
    $_SESSION['flash_success'] = "Global business limit updated to {$limit}.";
    header('Location: /admin.php');
    exit;
}

// 2. Update Individual User Limit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_user_limit') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) die('Invalid CSRF');
    $userId = (int)$_POST['user_id'];
    $limitType = $_POST['limit_type'] ?? 'global';
    
    if ($limitType === 'custom') {
        $customLimit = max(0, (int)$_POST['custom_limit']);
        $stmt = $pdo->prepare("UPDATE users SET business_limit = ? WHERE id = ?");
        $stmt->execute([$customLimit, $userId]);
        $_SESSION['flash_success'] = "Custom limit of {$customLimit} assigned to user.";
    } else {
        $stmt = $pdo->prepare("UPDATE users SET business_limit = NULL WHERE id = ?");
        $stmt->execute([$userId]);
        $_SESSION['flash_success'] = "User reset to use global business limit.";
    }
    header('Location: /admin.php');
    exit;
}

// Fetch Global Limit
$stmt = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'max_businesses_per_user'");
$globalLimit = (int)($stmt->fetch()['setting_value'] ?? 5);

// Fetch All Users with business counts and auth provider info
$query = "
    SELECT u.id, u.name, u.email, u.role, u.business_limit, u.created_at,
           u.auth_provider, u.google_id, u.profile_image, u.email_verified,
           (u.password_hash IS NOT NULL) AS has_password,
           COUNT(b.id) AS total_businesses
    FROM users u
    LEFT JOIN businesses b ON u.id = b.user_id
    GROUP BY u.id
    ORDER BY u.id ASC
";
$users = $pdo->query($query)->fetchAll();

// Fetch Businesses with user details
$bizQuery = "
    SELECT b.*, u.name AS owner_name, u.email AS owner_email
    FROM businesses b
    JOIN users u ON b.user_id = u.id
    ORDER BY b.created_at DESC
";
$allBusinesses = $pdo->query($bizQuery)->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Panel - Business Limits & Overview</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light p-4">
<div class="container-fluid">
    <h2>Admin Panel & Business Limits</h2>
    <div class="row g-4 my-3">
        <div class="col-md-4">
            <div class="card p-3 shadow-sm">
                <h5>Global Business Limit</h5>
                <p class="text-muted small">Controls the default business ceiling for every user unless explicitly overridden.</p>
                <form method="POST" action="/admin.php">
                    <input type="hidden" name="action" value="update_global_limit">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <div class="input-group mb-3">
                        <span class="input-group-text">Max Limit</span>
                        <input type="number" name="global_limit" class="form-control" value="<?= $globalLimit ?>" min="1" required>
                        <button class="btn btn-primary" type="submit">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
</body>
</html>
