<?php
/**
 * DASTAVVAL B2B PLATFORM - Universal Smart Entry & Asset Proxy for Shared Hosting
 * نقطه ورود هوشمند و پروکسی دارایی‌های پلتفرم دست اول برای هاست‌های اشتراکی cPanel / DirectAdmin
 */
@ini_set('display_errors', '0');
@error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// 1. Handle API & Web-service requests passed through index.php
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'] ?? '';

if (strpos($path, '/api/') !== false || (isset($_GET['action']) && !empty($_GET['action']))) {
    if (file_exists(__DIR__ . '/php/api.php')) {
        require_once __DIR__ . '/php/api.php';
        exit();
    }
}

// 2. Handle Asset Requests seamlessly regardless of root or dist/assets location
if (preg_match('~(?:^|/)(?:dist/)?assets/([^?#]+\.(js|mjs|css|png|jpg|jpeg|svg|webp|woff2|woff|ttf|json|ico|map))$~i', $path, $matches)) {
    $assetFile = $matches[1];
    $targetPath = null;
    
    $candidatePaths = [
        __DIR__ . '/assets/' . $assetFile,
        __DIR__ . '/dist/assets/' . $assetFile,
        __DIR__ . '/' . $assetFile,
        __DIR__ . '/dist/' . $assetFile,
        __DIR__ . '/public/' . $assetFile
    ];
    
    foreach ($candidatePaths as $candidate) {
        if (file_exists($candidate) && is_file($candidate)) {
            $targetPath = $candidate;
            break;
        }
    }
    
    if ($targetPath && is_file($targetPath)) {
        $ext = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
        $mimes = [
            'js'    => 'application/javascript; charset=utf-8',
            'mjs'   => 'application/javascript; charset=utf-8',
            'css'   => 'text/css; charset=utf-8',
            'json'  => 'application/json; charset=utf-8',
            'svg'   => 'image/svg+xml',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'webp'  => 'image/webp',
            'woff2' => 'font/woff2',
            'woff'  => 'font/woff',
            'ttf'   => 'font/ttf',
            'ico'   => 'image/x-icon',
            'map'   => 'application/json'
        ];
        
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        header('Cache-Control: public, max-age=31536000, immutable');
        header('Access-Control-Allow-Origin: *');
        readfile($targetPath);
        exit();
    }
}

// 3. Handle root index.html serving
// Priority A: dist/index.html
if (file_exists(__DIR__ . '/dist/index.html')) {
    $html = file_get_contents(__DIR__ . '/dist/index.html');
    
    // If assets folder is only in dist/assets but not in root, rewrite relative ./assets/ to ./dist/assets/
    if (!is_dir(__DIR__ . '/assets') && is_dir(__DIR__ . '/dist/assets')) {
        $html = preg_replace('/(src|href)=([\'"])\.?\/?assets\//i', '$1=$2./dist/assets/', $html);
    }
    
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo $html;
    exit();
}

// Priority B: root index.html if already compiled
if (file_exists(__DIR__ . '/index.html')) {
    $content = file_get_contents(__DIR__ . '/index.html');
    
    // If index.html is already built (contains assets/ and not raw src/main.tsx)
    if (strpos($content, 'assets/') !== false && strpos($content, '/src/main.tsx') === false) {
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        echo $content;
        exit();
    }
}

// 4. Fallback: Diagnostic / Setup Guide if uncompiled raw source was uploaded
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>پلتفرم بازرگانی و خرید عمده دست اول | راهنمای استقرار روی هاست</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Vazirmatn', Tahoma, sans-serif; }
        body { background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { background: #ffffff; max-width: 640px; width: 100%; border-radius: 24px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; text-align: right; }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; }
        h1 { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 12px; line-height: 1.4; }
        p { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 20px; }
        .steps { background: #f1f5f9; border-radius: 16px; padding: 18px 24px; margin-bottom: 24px; }
        .steps li { margin-bottom: 10px; font-size: 13px; color: #334155; line-height: 1.6; list-style-position: inside; }
        .steps li:last-child { margin-bottom: 0; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 14px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.2s; cursor: pointer; }
        .btn-primary { background: #059669; color: #ffffff; }
        .btn-primary:hover { background: #047857; }
        .btn-secondary { background: #e2e8f0; color: #1e293b; }
        .btn-secondary:hover { background: #cbd5e1; }
        .code { font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 6px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">
            <span>●</span> سامانه استقرار و عیب‌یابی دست اول
        </div>
        <h1>آماده‌سازی پلتفرم روی هاست اشتراکی</h1>
        <p>
            فایل‌های سورس پلتفرم با موفقیت روی هاست آپلود شده است. برای اجرای سریع بدون صفحه سفید، می‌توانید از سامانه نصب و عیب‌یابی خودکار استفاده کنید یا محتویات پوشه <span class="code">dist</span> را در پوشه اصلی هاست قرار دهید.
        </p>

        <div class="steps">
            <ol>
                <li>جهت تست و رفع اشکال آنی پایگاه داده و بررسی فایل‌ها، روی <strong>عیب‌یابی و نصب خودکار</strong> کلیک کنید.</li>
                <li>فایل دیتابیس <span class="code">database.sql</span> را در <strong>phpMyAdmin</strong> ایمپورت کنید.</li>
                <li>اطلاعات اتصال دیتابیس را در فایل <span class="code">php/config.php</span> تنظیم فرمایید.</li>
            </ol>
        </div>

        <div class="actions">
            <a href="./installer.php" class="btn btn-primary">
                🔧 ورود به عیب‌یابی و نصب خودکار (Installer)
            </a>
            <a href="./php/api.php?action=get_products" class="btn btn-secondary">
                ⚡ بررسی صحت وب‌سرویس PHP
            </a>
        </div>
    </div>
</body>
</html>

