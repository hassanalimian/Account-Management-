<?php
/**
 * Bank Accounts Controller
 * Supports Individual & Multiple Business accounts, Scope Conversion, and Statement Views
 */

require_once __DIR__ . '/config/db.php';
require_auth();

$pdo = Database::getConnection();
$userId = get_current_user_id();
$businessId = get_current_business_id();

if (!$businessId || !verify_business_ownership($pdo, $businessId, $userId)) {
    die('Please select an active business first');
}

$action = $_GET['action'] ?? 'list';

// 1. Create Bank Account
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) die('Invalid CSRF');

    $bankName = sanitize($_POST['bank_name'] ?? '');
    $accountTitle = sanitize($_POST['account_title'] ?? '');
    $accountNumber = sanitize($_POST['account_number'] ?? '');
    $accountType = sanitize($_POST['account_type'] ?? 'Checking');
    $openingBalance = (float)($_POST['opening_balance'] ?? 0);
    $scope = in_array($_POST['scope'] ?? '', ['individual', 'multiple']) ? $_POST['scope'] : 'individual';

    $connectedBusinesses = [$businessId];
    if ($scope === 'multiple' && !empty($_POST['connected_business_ids'])) {
        foreach ($_POST['connected_business_ids'] as $bId) {
            $bId = (int)$bId;
            if (verify_business_ownership($pdo, $bId, $userId) && !in_array($bId, $connectedBusinesses)) {
                $connectedBusinesses[] = $bId;
            }
        }
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            INSERT INTO bank_accounts (user_id, primary_business_id, bank_name, account_title, account_number, account_type, opening_balance, current_balance, scope)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $businessId, $bankName, $accountTitle, $accountNumber, $accountType, $openingBalance, $openingBalance, $scope]);
        $accountId = (int)$pdo->lastInsertId();

        // Relate businesses
        $stmtRel = $pdo->prepare("INSERT INTO business_bank_accounts (bank_account_id, business_id) VALUES (?, ?)");
        foreach ($connectedBusinesses as $bId) {
            $stmtRel->execute([$accountId, $bId]);
        }

        // Record opening balance transaction if > 0
        if ($openingBalance > 0) {
            $stmtTxn = $pdo->prepare("
                INSERT INTO bank_transactions (bank_account_id, business_id, transaction_type, amount, reference_type, reference_id, description, transaction_date)
                VALUES (?, ?, 'deposit', ?, 'opening', ?, 'Bank Opening Balance', CURDATE())
            ");
            $stmtTxn->execute([$accountId, $businessId, $openingBalance, "BANK-OP-{$accountId}"]);
        }

        $pdo->commit();
        $_SESSION['flash_success'] = "Bank account created successfully!";
    } catch (Exception $e) {
        $pdo->rollBack();
        $_SESSION['flash_error'] = "Failed to create account: " . $e->getMessage();
    }

    header('Location: /bank_accounts.php');
    exit;
}

// 2. Convert Bank Account Scope
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'convert') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) die('Invalid CSRF');

    $accountId = (int)($_POST['bank_account_id'] ?? 0);
    $targetScope = sanitize($_POST['target_scope'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?");
    $stmt->execute([$accountId, $userId]);
    $account = $stmt->fetch();
    if (!$account) die('Bank account not found');

    if ($account['scope'] === 'multiple' && $targetScope === 'individual') {
        $targetBusinessId = (int)($_POST['target_business_id'] ?? $account['primary_business_id']);

        // Check if ANY transaction exists from other businesses
        $stmtCheck = $pdo->prepare("
            SELECT COUNT(*) AS total FROM bank_transactions
            WHERE bank_account_id = ? AND business_id != ?
        ");
        $stmtCheck->execute([$accountId, $targetBusinessId]);
        $otherTxns = (int)$stmtCheck->fetch()['total'];

        if ($otherTxns > 0) {
            $_SESSION['flash_error'] = "This bank account cannot be converted to an individual business account because transactions already exist for other businesses.";
            header('Location: /bank_accounts.php');
            exit;
        }

        // Safe conversion
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE bank_accounts SET scope = 'individual', primary_business_id = ? WHERE id = ?")->execute([$targetBusinessId, $accountId]);
        $pdo->prepare("DELETE FROM business_bank_accounts WHERE bank_account_id = ?")->execute([$accountId]);
        $pdo->prepare("INSERT INTO business_bank_accounts (bank_account_id, business_id) VALUES (?, ?)")->execute([$accountId, $targetBusinessId]);
        $pdo->commit();

        $_SESSION['flash_success'] = "Successfully converted to Individual Business account.";
    } elseif ($account['scope'] === 'individual' && $targetScope === 'multiple') {
        $additional = $_POST['additional_business_ids'] ?? [];
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE bank_accounts SET scope = 'multiple' WHERE id = ?")->execute([$accountId]);

        $stmtRel = $pdo->prepare("INSERT IGNORE INTO business_bank_accounts (bank_account_id, business_id) VALUES (?, ?)");
        foreach ($additional as $bId) {
            $bId = (int)$bId;
            if (verify_business_ownership($pdo, $bId, $userId)) {
                $stmtRel->execute([$accountId, $bId]);
            }
        }
        $pdo->commit();
        $_SESSION['flash_success'] = "Successfully converted to Multiple Businesses shared bank account.";
    }

    header('Location: /bank_accounts.php');
    exit;
}
