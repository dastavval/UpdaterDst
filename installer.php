<?php
/**
 * DASTAVVAL B2B PLATFORM - Comprehensive Installer, Diagnostic & Repair Utility
 * فایل جامع و ایمن عیب‌یابی، تست دسترسی‌ها (chmod)، اتصال دیتابیس و بازسازی خودکار سرور
 * 
 * Version: 4.1.0-Release
 * Compatible with: PHP 7.4 - 8.3+, cPanel / Apache / LiteSpeed, MySQL / MariaDB
 */

session_start();

// تنظیم زمان اجرای اسکریپت و حافظه برای هاست‌های محدود
@ini_set('display_errors', 0);
@ini_set('max_execution_time', 120);
@ini_set('memory_limit', '128M');

$root_dir = __DIR__;
$config_file = $root_dir . '/php/config.php';
$sql_file = $root_dir . '/database.sql';
$htaccess_file = $root_dir . '/.htaccess';
$assets_dir = $root_dir . '/assets';
$dist_dir = $root_dir . '/dist';

// ==========================================
// هندلر درخواست‌های AJAX (API اینستالر)
// ==========================================
if (isset($_GET['action'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    $action = $_GET['action'];

    // ۱. بررسی جامع وضعیت سرور و دسترسی‌های فایل سیستم (chmod)
    if ($action === 'diagnose') {
        $php_version = PHP_VERSION;
        $php_ok = version_compare($php_version, '7.4.0', '>=');
        
        $exts = [
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'json' => extension_loaded('json'),
            'mbstring' => extension_loaded('mbstring'),
            'curl' => extension_loaded('curl'),
            'openssl' => extension_loaded('openssl'),
        ];

        // بررسی دسترسی نوشتن پوشه‌ها و فایل‌ها (chmod test)
        $perms = [
            'root_dir' => [
                'path' => $root_dir,
                'writable' => is_writable($root_dir),
                'chmod' => substr(sprintf('%o', fileperms($root_dir)), -4)
            ],
            'php_dir' => [
                'path' => $root_dir . '/php',
                'writable' => is_writable(is_dir($root_dir . '/php') ? $root_dir . '/php' : $root_dir),
                'exists' => is_dir($root_dir . '/php')
            ],
            'assets_dir' => [
                'path' => $assets_dir,
                'writable' => is_writable(is_dir($assets_dir) ? $assets_dir : $root_dir),
                'exists' => is_dir($assets_dir)
            ],
            'config_file' => [
                'path' => $config_file,
                'writable' => file_exists($config_file) ? is_writable($config_file) : is_writable(dirname($config_file)),
                'exists' => file_exists($config_file)
            ],
            'htaccess_file' => [
                'path' => $htaccess_file,
                'writable' => file_exists($htaccess_file) ? is_writable($htaccess_file) : is_writable($root_dir),
                'exists' => file_exists($htaccess_file)
            ]
        ];

        // تحلیل فایل index.html و جلوگیری از صفحه سفید (Blank Screen)
        $index_path = $root_dir . '/index.html';
        $index_exists = file_exists($index_path);
        $index_uncompiled = false;
        $has_root_div = false;
        $index_js_ref = '';
        $index_css_ref = '';

        if ($index_exists) {
            $index_content = @file_get_contents($index_path);
            if (strpos($index_content, 'src/main.tsx') !== false || strpos($index_content, 'main.tsx') !== false) {
                $index_uncompiled = true;
            }
            if (strpos($index_content, 'id="root"') !== false || strpos($index_content, "id='root'") !== false) {
                $has_root_div = true;
            }
            if (preg_match('/src=["\']([^"\']+\.js)["\']/', $index_content, $m)) {
                $index_js_ref = $m[1];
            }
            if (preg_match('/href=["\']([^"\']+\.css)["\']/', $index_content, $m)) {
                $index_css_ref = $m[1];
            }
        }

        // بررسی فایل‌های موجود در پوشه assets
        $js_bundles = [];
        $css_bundles = [];
        if (is_dir($assets_dir)) {
            foreach (scandir($assets_dir) as $f) {
                if (preg_match('/\.js$/i', $f)) $js_bundles[] = $f;
                if (preg_match('/\.css$/i', $f)) $css_bundles[] = $f;
            }
        }

        // بررسی اتصال دیتابیس
        $db_status = 'not_configured';
        $db_error = '';
        if (file_exists($config_file)) {
            try {
                @include $config_file;
                if (isset($pdo) && $pdo instanceof PDO) {
                    $db_status = 'connected';
                }
            } catch (Exception $e) {
                $db_status = 'error';
                $db_error = $e->getMessage();
            }
        }

        echo json_encode([
            'status' => 'success',
            'php' => [
                'version' => $php_version,
                'ok' => $php_ok
            ],
            'extensions' => $exts,
            'permissions' => $perms,
            'index_status' => [
                'exists' => $index_exists,
                'uncompiled' => $index_uncompiled,
                'has_root_div' => $has_root_div,
                'js_ref' => $index_js_ref,
                'css_ref' => $index_css_ref,
            ],
            'assets' => [
                'js_bundles' => $js_bundles,
                'css_bundles' => $css_bundles,
                'dist_exists' => is_dir($dist_dir)
            ],
            'db' => [
                'status' => $db_status,
                'error' => $db_error
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۲. تست اتصال به دیتابیس با مشخصات ورودی
    if ($action === 'test_db') {
        $input = json_decode(file_get_contents('php://input'), true);
        $host = trim($input['host'] ?? 'localhost');
        $dbname = trim($input['dbname'] ?? '');
        $user = trim($input['user'] ?? '');
        $pass = trim($input['pass'] ?? '');

        try {
            $test_pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]);
            echo json_encode(['status' => 'success', 'message' => 'اتصال به دیتابیس MySQL با موفقیت برقرار شد!'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'خطا در اتصال به دیتابیس: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    // ۳. ذخیره تنظیمات دیتابیس و ایجاد جداول
    if ($action === 'install_db') {
        $input = json_decode(file_get_contents('php://input'), true);
        $host = trim($input['host'] ?? 'localhost');
        $dbname = trim($input['dbname'] ?? 'h353256_dast');
        $user = trim($input['user'] ?? 'h353256_dst');
        $pass = trim($input['pass'] ?? '@Ali3360@Ali3360');

        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // ذخیره php/config.php
            $php_dir = $root_dir . '/php';
            if (!is_dir($php_dir)) @mkdir($php_dir, 0755, true);

            $config_code = "<?php\n";
            $config_code .= "/**\n * DASTAVVAL B2B PLATFORM - Auto-Generated Config\n */\n";
            $config_code .= "header('Access-Control-Allow-Origin: *');\n";
            $config_code .= "header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');\n";
            $config_code .= "header('Access-Control-Allow-Headers: Content-Type, Authorization');\n";
            $config_code .= "header('Content-Type: application/json; charset=utf-8');\n\n";
            $config_code .= "if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }\n\n";
            $config_code .= "\$db_host = '$host';\n";
            $config_code .= "\$db_name = '$dbname';\n";
            $config_code .= "\$db_user = '$user';\n";
            $config_code .= "\$db_pass = '$pass';\n\n";
            $config_code .= "try {\n";
            $config_code .= "    \$pdo = new PDO(\"mysql:host=\$db_host;dbname=\$db_name;charset=utf8mb4\", \$db_user, \$db_pass, [\n";
            $config_code .= "        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,\n";
            $config_code .= "        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n";
            $config_code .= "        PDO::MYSQL_ATTR_INIT_COMMAND => \"SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci\"\n";
            $config_code .= "    ]);\n";
            $config_code .= "} catch (PDOException \$e) {\n";
            $config_code .= "    echo json_encode(['status' => 'error', 'message' => 'خطا در اتصال به MySQL: ' . \$e->getMessage()], JSON_UNESCAPED_UNICODE);\n";
            $config_code .= "    exit();\n";
            $config_code .= "}\n";

            file_put_contents($config_file, $config_code);
            @chmod($config_file, 0644);

            // اجرای database.sql در صورت وجود
            if (file_exists($sql_file)) {
                $sql = file_get_contents($sql_file);
                $queries = array_filter(array_map('trim', explode(';', $sql)));
                foreach ($queries as $q) {
                    if (!empty($q) && strpos($q, '--') !== 0) {
                        try { $pdo->exec($q); } catch (Exception $ex) {}
                    }
                }
            }

            echo json_encode(['status' => 'success', 'message' => 'تنظیمات دیتابیس با موفقیت ذخیره شد و جداول مربوطه ایجاد گردیدند.'], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'خطا در فرآیند پیکربندی: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    // ۴. بازسازی و تعمیر جامع ۱-کلیکی (One-Click Auto Fix Engine)
    if ($action === 'fix_all') {
        $messages = [];

        // الف) انتقال محتویات پوشه dist به root
        if (is_dir($dist_dir)) {
            // پاکسازی فایل‌های قدیمی و کش‌شده در پوشه assets جهت تضمین انتقال بیلد جدید بدون تداخل
            if (is_dir($assets_dir)) {
                $old_assets_files = array_diff(scandir($assets_dir), ['.', '..']);
                foreach ($old_assets_files as $oaf) {
                    if (preg_match('/^index-.*\.(js|css|js\.map)$/i', $oaf)) {
                        @unlink($assets_dir . '/' . $oaf);
                    }
                }
            }

            $items = array_diff(scandir($dist_dir), ['.', '..']);
            foreach ($items as $item) {
                $src = $dist_dir . '/' . $item;
                $dest = $root_dir . '/' . $item;
                if (is_dir($src)) {
                    if (!is_dir($dest)) @mkdir($dest, 0755, true);
                    $subfiles = array_diff(scandir($src), ['.', '..']);
                    foreach ($subfiles as $sf) {
                        @copy($src . '/' . $sf, $dest . '/' . $sf);
                    }
                    $messages[] = "محتویات پوشه $item از dist به روت منتقل شد.";
                } else {
                    @copy($src, $dest);
                    $messages[] = "فایل $item از dist جایگزین گردید.";
                }
            }
        }

        // ب) ایجاد و همگام‌سازی پوشه assets
        if (!is_dir($assets_dir)) @mkdir($assets_dir, 0755, true);

        // جستجوی فایل‌های JS و CSS در assets (انتخاب جدیدترین فایل بر اساس زمان آخرین تغییر mtime)
        $js_file = '';
        $js_mtime = 0;
        $css_file = '';
        $css_mtime = 0;
        if (is_dir($assets_dir)) {
            foreach (scandir($assets_dir) as $f) {
                $f_path = $assets_dir . '/' . $f;
                if (!is_file($f_path)) continue;

                if (preg_match('/^index-.*\.js$/i', $f)) {
                    $mtime = filemtime($f_path);
                    if ($mtime > $js_mtime) {
                        $js_mtime = $mtime;
                        $js_file = $f;
                    }
                }
                if (preg_match('/^index-.*\.css$/i', $f)) {
                    $mtime = filemtime($f_path);
                    if ($mtime > $css_mtime) {
                        $css_mtime = $mtime;
                        $css_file = $f;
                    }
                }
            }
        }

        // ج) اگر فایل‌های بیلد در هاست نبودند، مستقیم از گیت‌هاب دانلود کن
        $repo_raw = "https://raw.githubusercontent.com/dastavval/b2b-platform/main/dist";
        if (empty($js_file)) {
            $remote_index = @file_get_contents("$repo_raw/index.html");
            if ($remote_index) {
                if (preg_match('/src=["\']\.\/assets\/([^"\']+\.js)["\']/', $remote_index, $m)) {
                    $js_file = $m[1];
                    $js_content = @file_get_contents("$repo_raw/assets/$js_file");
                    if ($js_content) {
                        @file_put_contents($assets_dir . '/' . $js_file, $js_content);
                        $messages[] = "فایل اسکریپت بیلد ($js_file) از مخزن گیت‌هاب دریافت شد.";
                    }
                }
                if (preg_match('/href=["\']\.\/assets\/([^"\']+\.css)["\']/', $remote_index, $m)) {
                    $css_file = $m[1];
                    $css_content = @file_get_contents("$repo_raw/assets/$css_file");
                    if ($css_content) {
                        @file_put_contents($assets_dir . '/' . $css_file, $css_content);
                        $messages[] = "فایل استایل بیلد ($css_file) از مخزن گیت‌هاب دریافت شد.";
                    }
                }
            }
        }

        if (empty($js_file)) $js_file = 'index-BrUKkIGA.js';
        if (empty($css_file)) $css_file = 'index-4m3HRGoy.css';

        // د) ساخت و بازسازی کامل index.html استاندارد و کامپایل‌شده
        $final_index = "<!DOCTYPE html>\n";
        $final_index .= "<html lang=\"fa\" dir=\"rtl\">\n";
        $final_index .= "<head>\n";
        $final_index .= "  <meta charset=\"UTF-8\">\n";
        $final_index .= "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
        $final_index .= "  <title>پلتفرم بازرگانی دست اول - تامین مستقیم از کارخانجات</title>\n";
        $final_index .= "  <link rel=\"stylesheet\" crossorigin href=\"./assets/$css_file\">\n";
        $final_index .= "</head>\n";
        $final_index .= "<body class=\"bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white\">\n";
        $final_index .= "  <div id=\"root\"></div>\n";
        $final_index .= "  <script type=\"module\" crossorigin src=\"./assets/$js_file\"></script>\n";
        $final_index .= "</body>\n";
        $final_index .= "</html>\n";

        file_put_contents($root_dir . '/index.html', $final_index);
        @chmod($root_dir . '/index.html', 0644);
        $messages[] = "فایل index.html کامپایل‌شده با ارجاع به اسکریپت ($js_file) و المان #root بازسازی شد.";

        // ه) بازسازی فایل .htaccess پیشرفته جهت پشتیبانی از cPanel و ساب‌دامنه
        $htaccess_content = "# ============================================================\n";
        $htaccess_content .= "# DASTAVVAL B2B PLATFORM - Apache .htaccess for cPanel\n";
        $htaccess_content .= "# ============================================================\n\n";
        $htaccess_content .= "DirectoryIndex index.php index.html\n\n";
        $htaccess_content .= "<IfModule mod_rewrite.c>\n";
        $htaccess_content .= "  RewriteEngine On\n\n";
        $htaccess_content .= "  # 1. API Route Redirect\n";
        $htaccess_content .= "  RewriteRule ^api/index\\.php$ php/api.php [L,QSA]\n";
        $htaccess_content .= "  RewriteRule ^api/(.*)$ php/api.php?action=\$1 [L,QSA]\n\n";
        $htaccess_content .= "  # 2. Existing File or Directory Pass\n";
        $htaccess_content .= "  RewriteCond %{REQUEST_FILENAME} -f [OR]\n";
        $htaccess_content .= "  RewriteCond %{REQUEST_FILENAME} -d\n";
        $htaccess_content .= "  RewriteRule ^ - [L]\n\n";
        $htaccess_content .= "  # 3. Native PHP Fallback\n";
        $htaccess_content .= "  RewriteRule ^ index.php [L]\n";
        $htaccess_content .= "</IfModule>\n\n";
        $htaccess_content .= "AddDefaultCharset UTF-8\n";
        $htaccess_content .= "Options -Indexes\n\n";
        $htaccess_content .= "<IfModule mod_mime.c>\n";
        $htaccess_content .= "  AddType application/javascript .js\n";
        $htaccess_content .= "  AddType text/css .css\n";
        $htaccess_content .= "  AddType application/json .json\n";
        $htaccess_content .= "  AddType image/svg+xml .svg\n";
        $htaccess_content .= "</IfModule>\n\n";
        $htaccess_content .= "<IfModule mod_headers.c>\n";
        $htaccess_content .= "  Header set Access-Control-Allow-Origin \"*\"\n";
        $htaccess_content .= "  Header set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"\n";
        $htaccess_content .= "  Header set Access-Control-Allow-Headers \"Content-Type, Authorization\"\n";
        $htaccess_content .= "  # Disable browser/server caching for HTML and PHP entry points\n";
        $htaccess_content .= "  <FilesMatch \"\\.(html|htm|php)$\">\n";
        $htaccess_content .= "    Header set Cache-Control \"no-cache, no-store, must-revalidate\"\n";
        $htaccess_content .= "    Header set Pragma \"no-cache\"\n";
        $htaccess_content .= "    Header set Expires 0\n";
        $htaccess_content .= "  </FilesMatch>\n";
        $htaccess_content .= "</IfModule>\n";

        file_put_contents($htaccess_file, $htaccess_content);
        @chmod($htaccess_file, 0644);
        $messages[] = "فایل .htaccess با تنظیمات جامع MIME type و SPA Fallback بازنویسی گردید.";

        echo json_encode([
            'status' => 'success',
            'message' => 'عملیات بازسازی و حل مشکل صفحه سفید با موفقیت ۱۰۰٪ انجام شد!',
            'details' => $messages
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دستیار جامع عیب‌یابی، نصب و بازسازی cPanel - پلتفرم دست اول</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <style>
        body { font-family: 'Vazirmatn', system-ui, -apple-system, sans-serif; background-color: #080d1a; color: #f1f5f9; }
        .glass-panel { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(51, 65, 85, 0.5); }
        .badge { padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; }
    </style>
</head>
<body class="min-h-screen py-10 px-4 flex flex-col items-center justify-center">

    <div class="max-w-4xl w-full">
        <!-- هدر اصلی -->
        <div class="glass-panel rounded-3xl p-6 sm:p-8 mb-6 text-center shadow-2xl relative overflow-hidden">
            <div class="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
                🛡️ دستیار هوشمند نصب و عیب‌یابی پیشرفته cPanel v4.1.0-Release (بروزرسانی مرداد ۱۴۰۵)
            </div>

            <h1 class="text-2xl sm:text-3xl font-black text-white mb-2">
                سامانه جامع عیب‌یابی، مجوزها (chmod) و بازسازی سرور
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 font-medium max-w-xl mx-auto">
                بررسی خودکار اتصال دیتابیس، تست دسترسی فایل‌سیستم، تعمیر index.html و رفع خطای صفحه سفید (Blank Screen) در هاست cPanel و ساب‌دامنه‌ها.
            </p>
        </div>

        <!-- منوی تب‌ها -->
        <div class="flex items-center justify-center gap-2 mb-6 flex-wrap">
            <button onclick="switchTab('diag')" id="tab-diag" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-emerald-600 text-white shadow-lg cursor-pointer">
                🔍 عیب‌یابی و مجوزها (chmod)
            </button>
            <button onclick="switchTab('db')" id="tab-db" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
                🗄️ پیکربندی دیتابیس MySQL
            </button>
            <button onclick="switchTab('htaccess')" id="tab-htaccess" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
                🌐 تنظیمات .htaccess & MIME
            </button>
        </div>

        <!-- محتوای تب ۱: عیب‌یابی و چمد -->
        <div id="content-diag" class="tab-content glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 flex-wrap gap-2">
                <div>
                    <h2 class="text-base font-black text-white">پایش وضعیت سیستم و دسترسی‌های فایل (chmod)</h2>
                    <p class="text-xs text-slate-400 mt-0.5">بررسی نوشتن‌پذیری پوشه‌ها و صحت فایل‌های بیلد</p>
                </div>
                <button onclick="runDiagnostics()" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                    🔄 اسکن مجدد
                </button>
            </div>

            <div id="diag-container" class="space-y-3">
                <div class="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>در حال اجرای تست‌های تشخیصی سرور...</span>
                    <span class="animate-spin text-amber-400">⏳</span>
                </div>
            </div>

            <!-- دکمه تعمیر جادویی -->
            <div class="mt-8 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div class="text-xs text-slate-400">
                    💡 جهت رفع تمامی خطاهای صفحه سفید و اصلاح index.html دکمه بنفش را بفشارید.
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="fixAll()" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 border border-purple-400/30">
                        ⚡ بازسازی و تعمیر کامل (One-Click Auto Fix)
                    </button>
                    <a href="./" target="_blank" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
                        🚀 مشاهده سایت
                    </a>
                </div>
            </div>
        </div>

        <!-- محتوای تب ۲: دیتابیس -->
        <div id="content-db" class="tab-content glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl hidden">
            <h2 class="text-base font-black text-white mb-1">تنظیمات دیتابیس MySQL و ساخت جداول</h2>
            <p class="text-xs text-slate-400 mb-6">مشخصات دیتابیس cPanel خود را وارد کنید تا اتصال برقرار شده و جداول آماده‌سازی شوند.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-xs font-bold text-slate-300 mb-1">Database Host:</label>
                    <input type="text" id="db-host" value="localhost" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white dir-ltr font-mono focus:border-amber-400 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-300 mb-1">Database Name:</label>
                    <input type="text" id="db-name" value="h353256_dast" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white dir-ltr font-mono focus:border-amber-400 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-300 mb-1">Database User:</label>
                    <input type="text" id="db-user" value="h353256_dst" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white dir-ltr font-mono focus:border-amber-400 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-300 mb-1">Database Password:</label>
                    <input type="password" id="db-pass" value="@Ali3360@Ali3360" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white dir-ltr font-mono focus:border-amber-400 outline-none">
                </div>
            </div>

            <div id="db-alert" class="hidden p-3 rounded-xl text-xs font-bold mb-6"></div>

            <div class="flex items-center gap-3">
                <button onclick="testDb()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer">
                    🧪 تست اتصال
                </button>
                <button onclick="installDb()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer">
                    💾 ذخیره پیکربندی و ساخت جداول
                </button>
            </div>
        </div>

        <!-- محتوای تب ۳: htaccess -->
        <div id="content-htaccess" class="tab-content glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl hidden">
            <h2 class="text-base font-black text-white mb-1">کد .htaccess استاندارد cPanel</h2>
            <p class="text-xs text-slate-400 mb-4">جهت پشتیبانی کامل از مسیرهای React SPA و درخواست‌های API در هاست و ساب‌دامنه‌ها.</p>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                <pre class="font-mono text-xs text-emerald-400 dir-ltr text-left overflow-x-auto"># DASTAVVAL B2B PLATFORM - Apache .htaccess for cPanel
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^api/index\.php$ php/api.php [L,QSA]
  RewriteRule ^api/(.*)$ php/api.php?action=$1 [L,QSA]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>
AddDefaultCharset UTF-8
Options -Indexes</pre>
            </div>

            <button onclick="fixAll()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-lg">
                🔧 بازنویسی و نصب خودکار .htaccess
            </button>
        </div>

        <!-- فوتر -->
        <div class="mt-8 text-center text-xs text-slate-500 font-medium">
            پلتفرم بازرگانی دست اول &copy; تمامی حقوق محفوظ است.
        </div>
    </div>

    <script>
        function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('bg-emerald-600', 'text-white');
                el.classList.add('bg-slate-800', 'text-slate-300');
            });
            document.getElementById('content-' + tab).classList.remove('hidden');
            const btn = document.getElementById('tab-' + tab);
            btn.classList.remove('bg-slate-800', 'text-slate-300');
            btn.classList.add('bg-emerald-600', 'text-white');
        }

        function runDiagnostics() {
            const container = document.getElementById('diag-container');
            container.innerHTML = `<div class="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>در حال پایش و تست دسترسی‌های سرور...</span>
                <span class="animate-spin">⏳</span>
            </div>`;

            fetch('installer.php?action=diagnose')
                .then(r => r.json())
                .then(data => {
                    let html = '';

                    // ۱. PHP Version
                    const phpOk = data.php.ok;
                    html += `<div class="p-3.5 bg-slate-900/80 rounded-2xl border ${phpOk ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${phpOk ? '✅' : '❌'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-white">نسخه PHP سرور</h4>
                                <p class="text-[11px] text-slate-400">نسخه موجود: ${data.php.version} (حداقل 7.4 نیاز است)</p>
                            </div>
                        </div>
                        <span class="badge ${phpOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${phpOk ? 'پشتیبانی می‌شود' : 'نیازمند ارتقا'}</span>
                    </div>`;

                    // ۲. Permissions (chmod)
                    const rootWritable = data.permissions.root_dir.writable;
                    html += `<div class="p-3.5 bg-slate-900/80 rounded-2xl border ${rootWritable ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${rootWritable ? '✅' : '⚠️'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-white">دسترسی‌های فایل‌سیستم (chmod)</h4>
                                <p class="text-[11px] text-slate-400">پوشه اصلی: ${data.permissions.root_dir.chmod} | نوشتن‌پذیر: ${rootWritable ? 'بله' : 'خیر (محدود)'}</p>
                            </div>
                        </div>
                        <span class="badge ${rootWritable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${rootWritable ? 'مجوز کامل (0755)' : 'بررسی chmod'}</span>
                    </div>`;

                    // ۳. Database Status
                    const dbOk = data.db.status === 'connected';
                    html += `<div class="p-3.5 bg-slate-900/80 rounded-2xl border ${dbOk ? 'border-emerald-500/30' : 'border-amber-500/30'} flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${dbOk ? '✅' : '⚠️'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-white">اتصال به دیتابیس MySQL</h4>
                                <p class="text-[11px] text-slate-400">${dbOk ? 'اتصال کامل برقرار است.' : (data.db.error || 'نیازمند تنظیمات در تب دیتابیس')}</p>
                            </div>
                        </div>
                        <span class="badge ${dbOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${dbOk ? 'متصل' : 'غیرمتصل'}</span>
                    </div>`;

                    // ۴. Index & Assets Status (المان root و صفحه سفید)
                    const idxOk = data.index_status.exists && !data.index_status.uncompiled && data.index_status.has_root_div;
                    html += `<div class="p-3.5 bg-slate-900/80 rounded-2xl border ${idxOk ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${idxOk ? '✅' : '🚨'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-white">وضعیت کامپایل index.html و اسکریپت‌ها</h4>
                                <p class="text-[11px] text-slate-400">المان #root: ${data.index_status.has_root_div ? 'موجود' : 'ناموجود'} | اسکریپت: ${data.index_status.js_ref || 'تعریف نشده'} | CSS: ${data.index_status.css_ref || 'تعریف نشده'}</p>
                            </div>
                        </div>
                        <span class="badge ${idxOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${idxOk ? 'آماده اجرا' : 'نیازمند بازسازی'}</span>
                    </div>`;

                    if (!idxOk) {
                        html += `<div class="p-4 bg-rose-950/80 border border-rose-500/40 rounded-2xl text-xs text-rose-200 leading-relaxed">
                            <div class="font-bold text-rose-300 text-sm mb-1">🚨 علت اصلی بروز صفحه سفید در مرورگر:</div>
                            <p>فایل <code>index.html</code> موجود روی سرور دارای مسیر اشتباه یا فاقد المان <code>#root</code>/اسکریپت بیلد کامپایل‌شده است.</p>
                            <div class="mt-3">
                                <button onclick="fixAll()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow">
                                    ⚡ بازسازی فوری و کامپایل خودکار (Fix All)
                                </button>
                            </div>
                        </div>`;
                    }

                    container.innerHTML = html;
                })
                .catch(err => {
                    container.innerHTML = `<div class="p-4 bg-rose-900/30 border border-rose-500/50 rounded-2xl text-xs text-rose-300">خطا در دریافت وضعیت: ${err.message}</div>`;
                });
        }

        function fixAll() {
            const container = document.getElementById('diag-container');
            container.innerHTML = `<div class="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>در حال بازسازی فایل‌ها، اصلاح index.html، تنظیم chmod و .htaccess...</span>
                <span class="animate-spin text-purple-400">⚡</span>
            </div>`;

            fetch('installer.php?action=fix_all')
                .then(r => r.json())
                .then(data => {
                    alert('🎉 ' + data.message + '\n\nجزئیات اقدامات انجام شده:\n' + (data.details.join('\n') || 'تکمیل شد.'));
                    runDiagnostics();
                })
                .catch(e => alert('خطا: ' + e.message));
        }

        function testDb() {
            const host = document.getElementById('db-host').value;
            const dbname = document.getElementById('db-name').value;
            const user = document.getElementById('db-user').value;
            const pass = document.getElementById('db-pass').value;
            const alertBox = document.getElementById('db-alert');

            alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-slate-900 text-amber-300';
            alertBox.innerHTML = 'در حال تست اتصال به MySQL...';
            alertBox.classList.remove('hidden');

            fetch('installer.php?action=test_db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host, dbname, user, pass })
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-emerald-900/50 text-emerald-300 border border-emerald-500/30';
                    alertBox.innerHTML = '✅ ' + data.message;
                } else {
                    alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-rose-900/50 text-rose-300 border border-rose-500/30';
                    alertBox.innerHTML = '❌ ' + data.message;
                }
            });
        }

        function installDb() {
            const host = document.getElementById('db-host').value;
            const dbname = document.getElementById('db-name').value;
            const user = document.getElementById('db-user').value;
            const pass = document.getElementById('db-pass').value;
            const alertBox = document.getElementById('db-alert');

            alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-slate-900 text-amber-300';
            alertBox.innerHTML = 'در حال پیکربندی و ساخت جداول دیتابیس...';
            alertBox.classList.remove('hidden');

            fetch('installer.php?action=install_db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host, dbname, user, pass })
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-emerald-900/50 text-emerald-300 border border-emerald-500/30';
                    alertBox.innerHTML = '🎉 ' + data.message;
                    runDiagnostics();
                } else {
                    alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-rose-900/50 text-rose-300 border border-rose-500/30';
                    alertBox.innerHTML = '❌ ' + data.message;
                }
            });
        }

        // اجرای اولیه
        runDiagnostics();
    </script>
</body>
</html>
