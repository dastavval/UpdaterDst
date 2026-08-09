<?php
/**
 * DASTAVVAL B2B PLATFORM - PHP Backend API for LAMP Stack / cPanel
 * ای‌پی‌آی کامل PHP برای هاست‌های cPanel و دیتابیس phpMyAdmin
 */

require_once __DIR__ . '/config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    // ۱. دریافت لیست محصولات
    case 'get_products':
        try {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
            $products = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $products], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    // ۲. ثبت سفارش جدید در phpMyAdmin / MySQL
    case 'create_order':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['buyer_phone']) || empty($input['total_amount'])) {
            echo json_encode(['status' => 'error', 'message' => 'اطلاعات سفارش ناقص است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $tracking_number = 'DST-' . rand(100000, 999999);
        $buyer_name = $input['buyer_name'] ?? 'خریدار محترم';
        $buyer_phone = $input['buyer_phone'];
        $buyer_company = $input['buyer_company'] ?? '';
        $buyer_address = $input['buyer_address'] ?? '';
        $total_amount = $input['total_amount'];
        $items_json = json_encode($input['items'] ?? [], JSON_UNESCAPED_UNICODE);

        try {
            $stmt = $pdo->prepare("INSERT INTO orders (tracking_number, buyer_name, buyer_phone, buyer_company, buyer_address, total_amount, items_json) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$tracking_number, $buyer_name, $buyer_phone, $buyer_company, $buyer_address, $total_amount, $items_json]);
            echo json_encode(['status' => 'success', 'tracking_number' => $tracking_number, 'message' => 'سفارش با موفقیت ثبت شد.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'خطا در ثبت سفارش: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    // ۳. ثبت درخواست تماس مشاوره
    case 'add_callback':
        $input = json_decode(file_get_contents('php://input'), true);
        $phone = $input['phone'] ?? '';
        $name = $input['name'] ?? 'ناشناس';

        if (empty($phone)) {
            echo json_encode(['status' => 'error', 'message' => 'شماره تماس الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO callback_requests (name, phone) VALUES (?, ?)");
            $stmt->execute([$name, $phone]);
            echo json_encode(['status' => 'success', 'message' => 'درخواست تماس با موفقیت ثبت شد.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    // ۴. دریافت لیست کارخانه‌ها
    case 'get_factories':
        try {
            $stmt = $pdo->query("SELECT * FROM factories ORDER BY id DESC");
            $factories = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $factories], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        echo json_encode([
            'status' => 'online',
            'platform' => 'Dastavval B2B PHP / cPanel Engine',
            'version' => '2.5.0',
            'message' => 'سرویس PHP و phpMyAdmin پلتفرم دست اول فعال است.'
        ], JSON_UNESCAPED_UNICODE);
        break;
}
