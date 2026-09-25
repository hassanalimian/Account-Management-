<?php
/**
 * Database Configuration & PDO Connection
 * Multi-Business Accounting System
 */

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Credentials (Update for your MySQL server)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'multi_business_accounting');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                die(json_encode([
                    'error' => 'Database connection failed',
                    'message' => $e->getMessage()
                ]));
            }
        }
        return self::$instance;
    }
}

// Security & Helper Functions
function get_current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function get_current_business_id(): ?int {
    return isset($_SESSION['business_id']) ? (int)$_SESSION['business_id'] : null;
}

function require_auth(): void {
    if (!get_current_user_id()) {
        header('Location: /login.php');
        exit;
    }
}

function require_admin(): void {
    require_auth();
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        http_response_code(403);
        die('Access Denied: Administrator role required.');
    }
}

function verify_business_ownership(PDO $pdo, int $businessId, int $userId): bool {
    $stmt = $pdo->prepare("SELECT id FROM businesses WHERE id = ? AND user_id = ?");
    $stmt->execute([$businessId, $userId]);
    return (bool)$stmt->fetch();
}

function sanitize(string $data): string {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(string $token): bool {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
