<?php
/**
 * Business Management Controller
 * Handles Business Listing, Add Business (with Admin limit checks), and Business Context Switcher
 */

require_once __DIR__ . '/config/db.php';
require_auth();

$pdo = Database::getConnection();
$userId = get_current_user_id();

// Helper to calculate user's business limit
function get_user_business_limit(PDO $pdo, int $userId): int {
    $stmt = $pdo->prepare("SELECT business_limit FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if ($user && $user['business_limit'] !== null) {
        return (int)$user['business_limit'];
    }

    $stmt2 = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'max_businesses_per_user'");
    $setting = $stmt2->fetch();
    return $setting ? (int)$setting['setting_value'] : 5;
}

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        die('Invalid CSRF token');
    }

    // 1. Verify User Limit
    $limit = get_user_business_limit($pdo, $userId);
    $stmtCount = $pdo->prepare("SELECT COUNT(*) AS total FROM businesses WHERE user_id = ?");
    $stmtCount->execute([$userId]);
    $currentCount = (int)$stmtCount->fetch()['total'];

    if ($currentCount >= $limit) {
        $_SESSION['flash_error'] = "Business creation limit reached. Your maximum allowed businesses is {$limit}. Contact administrator to request an increase.";
        header('Location: /business.php');
        exit;
    }

    // 2. Validate and Insert Business
    $name = sanitize($_POST['name'] ?? '');
    $icon = sanitize($_POST['icon'] ?? '🏢');
    $address = sanitize($_POST['address'] ?? '');
    $phone = sanitize($_POST['phone'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $currency = sanitize($_POST['currency'] ?? 'USD');
    $taxNumber = sanitize($_POST['tax_number'] ?? '');
    $logo = sanitize($_POST['logo'] ?? '');

    if (empty($name)) {
        $_SESSION['flash_error'] = "Business name is required.";
        header('Location: /business.php?action=add');
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO businesses (user_id, name, logo, icon, address, phone, email, currency, tax_number, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ");
    $stmt->execute([$userId, $name, $logo, $icon, $address, $phone, $email, $currency, $taxNumber]);
    $businessId = (int)$pdo->lastInsertId();

    // Create default category
    $catStmt = $pdo->prepare("INSERT INTO product_categories (business_id, name, description) VALUES (?, 'General Inventory', 'Default category')");
    $catStmt->execute([$businessId]);

    $_SESSION['flash_success'] = "Business '{$name}' created successfully!";
    header('Location: /business.php');
    exit;
}

// Select active business
if ($action === 'select' && isset($_GET['id'])) {
    $businessId = (int)$_GET['id'];
    if (verify_business_ownership($pdo, $businessId, $userId)) {
        $_SESSION['business_id'] = $businessId;
        header('Location: /dashboard.php');
        exit;
    } else {
        die('Unauthorized business selection');
    }
}

// Query businesses owned by user
$stmt = $pdo->prepare("SELECT * FROM businesses WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$userId]);
$businesses = $stmt->fetchAll();

$userLimit = get_user_business_limit($pdo, $userId);
$currentCount = count($businesses);
$remainingSlots = max(0, $userLimit - $currentCount);
?>
<!-- Business Dashboard View -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Business Selection & Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light p-4">
<div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2>My Businesses</h2>
            <p class="text-muted mb-0">Assigned Limit: <strong><?= $userLimit ?></strong> | Current: <strong><?= $currentCount ?></strong> | Remaining Slots: <strong><?= $remainingSlots ?></strong></p>
        </div>
        <div>
            <?php if ($remainingSlots > 0): ?>
                <a href="#addBusinessModal" data-bs-toggle="modal" class="btn btn-primary">+ Add Business</a>
            <?php else: ?>
                <button class="btn btn-secondary" disabled title="Business limit reached">Limit Reached</button>
            <?php endif; ?>
            <a href="/logout.php" class="btn btn-outline-danger ms-2">Logout</a>
        </div>
    </div>

    <?php if (isset($_SESSION['flash_error'])): ?>
        <div class="alert alert-danger"><?= $_SESSION['flash_error']; unset($_SESSION['flash_error']); ?></div>
    <?php endif; ?>
    <?php if (isset($_SESSION['flash_success'])): ?>
        <div class="alert alert-success"><?= $_SESSION['flash_success']; unset($_SESSION['flash_success']); ?></div>
    <?php endif; ?>

    <div class="row g-4">
        <?php foreach ($businesses as $b): ?>
            <div class="col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <span class="fs-1 me-3"><?= htmlspecialchars($b['icon']) ?></span>
                            <div>
                                <h5 class="card-title mb-0"><?= htmlspecialchars($b['name']) ?></h5>
                                <small class="text-muted"><?= htmlspecialchars($b['currency']) ?> &bull; <?= htmlspecialchars($b['phone']) ?></small>
                            </div>
                        </div>
                        <p class="card-text text-secondary small"><?= htmlspecialchars($b['address']) ?></p>
                        <a href="/business.php?action=select&id=<?= $b['id'] ?>" class="btn btn-outline-primary w-100">Enter Business Dashboard &rarr;</a>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>
</body>
</html>
