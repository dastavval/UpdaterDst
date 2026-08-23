-- ============================================================
-- DASTAVVAL B2B PLATFORM - MYSQL / phpMyAdmin DATABASE DUMP
-- پایگاه داده پلتفرم بازرگانی دست اول (سازگار با تمامی نسخه‌های MySQL / MariaDB در cPanel)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. جدول محصولات (products)
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `bulk_price` DECIMAL(12,2) NOT NULL COMMENT 'قیمت هر عدد به تومان',
  `market_price` DECIMAL(12,2) DEFAULT NULL COMMENT 'قیمت مصرف کننده روی جلد',
  `carton_pack_count` INT NOT NULL DEFAULT 24 COMMENT 'تعداد در هر کارتن',
  `min_order_cartons` INT NOT NULL DEFAULT 5 COMMENT 'حداقل سفارش به کارتن',
  `image_url` VARCHAR(500) DEFAULT NULL,
  `factory_id` INT DEFAULT NULL,
  `stock_cartons` INT DEFAULT 500,
  `is_special` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`product_code`, `name`, `brand`, `category`, `description`, `bulk_price`, `market_price`, `carton_pack_count`, `min_order_cartons`, `image_url`, `stock_cartons`, `is_special`) VALUES
('PRD-101', 'دستمال کاغذی ۳۰۰ برگ دولایه', 'پریمیوم', 'محصولات سلولزی', 'دستمال کاغذی جعبه‌ای ۱۰۰٪ تیشو خارجی نرم و پر قدرت جذب بالا', 28500, 42000, 24, 10, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500', 1200, 1),
('PRD-102', 'مایع ظرفشویی ۴ لیتری لیمویی', 'پاک‌سان', 'شوینده و بهداشتی', 'مایع ظرفشویی غلیظ با کف فراوان و رایحه طبیعی لیمو ترش', 115000, 165000, 4, 15, 'https://images.unsplash.com/photo-1585830812416-a6c86bb14576?w=500', 800, 1),
('PRD-103', 'پودر لباسشویی دستی ۵۰۰ گرمی', 'درخشان', 'شوینده و بهداشتی', 'پودر آنزیم‌دار با قدرت لکه‌بری بالا و حفاظت از بافت پارچه', 18500, 26000, 24, 20, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500', 2500, 0),
('PRD-104', 'کنسرو تن ماهی ۱۸۰ گرمی در روغن گیاهی', 'جنوب', 'مواد غذایی و کنسرو', 'فیله کامل ماهی هوور درجه یک بدون تیغ و مواد نگهدارنده', 64000, 89000, 24, 5, 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500', 1500, 1),
('PRD-105', 'روغن آفتابگردان ۱.۸ لیتری خالص', 'طلایی', 'روغن و خواربار', 'روغن خالص تصفیه شده بدون کلسترول مناسب سرخ‌کردن و پخت‌وپز', 128000, 172000, 6, 12, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500', 950, 0);

-- 2. جدول کارخانه‌ها (factories)
DROP TABLE IF EXISTS `factories`;
CREATE TABLE `factories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `capacity_monthly` VARCHAR(100) DEFAULT '۵۰,۰۰۰ کارتن',
  `min_order_value` DECIMAL(15,2) DEFAULT 20000000.00,
  `produces` TEXT,
  `rating` DECIMAL(3,2) DEFAULT 4.80,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `verified` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `factories` (`name`, `city`, `province`, `produces`, `phone`) VALUES
('صنایع سلولزی پارس', 'ساوه', 'مرکزی', 'دستمال کاغذی، پوشک، حوله کاغذی', '02188881234'),
('مجتمع شیمیایی شوینده البرز', 'قزوین', 'قزوین', 'مایع ظرفشویی، پودر شوینده، سفیدکننده', '02833334567'),
('صنایع غذایی و کنسرو جنوب', 'بندرعباس', 'هرمزگان', 'تن ماهی، کنسروجات، رب گوجه‌فرنگی', '07633221100');

-- 3. جدول سفارشات (orders)
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tracking_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT DEFAULT NULL,
  `buyer_name` VARCHAR(150) NOT NULL,
  `buyer_phone` VARCHAR(50) NOT NULL,
  `buyer_company` VARCHAR(200) DEFAULT NULL,
  `buyer_address` TEXT,
  `total_amount` DECIMAL(15,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'cash',
  `status` VARCHAR(50) DEFAULT 'pending',
  `items_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول کاربران (users)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(50) NOT NULL UNIQUE,
  `company` VARCHAR(200) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'buyer',
  `badge` VARCHAR(50) DEFAULT 'bronze',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`name`, `mobile`, `company`, `city`, `role`, `badge`) VALUES
('مدیریت ارشد دست اول', '09120000000', 'دفتر مرکزی بازرگانی', 'تهران', 'admin', 'admin'),
('حاج علی محمدی', '09121112233', 'بنکداری محمدی', 'اصفهان', 'buyer', 'gold');

-- 5. جدول درخواست‌های تماس (callback_requests)
DROP TABLE IF EXISTS `callback_requests`;
CREATE TABLE `callback_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) DEFAULT 'ناشناس',
  `phone` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `note` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول اخبار بورس و بازار عمده (news)
DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NOT NULL,
  `content` LONGTEXT,
  `category` VARCHAR(100) DEFAULT 'اخبار صنایع',
  `image_url` VARCHAR(500) DEFAULT NULL,
  `date` VARCHAR(50) DEFAULT NULL,
  `views` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `news` (`title`, `summary`, `category`, `image_url`, `date`) VALUES
('افزایش عرضه مستقیم مواد شوینده از درب کارخانجات', 'توافق تولیدکنندگان بزرگ شوینده جهت نوسازی شبکه توزیع و تحویل بدون واسطه به بنکداران.', 'اخبار صنایع', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500', '۱۴۰۳/۰۶/۰۱'),
('افتتاح تالار اختصاصی خرید با چک صیادی در دست اول', 'تسهیلات ویژه بنکداران جهت ثبت سفارشات عمده کارتن و پالت با چک معتبر صیادی بنفش.', 'تسهیلات مالی', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500', '۱۴۰۳/۰۶/۰۲');

-- 7. جدول مقالات هوش مصنوعی و سئو مجله (articles)
DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT 'راهنمای خرید عمده',
  `image_url` VARCHAR(500) DEFAULT NULL,
  `source` VARCHAR(100) DEFAULT 'تحریریه دست‌اول',
  `date` VARCHAR(50) DEFAULT NULL,
  `read_time` VARCHAR(50) DEFAULT '۴ دقیقه',
  `is_ai_generated` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. جدول دسته‌بندی‌ها (categories)
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(100) DEFAULT 'Package',
  `image_url` VARCHAR(500) DEFAULT NULL,
  `display_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`code`, `name`, `icon`, `image_url`) VALUES
('CAT-101', 'تنقلات و شکلات', 'Package', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=500'),
('CAT-102', 'کیک، کلوچه و بیسکویت', 'Package', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500'),
('CAT-103', 'مواد غذایی و کنسروجات', 'Package', 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500'),
('CAT-104', 'نوشیدنی‌ها', 'Package', 'https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?w=500'),
('CAT-105', 'شوینده و بهداشتی', 'Package', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500');

-- 9. جدول تنظیمات B2B و برندینگ (settings)
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('app_name', 'دست اول'),
('app_sub', 'سامانه ملی استعلام و مبادلات مستقیم تولیدات کارخانه'),
('theme_color', 'emerald');

SET FOREIGN_KEY_CHECKS = 1;
