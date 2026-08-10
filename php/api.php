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

        // استخراج فوق‌العاده هوشمندانه و تمیز owner/repo از انواع فرمت‌های ورودی
        // مانند: https://github.com/owner/repo.git, github.com/owner/repo, owner/repo
        $ownerRepo = '';
        if (preg_match('/(?:github\.com\/|repos\/|^)([^\/\s\?\#]+)\/([^\/\.\?\s\#]+)/i', $repoUrl, $matches)) {
            $ownerRepo = trim($matches[1]) . '/' . preg_replace('/\.git$/i', '', trim($matches[2]));
        } else {
            $cleanUrl = preg_replace('/\.git$/i', '', $repoUrl);
            $parts = parse_url($cleanUrl);
            $path = isset($parts['path']) ? trim($parts['path'], '/') : '';
            $ownerRepo = $path;
        }

        if (empty($ownerRepo) || strpos($ownerRepo, '/') === false) {
            echo json_encode(['success' => false, 'error' => 'فرمت آدرس یا نام مخزن گیت‌هاب نامعتبر است. نمونه صحیح: username/repository'], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // ساخت آدرس‌های کاندید برای دانلود فایل ZIP
        $zipUrls = [
            "https://codeload.github.com/" . $ownerRepo . "/zip/refs/heads/" . $branch,
            "https://github.com/" . $ownerRepo . "/archive/refs/heads/" . $branch . ".zip",
            "https://api.github.com/repos/" . $ownerRepo . "/zipball/" . $branch,
            "https://codeload.github.com/" . $ownerRepo . "/zip/refs/heads/main",
            "https://github.com/" . $ownerRepo . "/archive/refs/heads/main.zip",
            "https://codeload.github.com/" . $ownerRepo . "/zip/refs/heads/master",
            "https://github.com/" . $ownerRepo . "/archive/refs/heads/master.zip"
        ];

        $zipData = '';
        $httpCode = 0;
        $attemptedUrls = [];
        $successfulUrl = '';
        $downloadMethod = '';

        // تابع کمکی اختصاصی برای دریافت محتوا با مدیریت کامل Redirectها بدون وابستگی به CURLOPT_FOLLOWLOCATION (سازگار با open_basedir هاست‌های ایران)
        $fetchUrlWithRedirects = function($url, $token, &$lastCode) {
            $currentUrl = $url;
            $maxRedirects = 10;
            $redirectCount = 0;

            while ($redirectCount < $maxRedirects) {
                $isS3orCodeload = (
                    strpos($currentUrl, 'objects.githubusercontent.com') !== false ||
                    strpos($currentUrl, 'codeload.github.com') !== false ||
                    strpos($currentUrl, 'Signature=') !== false ||
                    strpos($currentUrl, 'X-Amz-') !== false
                );

                if (function_exists('curl_init')) {
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $currentUrl);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HEADER, true);
                    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dastavval-Updater/5.0');
                    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

                    $headers = [
                        'Accept: application/vnd.github+json, application/zip, application/octet-stream, */*',
                        'User-Agent: Dastavval-Updater/5.0'
                    ];
                    if (!empty($token) && !$isS3orCodeload && (strpos($currentUrl, 'github.com') !== false || strpos($currentUrl, 'api.github.com') !== false)) {
                        $headers[] = "Authorization: Bearer " . $token;
                    }
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

                    $response = curl_exec($ch);
                    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
                    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);

                    $lastCode = $code;

                    if ($code >= 300 && $code < 400 && !empty($response)) {
                        $headerText = substr($response, 0, $headerSize);
                        if (preg_match('/Location:\s*([^\s\r\n]+)/i', $headerText, $locMatches)) {
                            $currentUrl = trim($locMatches[1]);
                            $redirectCount++;
                            continue;
                        }
                    }

                    if ($code === 200 && !empty($response)) {
                        $body = substr($response, $headerSize);
                        if (strlen($body) > 100 && substr($body, 0, 4) === "PK\x03\x04") {
                            return $body;
                        }
                    }
                }

                // Fallback stream context
                if (ini_get('allow_url_fopen')) {
                    $headers_arr = [
                        'User-Agent: Dastavval-Updater/5.0',
                        'Accept: application/vnd.github+json, application/zip, application/octet-stream, */*'
                    ];
                    if (!empty($token) && !$isS3orCodeload && (strpos($currentUrl, 'github.com') !== false || strpos($currentUrl, 'api.github.com') !== false)) {
                        $headers_arr[] = "Authorization: Bearer " . $token;
                    }

                    $opts = [
                        'http' => [
                            'method' => 'GET',
                            'header' => implode("\r\n", $headers_arr),
                            'follow_location' => 1,
                            'timeout' => 60,
                            'ignore_errors' => true
                        ],
                        'ssl' => [
                            'verify_peer' => false,
                            'verify_peer_name' => false
                        ]
                    ];
                    $context = stream_context_create($opts);
                    $body = @file_get_contents($currentUrl, false, $context);
                    
                    if (!empty($body) && strlen($body) > 100 && substr($body, 0, 4) === "PK\x03\x04") {
                        $lastCode = 200;
                        return $body;
                    }
                }

                break;
            }
            return null;
        };

        foreach ($zipUrls as $url) {
            $attemptedUrls[] = $url;
            $data = $fetchUrlWithRedirects($url, $token, $httpCode);
            if (!empty($data)) {
                $zipData = $data;
                $successfulUrl = $url;
                $downloadMethod = 'curl_safe_redirect';
                break;
            }
        }

        if (empty($zipData)) {
            echo json_encode([
                'success' => false, 
                'error' => 'خطا در دریافت فایل فشرده معتبر سورس‌کد از گیت‌هاب (کد آخرین پاسخ: ' . $httpCode . '). لطفاً مطمئن شوید که مخزن ' . $ownerRepo . ' عمومی (Public) است، یا توکن دسترسی معتبر (PAT) وارد کرده‌اید، و نام شاخه (' . $branch . ') کاملاً درست است.',
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
            
            // تشخیص فوق‌العاده هوشمندانه روت‌پرفیکس بر اساس بیشترین تکرار پوشه فرعی گیت‌هاب
            $dirCounts = [];
            for ($k = 0; $k < $zip->numFiles; $k++) {
                $name = $zip->getNameIndex($k);
                $parts = explode('/', $name);
                if (count($parts) > 1 && !empty($parts[0])) {
                    $top = $parts[0] . '/';
                    if ($top !== '__MACOSX/') {
                        $dirCounts[$top] = isset($dirCounts[$top]) ? $dirCounts[$top] + 1 : 1;
                    }
                }
            }
            $maxC = 0;
            foreach ($dirCounts as $dirName => $count) {
                if ($count > $maxC) {
                    $maxC = $count;
                    $rootPrefix = $dirName;
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
