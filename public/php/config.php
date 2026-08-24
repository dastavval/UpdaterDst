<?php
/**
 * DASTAVVAL B2B PLATFORM - PHP / LAMP Database Configuration
 * تنظیمات اتصال به دیتابیس MySQL برای cPanel و phpMyAdmin
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ⚙️ اطلاعات دیتابیس cPanel شما:
$db_host = 'localhost';
$db_name = 'h353256_dast';  // نام دیتابیس cPanel
$db_user = 'h353256_dst';   // نام کاربری دیتابیس cPanel
$db_pass = '@Ali3360@Ali3360'; // رمز عبور دیتابیس

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);
    
    // Ensure cheque_allowed and disabled columns exist in products table
    try {
        // Ensure site_settings table exists
        $pdo->exec("CREATE TABLE IF NOT EXISTS `site_settings` (
            `setting_key` VARCHAR(100) PRIMARY KEY,
            `setting_value` LONGTEXT NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $checkCol = $pdo->query("SHOW COLUMNS FROM products LIKE 'cheque_allowed'");
        if (!$checkCol->fetch()) {
            $pdo->exec("ALTER TABLE products ADD COLUMN cheque_allowed TINYINT(1) DEFAULT 1");
        }
        $checkCol2 = $pdo->query("SHOW COLUMNS FROM products LIKE 'disabled'");
        if (!$checkCol2->fetch()) {
            $pdo->exec("ALTER TABLE products ADD COLUMN disabled TINYINT(1) DEFAULT 0");
        }
    } catch (Exception $colEx) {
        // Fallback or table doesn't exist yet (will be created or handled)
    }
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'خطا در اتصال به دیتابیس MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
