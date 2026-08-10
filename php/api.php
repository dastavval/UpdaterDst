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

    // ۵. بروزرسانی سورس‌کد و دیتابیس مستقیم از مخزن گیت‌هاب (GitHub Auto Sync & Deploy)
    case 'admin/github-update':
        header('Content-Type: application/json; charset=utf-8');
        $input = json_decode(file_get_contents('php://input'), true);
        $repoUrl = isset($input['repoUrl']) ? trim($input['repoUrl']) : '';
        $branch = isset($input['branch']) ? trim($input['branch']) : 'main';
        $token = isset($input['token']) ? trim($input['token']) : '';

        if (empty($repoUrl)) {
            echo json_encode(['success' => false, 'error' => 'آدرس مخزن گیت‌هاب الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // تمیز کردن آدرس مخزن گیت‌هاب
        $cleanRepoUrl = preg_replace('/\.git$/', '', $repoUrl);
        $parts = parse_url($cleanRepoUrl);
        $path = isset($parts['path']) ? trim($parts['path'], '/') : '';
        
        if (empty($path)) {
            echo json_encode(['success' => false, 'error' => 'فرمت آدرس مخزن نامعتبر است.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // ساخت آدرس‌های کاندید برای دانلود فایل ZIP (تغییر اولویت برای آدرس‌های بدون ریت‌لیمیت)
        $zipUrls = [
            "https://codeload.github.com/" . $path . "/zip/refs/heads/" . $branch,
            "https://api.github.com/repos/" . $path . "/zipball/" . $branch,
            "https://github.com/" . $path . "/archive/refs/heads/" . $branch . ".zip"
        ];

        $zipData = '';
        $httpCode = 0;
        $attemptedUrls = [];
        $successfulUrl = '';
        $downloadMethod = '';

        foreach ($zipUrls as $url) {
            $attemptedUrls[] = $url;
            
            // روش ۱: استفاده از Curl با تنظیمات پیشرفته و لغو تایید هویت برای پیشگیری از دیواره‌های آتش
            if (function_exists('curl_init')) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (PHP) Dastavval-Updater/3.0');
                curl_setopt($ch, CURLOPT_TIMEOUT, 90);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

                $headers = [
                    'Accept: application/vnd.github+json',
                    'User-Agent: Dastavval-Updater/3.0'
                ];

                if (!empty($token)) {
                    $headers[] = "Authorization: Bearer " . $token;
                }

                curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

                $data = curl_exec($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($code === 200 && !empty($data) && strlen($data) > 100) {
                    if (substr($data, 0, 4) === "PK\x03\x04") {
                        $zipData = $data;
                        $httpCode = $code;
                        $successfulUrl = $url;
                        $downloadMethod = 'curl';
                        break;
                    }
                }
                $httpCode = $code;
            }

            // روش ۲: تلاش مجدد با file_get_contents و Stream Context در صورت غیرفعال بودن یا لکنت Curl
            if (ini_get('allow_url_fopen')) {
                $headers_arr = [
                    'User-Agent: Dastavval-Updater/3.0',
                    'Accept: application/vnd.github+json'
                ];
                if (!empty($token)) {
                    $headers_arr[] = "Authorization: Bearer " . $token;
                }

                $opts = [
                    'http' => [
                        'method' => 'GET',
                        'header' => implode("\r\n", $headers_arr),
                        'follow_location' => 1,
                        'timeout' => 90,
                        'ignore_errors' => true
                    ],
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false
                    ]
                ];
                $context = stream_context_create($opts);
                $data = @file_get_contents($url, false, $context);
                
                $code = 0;
                if (isset($http_response_header) && is_array($http_response_header)) {
                    foreach ($http_response_header as $header) {
                        if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/i', $header, $matches)) {
                            $code = intval($matches[1]);
                            break;
                        }
                    }
                }

                if (($code === 200 || $code === 0) && !empty($data) && strlen($data) > 100) {
                    if (substr($data, 0, 4) === "PK\x03\x04") {
                        $zipData = $data;
                        $httpCode = ($code === 0) ? 200 : $code;
                        $successfulUrl = $url;
                        $downloadMethod = 'file_get_contents';
                        break;
                    }
                }
                $httpCode = $code;
            }
        }

        if (empty($zipData)) {
            echo json_encode([
                'success' => false, 
                'error' => 'خطا در دریافت فایل فشرده معتبر سورس‌کد از گیت‌هاب (کد آخرین پاسخ: ' . $httpCode . '). لطفا مطمئن شوید که مخزن شما عمومی (Public) است، یا توکن دسترسی معتبر (PAT) وارد کرده‌اید، و نام شاخه (Branch) کاملاً درست است.',
                'attempted_urls' => $attemptedUrls
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // ذخیره موقت فایل فشرده
        $tempZip = sys_get_temp_dir() . '/dastavval_update_' . time() . '.zip';
        file_put_contents($tempZip, $zipData);

        if (!class_exists('ZipArchive')) {
            echo json_encode(['success' => false, 'error' => 'افزونه ZipArchive در این سرور فعال نیست. لطفا این افزونه را در تنظیمات PHP هاست فعال کنید.'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $zip = new ZipArchive();
        if ($zip->open($tempZip) === TRUE) {
            $root_dir = dirname(__DIR__); // روت اصلی هاست
            $rootPrefix = '';
            
            // تشخیص فوق‌العاده هوشمندانه روت‌پرفیکس (پوشه اتوماتیک ساخته شده توسط گیت‌هاب)
            if ($zip->numFiles > 0) {
                $firstEntry = $zip->getNameIndex(0);
                $firstParts = explode('/', $firstEntry);
                if (count($firstParts) > 1 && !empty($firstParts[0])) {
                    $candidate = $firstParts[0] . '/';
                    $allStartWithCandidate = true;
                    for ($k = 0; $k < $zip->numFiles; $k++) {
                        $name = $zip->getNameIndex($k);
                        if (strpos($name, $candidate) !== 0) {
                            $allStartWithCandidate = false;
                            break;
                        }
                    }
                    if ($allStartWithCandidate) {
                        $rootPrefix = $candidate;
                    }
                }
            }

            $updatedFilesCount = 0;
            $excludes = ["node_modules", ".git", ".env"];

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entryName = $zip->getNameIndex($i);
                $relPath = $entryName;
                
                if (!empty($rootPrefix) && strpos($entryName, $rootPrefix) === 0) {
                    $relPath = substr($entryName, strlen($rootPrefix));
                }

                if (empty($relPath)) continue;

                $topDir = explode('/', $relPath)[0];
                if (in_array($topDir, $excludes) || in_array($relPath, $excludes)) {
                    continue;
                }

                // اگر فایل‌ها داخل پوشه dist بودن، مستقیم در پوشه روت استخراج شوند
                if (strpos($relPath, 'dist/') === 0) {
                    $relPath = substr($relPath, 5);
                }

                if (empty($relPath)) continue;

                $targetPath = $root_dir . '/' . $relPath;

                if (substr($entryName, -1) === '/') {
                    if (!is_dir($targetPath)) {
                        @mkdir($targetPath, 0755, true);
                    }
                    continue;
                }

                $parentDir = dirname($targetPath);
                if (!is_dir($parentDir)) {
                    @mkdir($parentDir, 0755, true);
                }

                $content = $zip->getFromIndex($i);
                @file_put_contents($targetPath, $content);
                $updatedFilesCount++;
            }

            $zip->close();
            @unlink($tempZip);

            // همگام‌سازی اتوماتیک دیتابیس در صورت وجود فایل database.sql
            $databaseUpdated = false;
            $databaseError = '';
            $dbFile = $root_dir . '/database.sql';
            if (file_exists($dbFile)) {
                try {
                    $sqlContent = file_get_contents($dbFile);
                    // حذف کامنت‌ها برای جلوگیری از بروز خطا در سرویس PDO
                    $sqlContent = preg_replace('/--.*\n/', '', $sqlContent);
                    $sqlContent = preg_replace('/\/\*.*?\*\//s', '', $sqlContent);
                    
                    // تکه‌تکه کردن دستورات بر اساس سمی‌کالن (;) جهت اجرای خط به خط و دقیق‌تر
                    $queries = explode(';', $sqlContent);
                    foreach ($queries as $query) {
                        $query = trim($query);
                        if (!empty($query)) {
                            $pdo->exec($query);
                        }
                    }
                    $databaseUpdated = true;
                } catch (PDOException $e) {
                    $databaseError = $e->getMessage();
                }
            }

            echo json_encode([
                'success' => true,
                'message' => $databaseUpdated 
                    ? 'کدها و ساختار دیتابیس MySQL با موفقیت مستقیم از مخزن گیت‌هاب دریافت، همگام‌سازی و جایگزین شدند!'
                    : 'کدها با موفقیت دریافت و اعمال شدند. (دیتابیس بدون تغییر یا با خطا مواجه شد)',
                'updatedFilesCount' => $updatedFilesCount,
                'databaseUpdated' => $databaseUpdated,
                'databaseError' => $databaseError,
                'download_method' => $downloadMethod
            ], JSON_UNESCAPED_UNICODE);
        } else {
            @unlink($tempZip);
            echo json_encode(['success' => false, 'error' => 'خطا در باز کردن و استخراج فایل فشرده ZIP.'], JSON_UNESCAPED_UNICODE);
        }
        exit();

    default:
        echo json_encode([
            'status' => 'online',
            'platform' => 'Dastavval B2B PHP / cPanel Engine',
            'version' => '2.5.0',
            'message' => 'سرویس PHP و phpMyAdmin پلتفرم دست اول فعال است.'
        ], JSON_UNESCAPED_UNICODE);
        break;
}
