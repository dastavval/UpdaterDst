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
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'خطا در اتصال به دیتابیس MySQL: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
