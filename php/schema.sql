-- Multi-Business Accounting System Database Schema
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `stock_transactions`;
DROP TABLE IF EXISTS `ledger_entries`;
DROP TABLE IF EXISTS `bank_transactions`;
DROP TABLE IF EXISTS `business_bank_accounts`;
DROP TABLE IF EXISTS `bank_accounts`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `receipts`;
DROP TABLE IF EXISTS `bill_items`;
DROP TABLE IF EXISTS `bills`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `product_categories`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `businesses`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `users`;

-- 1. Users Table (Supports standard email/pass, Google OAuth 2.0, and Linked accounts)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL DEFAULT NULL COMMENT 'NULL for Google-only authentication',
  `google_id` VARCHAR(191) NULL UNIQUE COMMENT 'Google OAuth subject identifier',
  `profile_image` TEXT NULL,
  `auth_provider` ENUM('email', 'google', 'linked') NOT NULL DEFAULT 'email',
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `business_limit` INT NULL DEFAULT NULL COMMENT 'NULL = follow global limit',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. System Settings Table
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Businesses Table
CREATE TABLE `businesses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `logo` TEXT NULL,
  `icon` VARCHAR(50) DEFAULT '🏢',
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `tax_number` VARCHAR(50) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product Categories
CREATE TABLE `product_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_cat_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Products Table
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `purchase_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `weight` VARCHAR(50) NULL,
  `image` TEXT NULL,
  `opening_stock` INT NOT NULL DEFAULT 0,
  `current_stock` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT,
  INDEX `idx_prod_business` (`business_id`),
  INDEX `idx_prod_sku` (`business_id`, `sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Customers Table
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `opening_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_cust_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Suppliers Table
CREATE TABLE `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `opening_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_supp_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bank Accounts Table (Supports Individual & Multiple Business scope)
CREATE TABLE `bank_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `primary_business_id` INT NOT NULL,
  `bank_name` VARCHAR(150) NOT NULL,
  `account_title` VARCHAR(150) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `account_type` VARCHAR(100) NOT NULL DEFAULT 'Checking',
  `opening_balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `scope` ENUM('individual', 'multiple') NOT NULL DEFAULT 'individual',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`primary_business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Business Bank Account Relational Table
CREATE TABLE `business_bank_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_account_id` INT NOT NULL,
  `business_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_bank_biz` (`bank_account_id`, `business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bank Transactions Table (Each transaction retains originating business_id)
CREATE TABLE `bank_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_account_id` INT NOT NULL,
  `business_id` INT NOT NULL,
  `transaction_type` ENUM('deposit', 'withdrawal') NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `reference_type` ENUM('receipt', 'payment', 'opening', 'manual') NOT NULL,
  `reference_id` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `transaction_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_btxn_bank` (`bank_account_id`),
  INDEX `idx_btxn_biz` (`business_id`),
  INDEX `idx_btxn_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Invoices Table
CREATE TABLE `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `invoice_number` VARCHAR(100) NOT NULL,
  `invoice_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `status` ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
  INDEX `idx_inv_biz` (`business_id`),
  INDEX `idx_inv_cust` (`customer_id`),
  INDEX `idx_inv_num` (`business_id`, `invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Invoice Items Table
CREATE TABLE `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `product_sku` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Receipts Table (Customer Payments)
CREATE TABLE `receipts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `bank_account_id` INT NOT NULL,
  `receipt_number` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `status` ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT,
  INDEX `idx_rec_biz` (`business_id`),
  INDEX `idx_rec_cust` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bills Table (Purchase Bills)
CREATE TABLE `bills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `supplier_id` INT NOT NULL,
  `bill_number` VARCHAR(100) NOT NULL,
  `bill_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `status` ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT,
  INDEX `idx_bill_biz` (`business_id`),
  INDEX `idx_bill_supp` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Bill Items Table
CREATE TABLE `bill_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bill_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `product_sku` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Payments Table (Supplier Payments)
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `supplier_id` INT NOT NULL,
  `bank_account_id` INT NOT NULL,
  `payment_number` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `status` ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON DELETE RESTRICT,
  INDEX `idx_pay_biz` (`business_id`),
  INDEX `idx_pay_supp` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Ledger Entries Table (Double-Entry Log)
CREATE TABLE `ledger_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `entity_type` ENUM('customer', 'supplier', 'bank', 'sales', 'purchases') NOT NULL,
  `entity_id` INT NOT NULL,
  `reference_type` ENUM('invoice', 'receipt', 'bill', 'payment', 'opening') NOT NULL,
  `reference_id` VARCHAR(100) NOT NULL,
  `transaction_date` DATE NOT NULL,
  `debit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `credit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `running_balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `description` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_ledg_biz_entity` (`business_id`, `entity_type`, `entity_id`),
  INDEX `idx_ledg_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Stock Transactions Table
CREATE TABLE `stock_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `transaction_type` ENUM('in', 'out', 'opening', 'reversal_in', 'reversal_out') NOT NULL,
  `quantity` INT NOT NULL,
  `unit_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `reference_type` ENUM('invoice', 'bill', 'opening', 'manual') NOT NULL,
  `reference_id` VARCHAR(100) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_stk_biz_prod` (`business_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Warehouses Table
CREATE TABLE `warehouses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `manager` VARCHAR(191) NULL,
  `capacity` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  INDEX `idx_wh_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Warehouse Product Stocks Table
CREATE TABLE `warehouse_product_stocks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `warehouse_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_wh_prod` (`warehouse_id`, `product_id`),
  INDEX `idx_wh_stock_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Stock Transfers Table
CREATE TABLE `stock_transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `from_warehouse_id` INT NOT NULL,
  `to_warehouse_id` INT NOT NULL,
  `transfer_number` VARCHAR(100) NOT NULL,
  `transfer_date` DATE NOT NULL,
  `reference` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `status` ENUM('completed', 'pending', 'cancelled') NOT NULL DEFAULT 'completed',
  `total_quantity` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT,
  INDEX `idx_st_biz` (`business_id`),
  INDEX `idx_st_from` (`from_warehouse_id`),
  INDEX `idx_st_to` (`to_warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Stock Transfer Items Table
CREATE TABLE `stock_transfer_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `product_sku` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL,
  FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Initial Seed Data
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('max_businesses_per_user', '5');

-- Default Users
-- 1. Admin (Email/Password)
-- 2. Merchant (Email/Password)
-- 3. Google User (Google-authenticated)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `google_id`, `profile_image`, `auth_provider`, `email_verified`, `role`, `business_limit`) VALUES
(1, 'Super Administrator', 'admin@accounting.com', '$2y$10$wKqK038.iQnEszb/zN3HNu30G5n8sO3KmsLzTjKk4.lW5sXh8rXq6', NULL, NULL, 'email', 1, 'admin', NULL),
(2, 'Hassan Merchant', 'merchant@example.com', '$2y$10$wKqK038.iQnEszb/zN3HNu30G5n8sO3KmsLzTjKk4.lW5sXh8rXq6', NULL, NULL, 'email', 1, 'user', 5),
(3, 'Sarah Chen', 'sarah.chen@gmail.com', NULL, 'google_1098234871923847', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80', 'google', 1, 'user', NULL);
