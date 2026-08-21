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

    // پروکسی هوشمند برای دریافت فایل‌های JSON کاتالوگ و بای‌پاس CORS روی cPanel/LAMP
    case 'proxy-fetch':
    case 'proxy_fetch':
        $input = json_decode(file_get_contents('php://input'), true);
        $url = $input['url'] ?? $_GET['url'] ?? $_POST['url'] ?? '';

        if (empty($url)) {
            http_response_code(400);
            echo json_encode(['error' => 'پارامتر URL الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $url = trim($url);
        if (strpos($url, '.parspack.net') !== false && strpos($url, 'https://') === 0) {
            $url = str_replace('https://', 'http://', $url);
        }
        if (strpos($url, 'http://') !== 0 && strpos($url, 'https://') !== 0) {
            $url = 'http://' . $url;
        }

        $response = false;

        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json, text/plain, */*',
                'Cache-Control: no-cache'
            ]);
            $response = curl_exec($ch);
            curl_close($ch);
        }

        if ($response === false || empty($response)) {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\nAccept: application/json, text/plain, */*\r\n",
                    'timeout' => 15
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);
            $response = @file_get_contents($url, false, $context);
        }

        if ($response === false || $response === null || strlen(trim($response)) === 0) {
            http_response_code(502);
            echo json_encode(['error' => 'خطا در دریافت پاسخ از سرور مبدا یا لینک باکت.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $cleanText = preg_replace('/^\xEF\xBB\xBF/', '', trim($response));
        header('Content-Type: application/json; charset=utf-8');
        echo $cleanText;
        exit();

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
