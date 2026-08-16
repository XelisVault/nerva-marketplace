-- NERVA Marketplace — Market Service schema (MySQL 8+)

CREATE DATABASE IF NOT EXISTS `market` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `market`;

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(32) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,         -- argon2id hash
    status ENUM('unverified','active','deactivated') DEFAULT 'unverified',
    is_vendor TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_validation_tokens (
    token CHAR(36) PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_username (username),
    CONSTRAINT fk_vt_user FOREIGN KEY (username)
        REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS listings (
    listing_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor VARCHAR(32) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(2048) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    price_xnv DECIMAL(20,8) NOT NULL,
    quantity_available INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_vendor (vendor),
    KEY idx_created (created_at),
    CONSTRAINT fk_list_vendor FOREIGN KEY (vendor)
        REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor VARCHAR(32) NOT NULL,
    buyer VARCHAR(32) NOT NULL,
    invoice_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_vendor (vendor),
    KEY idx_buyer (buyer),
    CONSTRAINT fk_order_vendor FOREIGN KEY (vendor)
        REFERENCES users(username) ON DELETE CASCADE,
    CONSTRAINT fk_order_buyer FOREIGN KEY (buyer)
        REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_listing_id INT NOT NULL,
    KEY idx_order (order_id),
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id)
        REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_listing FOREIGN KEY (item_listing_id)
        REFERENCES listings(listing_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_shipping (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    shipping_note TEXT NOT NULL,
    shipping_status ENUM('pending','shipped') DEFAULT 'pending',
    CONSTRAINT fk_os_order FOREIGN KEY (order_id)
        REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;
