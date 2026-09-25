# PHP Multi-Business Account Management & Basic Accounting System

A production-grade, secure, database-driven multi-business accounting system built with **PHP (PDO) + MySQL**.

## Architecture & Database Tables

1. `users` – User accounts, authentication, session data, and per-user business limits.
2. `businesses` – Business metadata, address, contact, currency, tax number, status.
3. `product_categories` – Business-isolated product categories.
4. `products` – Multi-product catalog with SKU, cost price, sale price, weight, images, and live stock.
5. `customers` – Client accounts, opening balance, and receivables ledger.
6. `suppliers` – Vendor accounts, opening balance, and payables ledger.
7. `bank_accounts` – Individual business and multi-business shared treasury accounts.
8. `business_bank_accounts` – Normalized many-to-many relationship mapping bank accounts to businesses.
9. `bank_transactions` – Bank ledger tracking deposits, withdrawals, and originating `business_id`.
10. `invoices` & `invoice_items` – Sales invoicing with visual card-based selection and auto-stock reduction.
11. `receipts` – Customer payment receipts with automatic bank balance and receivable ledger updating.
12. `bills` & `bill_items` – Purchase bills increasing stock and payable ledger.
13. `payments` – Vendor payments deducting bank balance and payable ledger.
14. `ledger_entries` – Strict double-entry accounting records with running balance computation.
15. `stock_transactions` – Stock movement logs (In, Out, Opening, Reversals).
16. `system_settings` – Global business limit and enterprise configuration.

## Key Features

- **Strict Business Isolation**: Every entity is scoped by `business_id`. Data never leaks across business accounts.
- **Admin Panel & Limits**:
  - Global maximum businesses limit per user.
  - Per-user custom limit overrides.
  - Decreasing limits preserves existing business records while blocking new creation until limit criteria are satisfied.
- **Multi-Business Shared Banking**:
  - Create Individual Business or Multiple Businesses bank accounts.
  - Combined bank statements vs. Business-Specific bank statements.
  - Safe Scope Conversion: Allows Individual -> Multiple; blocks Multiple -> Individual if transactions exist for other businesses.
- **Accounting & Stock Automation**:
  - Invoices automatically increment customer receivable and decrement stock.
  - Receipts automatically decrement customer receivable and deposit to selected bank account.
  - Bills automatically increment supplier payable and increment stock.
  - Payments automatically decrement supplier payable and withdraw from selected bank account.
  - Full reversal on cancellation.

## Quick Installation on LAMP / XAMPP / cPanel

1. Create a MySQL database (e.g. `multi_business_accounting`).
2. Import `schema.sql` using phpMyAdmin or CLI:
   ```bash
   mysql -u root -p multi_business_accounting < schema.sql
   ```
3. Configure DB credentials in `config/db.php`.
4. Run via local PHP built-in server or Apache:
   ```bash
   php -S 0.0.0.0:8000
   ```
5. Default Logins:
   - **Admin**: `admin@accounting.com` / `admin123`
   - **Merchant**: `merchant@example.com` / `merchant123`
