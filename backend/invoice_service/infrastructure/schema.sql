-- NERVA Marketplace — Invoice Service schema (MySQL 8+)

CREATE DATABASE IF NOT EXISTS `invoices_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `invoices_db`;

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    amount DECIMAL(20,8) NOT NULL,
    address VARCHAR(105) NOT NULL UNIQUE,
    status ENUM('pending','confirmed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_status (status),
    KEY idx_created (created_at)
) ENGINE=InnoDB;
