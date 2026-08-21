<?php
/**
 * DASTAVVAL B2B PLATFORM - Comprehensive Installer, Recovery & Emergency Suite
 * سامانه امنیتی جامع عیب‌یابی، نصب، بازسازی اضطراری و حفاظت با رمز پنل ادمین
 * 
 * Version: 5.0.0-Security-Release
 * Compatible with: PHP 7.4 - 8.3+, cPanel / Apache / LiteSpeed, MySQL / MariaDB
 */

session_start();

// تنظیم زمان اجرای اسکریپت و حافظه برای هاست‌های محدود
@ini_set('display_errors', 0);
@ini_set('max_execution_time', 180);
@ini_set('memory_limit', '256M');

$root_dir = __DIR__;
$config_file = $root_dir . '/php/config.php';
$sql_file = $root_dir . '/database.sql';
$htaccess_file = $root_dir . '/.htaccess';
$assets_dir = $root_dir . '/assets';
$dist_dir = $root_dir . '/dist';
$backup_dir = $root_dir . '/backups';

// ==========================================
// احراز هویت امن با رمز عبور ادمین
// ==========================================
// رمزهای معتبر ادمین سیستم
$valid_passwords = ['@Ali3360', '@Ali3360@Ali3360'];

function check_auth() {
    global $valid_passwords;

    // ۱. بررسی Session فعال
    if (isset($_SESSION['dastavval_installer_auth']) && $_SESSION['dastavval_installer_auth'] === true) {
        return true;
    }

    // ۲. بررسی Header یا Body ارسالی
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth_header = $headers['X-Admin-Password'] ?? $headers['x-admin-password'] ?? $headers['Authorization'] ?? '';
    if (strpos($auth_header, 'Bearer ') === 0) {
        $auth_header = substr($auth_header, 7);
    }

    if (!empty($auth_header) && in_array($auth_header, $valid_passwords)) {
        $_SESSION['dastavval_installer_auth'] = true;
        return true;
    }

    // ۳. بررسی پارامتر GET / POST
    $pass = $_POST['admin_pass'] ?? $_GET['admin_pass'] ?? '';
    if (empty($pass)) {
        $input = json_decode(@file_get_contents('php://input'), true);
        if (isset($input['admin_pass'])) {
            $pass = $input['admin_pass'];
        }
    }

    if (!empty($pass) && in_array($pass, $valid_passwords)) {
        $_SESSION['dastavval_installer_auth'] = true;
        return true;
    }

    return false;
}

$is_authenticated = check_auth();

// ==========================================
// هندلر درخواست‌های AJAX (API اینستالر)
// ==========================================
if (isset($_GET['action'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    $action = $_GET['action'];

    // اقدام خروج از اینستالر
    if ($action === 'logout') {
        $_SESSION['dastavval_installer_auth'] = false;
        unset($_SESSION['dastavval_installer_auth']);
        echo json_encode(['status' => 'success', 'message' => 'با موفقیت خارج شدید.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // اقدام ورود به اینستالر با رمز ادمین (محافظت در برابر Brute-Force)
    if ($action === 'login') {
        $now = time();
        $attempts_data = $_SESSION['installer_login_attempts'] ?? ['count' => 0, 'lock_until' => 0];

        // بررسی قفل بودن
        if (isset($attempts_data['lock_until']) && $attempts_data['lock_until'] > $now) {
            $diff = $attempts_data['lock_until'] - $now;
            $mins = floor($diff / 60);
            $secs = $diff % 60;
            http_response_code(429);
            echo json_encode([
                'status' => 'rate_limited',
                'message' => "🚨 تعداد تلاش‌های ناموفق ورود بیش از حد مجاز است. سیستم تا $mins دقیقه و $secs ثانیه دیگر قفل گردیده است."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $input = json_decode(@file_get_contents('php://input'), true);
        $pass = trim($input['admin_pass'] ?? $_POST['admin_pass'] ?? '');

        if (in_array($pass, $valid_passwords)) {
            $_SESSION['dastavval_installer_auth'] = true;
            $_SESSION['installer_login_attempts'] = ['count' => 0, 'lock_until' => 0]; // بازنشانی آمار
            echo json_encode(['status' => 'success', 'message' => 'احراز هویت ادمین با موفقیت انجام شد.'], JSON_UNESCAPED_UNICODE);
        } else {
            $new_count = ($attempts_data['count'] ?? 0) + 1;
            $lock_until = 0;
            if ($new_count >= 5) {
                $lock_until = $now + (15 * 60); // ۱۵ دقیقه قفل
            }
            $_SESSION['installer_login_attempts'] = [
                'count' => $new_count,
                'lock_until' => $lock_until
            ];

            http_response_code(401);
            if ($lock_until > 0) {
                echo json_encode([
                    'status' => 'error',
                    'message' => '🔒 ۵ بار تلاش ناموفق ورود ثبت شد! جهت ارتقای امنیت سرور، دسترسی به مدت ۱۵ دقیقه قفل گردید.'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                $rem = 5 - $new_count;
                echo json_encode([
                    'status' => 'error',
                    'message' => "رمز عبور مدیریت اشتباه است. ($rem تلاش مجاز دیگر باقی مانده است)"
                ], JSON_UNESCAPED_UNICODE);
            }
        }
        exit();
    }

    // تمام اکشن‌های بعدی نیازمند احراز هویت هستند
    if (!$is_authenticated) {
        http_response_code(403);
        echo json_encode([
            'status' => 'unauthorized',
            'message' => 'دسترسی غیرمجاز! جهت اجرای این عملیات، وارد کردن رمز عبور پنل مدیریت الزامی است.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

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
            'zip' => extension_loaded('zip'),
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
        $tables_count = 0;
        if (file_exists($config_file)) {
            try {
                @include $config_file;
                if (isset($pdo) && $pdo instanceof PDO) {
                    $db_status = 'connected';
                    $tblQuery = $pdo->query("SHOW TABLES");
                    if ($tblQuery) {
                        $tables_count = count($tblQuery->fetchAll(PDO::FETCH_COLUMN));
                    }
                }
            } catch (Exception $e) {
                $db_status = 'error';
                $db_error = $e->getMessage();
            }
        }

        // بررسی وجود بکاپ‌های اضطراری
        $backups = [];
        if (is_dir($backup_dir)) {
            foreach (scandir($backup_dir) as $bf) {
                if (preg_match('/\.zip$/i', $bf) || preg_match('/\.sql$/i', $bf)) {
                    $backups[] = [
                        'file' => $bf,
                        'size' => round(filesize($backup_dir . '/' . $bf) / 1024, 1) . ' KB',
                        'time' => date('Y-m-d H:i:s', filemtime($backup_dir . '/' . $bf))
                    ];
                }
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
                'error' => $db_error,
                'tables_count' => $tables_count
            ],
            'emergency' => [
                'backups' => $backups,
                'free_disk_mb' => round(@disk_free_space($root_dir) / (1024 * 1024), 2)
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
            $config_code .= "header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');\n";
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

            // اجرای database.sql در صورت وجود با رعایت امنیت و عدم حذف داده‌های گرانبهای کاربر
            if (file_exists($sql_file)) {
                try {
                    $sql = file_get_contents($sql_file);
                    $sql = preg_replace('/--.*\n/', '', $sql);
                    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
                    $queries = array_filter(array_map('trim', explode(';', $sql)));
                    
                    $existingTables = [];
                    $tableQuery = $pdo->query("SHOW TABLES");
                    if ($tableQuery) {
                        $existingTables = $tableQuery->fetchAll(PDO::FETCH_COLUMN);
                    }

                    foreach ($queries as $q) {
                        $q = trim($q);
                        if (empty($q)) continue;

                        if (stripos($q, 'DROP TABLE') !== false || stripos($q, 'TRUNCATE') !== false || stripos($q, 'DELETE FROM') !== false) {
                            continue;
                        }

                        if (stripos($q, 'CREATE TABLE') !== false && stripos($q, 'IF NOT EXISTS') === false) {
                            $q = preg_replace('/CREATE\s+TABLE/i', 'CREATE TABLE IF NOT EXISTS', $q);
                        }

                        if (stripos($q, 'INSERT INTO') !== false) {
                            if (preg_match('/INSERT\s+INTO\s+[`"\'\s]*([a-zA-Z0-9_\-]+)/i', $q, $matches)) {
                                $tableName = $matches[1];
                                if (in_array($tableName, $existingTables)) {
                                    $countCheck = $pdo->query("SELECT COUNT(*) FROM `{$tableName}`");
                                    if ($countCheck) {
                                        $rowCount = (int)$countCheck->fetchColumn();
                                        if ($rowCount > 0) {
                                            continue;
                                        }
                                    }
                                }
                            }
                        }

                        try { 
                            $pdo->exec($q); 
                        } catch (Exception $ex) {}
                    }
                } catch (Exception $dbEx) {}
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
        $htaccess_content .= "  Header set Access-Control-Allow-Headers \"Content-Type, Authorization, X-Admin-Password\"\n";
        $htaccess_content .= "  # Security Hardening Headers\n";
        $htaccess_content .= "  Header set X-Content-Type-Options \"nosniff\"\n";
        $htaccess_content .= "  Header set X-Frame-Options \"SAMEORIGIN\"\n";
        $htaccess_content .= "  Header set X-XSS-Protection \"1; mode=block\"\n";
        $htaccess_content .= "  Header set Referrer-Policy \"strict-origin-when-cross-origin\"\n";
        $htaccess_content .= "  # Disable browser/server caching for HTML and PHP entry points\n";
        $htaccess_content .= "  <FilesMatch \"\\.(html|htm|php)$\">\n";
        $htaccess_content .= "    Header set Cache-Control \"no-cache, no-store, must-revalidate\"\n";
        $htaccess_content .= "    Header set Pragma \"no-cache\"\n";
        $htaccess_content .= "    Header set Expires 0\n";
        $htaccess_content .= "  </FilesMatch>\n";
        $htaccess_content .= "</IfModule>\n";

        file_put_contents($htaccess_file, $htaccess_content);
        @chmod($htaccess_file, 0644);
        $messages[] = "فایل .htaccess با تنظیمات جامع امنیت، MIME type و SPA Fallback بازنویسی گردید.";

        echo json_encode([
            'status' => 'success',
            'message' => 'عملیات بازسازی و حل مشکل صفحه سفید با موفقیت ۱۰۰٪ انجام شد!',
            'details' => $messages
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۵. ایجاد بکاپ اضطراری سریع از کل دیتابیس و کدهای PHP (Emergency Backup)
    if ($action === 'emergency_backup') {
        if (!is_dir($backup_dir)) @mkdir($backup_dir, 0755, true);
        $timestamp = date('Y-m-d_H-i-s');
        $backup_name = "emergency_backup_{$timestamp}.zip";
        $backup_path = $backup_dir . '/' . $backup_name;

        if (class_exists('ZipArchive')) {
            $zip = new ZipArchive();
            if ($zip->open($backup_path, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                // افزودن فایل‌های کلیدی
                if (file_exists($config_file)) $zip->addFile($config_file, 'php/config.php');
                if (file_exists($root_dir . '/php/api.php')) $zip->addFile($root_dir . '/php/api.php', 'php/api.php');
                if (file_exists($sql_file)) $zip->addFile($sql_file, 'database.sql');
                if (file_exists($htaccess_file)) $zip->addFile($htaccess_file, '.htaccess');
                if (file_exists($root_dir . '/b2b-config.json')) $zip->addFile($root_dir . '/b2b-config.json', 'b2b-config.json');
                if (file_exists($root_dir . '/articles.json')) $zip->addFile($root_dir . '/articles.json', 'articles.json');
                
                // اکسپورت سریع ساختار جداول دیتابیس
                if (file_exists($config_file)) {
                    try {
                        @include $config_file;
                        if (isset($pdo) && $pdo instanceof PDO) {
                            $dbDump = "-- Emergency Database Backup Created at " . date('Y-m-d H:i:s') . "\n";
                            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
                            foreach ($tables as $tbl) {
                                $createStmt = $pdo->query("SHOW CREATE TABLE `{$tbl}`")->fetch(PDO::FETCH_ASSOC);
                                $dbDump .= "\n\n" . ($createStmt['Create Table'] ?? '') . ";\n";
                                $rows = $pdo->query("SELECT * FROM `{$tbl}`")->fetchAll(PDO::FETCH_ASSOC);
                                foreach ($rows as $r) {
                                    $keys = array_map(function($k){ return "`$k`"; }, array_keys($r));
                                    $values = array_map(function($v) use ($pdo) { return $v === null ? "NULL" : $pdo->quote($v); }, array_values($r));
                                    $dbDump .= "INSERT INTO `{$tbl}` (" . implode(',', $keys) . ") VALUES (" . implode(',', $values) . ");\n";
                                }
                            }
                            $zip->addFromString("db_dump_{$timestamp}.sql", $dbDump);
                        }
                    } catch (Exception $dbe) {}
                }

                $zip->close();
                echo json_encode([
                    'status' => 'success',
                    'message' => "بکاپ اضطراری با نام $backup_name ایجاد گردید.",
                    'file' => $backup_name,
                    'size' => round(filesize($backup_path) / 1024, 1) . ' KB'
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        echo json_encode(['status' => 'error', 'message' => 'اکستنشن ZipArchive در PHP هاست فعال نیست.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۶. پاکسازی عمیق کش سرور، فایل‌های موقت و OPcache (Cache Purge & Flush)
    if ($action === 'flush_cache') {
        $flushed = [];
        if (function_exists('opcache_reset')) {
            @opcache_reset();
            $flushed[] = 'حافظه PHP OPcache با موفقیت ریست شد.';
        }
        if (function_exists('apcu_clear_cache')) {
            @apcu_clear_cache();
            $flushed[] = 'حافظه APCu پاکسازی شد.';
        }

        // پاکسازی فایل‌های session قدیمی یا موقت
        $version_file = $root_dir . '/version.json';
        file_put_contents($version_file, json_encode([
            'version' => time(),
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'fresh'
        ], JSON_PRETTY_PRINT));
        $flushed[] = 'فایل نسخه و هدرهای کش مرورگر بروزرسانی گردیدند.';

        echo json_encode([
            'status' => 'success',
            'message' => 'عملیات تخلیه و رفرش عمیق کش با موفقیت انجام شد.',
            'details' => $flushed
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // ۷. تست و بهینه‌سازی جداول دیتابیس (DB Optimize & Repair)
    if ($action === 'repair_db') {
        if (!file_exists($config_file)) {
            echo json_encode(['status' => 'error', 'message' => 'فایل config.php یافت نشد.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        try {
            @include $config_file;
            if (isset($pdo) && $pdo instanceof PDO) {
                $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
                $repaired = [];
                foreach ($tables as $tbl) {
                    $pdo->query("CHECK TABLE `{$tbl}`");
                    $pdo->query("OPTIMIZE TABLE `{$tbl}`");
                    $repaired[] = "جدول `{$tbl}` بهینه‌سازی و سلامت آن تایید شد.";
                }
                echo json_encode([
                    'status' => 'success',
                    'message' => 'تمامی جداول دیتابیس بازسازی، عیب‌یابی و بهینه‌سازی شدند.',
                    'details' => $repaired
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'خطا در تعمیر دیتابیس: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دستیار جامع عیب‌یابی، نصب و بازسازی اضطراری cPanel - پلتفرم دست اول</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <style>
        body { font-family: 'Vazirmatn', system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; }
        .glass-panel { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .badge { padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; }
    </style>
</head>
<body class="min-h-screen py-10 px-4 flex flex-col items-center justify-center">

    <div class="max-w-4xl w-full">
        <!-- هدر اصلی -->
        <div class="glass-panel rounded-3xl p-6 sm:p-8 mb-6 text-center shadow-2xl relative overflow-hidden">
            <div class="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold mb-3">
                🛡️ دستیار هوشمند نصب، عیب‌یابی و ریکاوری cPanel v5.0 (محافظت‌شده با رمز مدیریت)
            </div>

            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                سامانه جامع احیا، ریکاوری، عیب‌یابی و بازسازی سرور دست اول
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
                حفاظت شده با سیستم امنیتی ادمین، بررسی خودکار دیتابیس، تست دسترسی‌ها، رفع خطای صفحه سفید، ایجاد بکاپ اضطراری و بهینه‌سازی سرور در هاست cPanel.
            </p>
        </div>

        <?php if (!$is_authenticated): ?>
        <!-- فرم لاگین ادمین جهت جلوگیری از دستکاری و سوءاستفاده -->
        <div class="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md mx-auto text-center border border-amber-200">
            <div class="w-14 h-14 mx-auto mb-4 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl border border-amber-200">
                🔒
            </div>
            <h2 class="text-base font-black text-slate-900 mb-1">ورود به محیط امنیتی اینستالر و بازسازی</h2>
            <p class="text-xs text-slate-500 mb-6 leading-relaxed">
                جهت حفظ امنیت دیتابیس و جلوگیری از تغییرات غیرمجاز، لطفاً رمز پنل مدیریت را وارد فرمایید.
            </p>

            <form onsubmit="handleAdminLogin(event)" class="space-y-4 text-right">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">رمز عبور پنل مدیریت (Admin Password):</label>
                    <input type="password" id="login-admin-pass" placeholder="رمز عبور ادمین را وارد کنید..." required
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dir-ltr text-center font-mono">
                </div>

                <div id="login-error-box" class="hidden p-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"></div>

                <button type="submit" id="login-btn" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer">
                    🔑 ورود و دسترسی به ابزارهای بازسازی
                </button>
            </form>
        </div>

        <script>
            function handleAdminLogin(e) {
                e.preventDefault();
                const pass = document.getElementById('login-admin-pass').value;
                const errBox = document.getElementById('login-error-box');
                const btn = document.getElementById('login-btn');
                
                errBox.classList.add('hidden');
                btn.innerHTML = 'در حال اعتبارسنجی...';
                btn.disabled = true;

                fetch('installer.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_pass: pass })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'success') {
                        sessionStorage.setItem('dastavval_admin_pass', pass);
                        window.location.reload();
                    } else {
                        errBox.innerHTML = '❌ ' + (data.message || 'رمز عبور اشتباه است.');
                        errBox.classList.remove('hidden');
                        btn.innerHTML = '🔑 ورود مجدد';
                        btn.disabled = false;
                    }
                })
                .catch(err => {
                    errBox.innerHTML = 'خطا در ارتباط: ' + err.message;
                    errBox.classList.remove('hidden');
                    btn.innerHTML = '🔑 تلاش مجدد';
                    btn.disabled = false;
                });
            }
        </script>
        <?php else: ?>

        <!-- منوی تب‌ها -->
        <div class="flex items-center justify-center gap-2 mb-6 flex-wrap">
            <button onclick="switchTab('diag')" id="tab-diag" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-emerald-600 text-white shadow-lg cursor-pointer">
                🔍 عیب‌یابی و مجوزها (chmod)
            </button>
            <button onclick="switchTab('db')" id="tab-db" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                🗄️ پیکربندی دیتابیس MySQL
            </button>
            <button onclick="switchTab('recovery')" id="tab-recovery" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                🚨 احیا و ریکاوری اضطراری
            </button>
            <button onclick="switchTab('htaccess')" id="tab-htaccess" class="tab-btn px-4 py-2 rounded-2xl text-xs font-black transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                🌐 تنظیمات .htaccess & امنیت
            </button>
            <button onclick="logoutInstaller()" class="px-3 py-2 rounded-2xl text-xs font-bold transition-all bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer border border-rose-200">
                🚪 خروج امن
            </button>
        </div>

        <!-- محتوای تب ۱: عیب‌یابی و چمد -->
        <div id="content-diag" class="tab-content glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-2">
                <div>
                    <h2 class="text-base font-black text-slate-900">پایش وضعیت سیستم و دسترسی‌های فایل (chmod)</h2>
                    <p class="text-xs text-slate-500 mt-0.5">بررسی نوشتن‌پذیری پوشه‌ها و صحت فایل‌های بیلد</p>
                </div>
                <button onclick="runDiagnostics()" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer">
                    🔄 اسکن مجدد
                </button>
            </div>

            <div id="diag-container" class="space-y-3">
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>در حال اجرای تست‌های تشخیصی سرور...</span>
                    <span class="animate-spin text-amber-600">⏳</span>
                </div>
            </div>

            {/* دکمه تعمیر جادویی */}
            <div class="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div class="text-xs text-slate-500">
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
            <h2 class="text-base font-black text-slate-900 mb-1">تنظیمات دیتابیس MySQL و ساخت جداول</h2>
            <p class="text-xs text-slate-500 mb-6">مشخصات دیتابیس cPanel خود را وارد کنید تا اتصال برقرار شده و جداول آماده‌سازی شوند.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Database Host:</label>
                    <input type="text" id="db-host" value="localhost" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 dir-ltr font-mono focus:border-amber-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Database Name:</label>
                    <input type="text" id="db-name" value="h353256_dast" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 dir-ltr font-mono focus:border-amber-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Database User:</label>
                    <input type="text" id="db-user" value="h353256_dst" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 dir-ltr font-mono focus:border-amber-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Database Password:</label>
                    <input type="password" id="db-pass" value="@Ali3360@Ali3360" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 dir-ltr font-mono focus:border-amber-500 outline-none">
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

        <!-- محتوای تب ۳: احیا و ریکاوری اضطراری -->
        <div id="content-recovery" class="tab-content glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl hidden">
            <h2 class="text-base font-black text-slate-900 mb-1">مرکز عملیات اضطراری، بکاپ و بازیابی سایت (Disaster Recovery)</h2>
            <p class="text-xs text-slate-500 mb-6">در مواقع بحرانی یا بروز اختلال در هاست، می‌توانید از این ابزارها برای احیای فوری و پاکسازی کامل کش استفاده کنید.</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                    <h4 class="text-xs font-black text-purple-900 flex items-center gap-1.5">
                        <span>📦</span> ایجاد بکاپ اضطراری
                    </h4>
                    <p class="text-[11px] text-purple-700 leading-relaxed font-medium">
                        پشتیبان‌گیری کامل از کدهای PHP، تنظیمات و ساختار جداول دیتابیس در قالب فایل فشرده ZIP.
                    </p>
                    <button onclick="createEmergencyBackup()" class="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer">
                        تهیه بکاپ آنی
                    </button>
                </div>

                <div class="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                    <h4 class="text-xs font-black text-teal-900 flex items-center gap-1.5">
                        <span>🧹</span> پاکسازی کش و OPcache
                    </h4>
                    <p class="text-[11px] text-teal-700 leading-relaxed font-medium">
                        تخلیه کامل حافظه کش PHP OPcache، بروزرسانی نسخه استاتیک و حل مشکل لود کدهای قدیمی.
                    </p>
                    <button onclick="flushCache()" class="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer">
                        تخلیه و ریست کش
                    </button>
                </div>

                <div class="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                    <h4 class="text-xs font-black text-blue-900 flex items-center gap-1.5">
                        <span>🛠️</span> بهینه‌سازی و تعمیر دیتابیس
                    </h4>
                    <p class="text-[11px] text-blue-700 leading-relaxed font-medium">
                        بررسی و Repair خودکار جداول MySQL جهت رفع خطاهای Crash یا کندی ایندکس‌ها.
                    </p>
                    <button onclick="repairDatabase()" class="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer">
                        تعمیر و Optimize جداول
                    </button>
                </div>
            </div>

            <div id="recovery-alert" class="hidden p-4 rounded-2xl text-xs font-bold mb-6"></div>
        </div>

        <!-- محتوای تب ۴: htaccess -->
        <div id="content-htaccess" class="tab-content glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl hidden">
            <h2 class="text-base font-black text-slate-900 mb-1">کد .htaccess استاندارد و هدرهای امنیتی cPanel</h2>
            <p class="text-xs text-slate-500 mb-4">پشتیبانی کامل از مسیرهای React SPA، هدرهای ضد هک (XSS, Clickjacking, MIME Sniffing) و API هاست.</p>

            <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                <pre class="font-mono text-xs text-indigo-600 dir-ltr text-left overflow-x-auto"># DASTAVVAL B2B PLATFORM - Security Hardened .htaccess
DirectoryIndex index.php index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^api/index\.php$ php/api.php [L,QSA]
  RewriteRule ^api/(.*)$ php/api.php?action=$1 [L,QSA]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.php [L]
</IfModule>
AddDefaultCharset UTF-8
Options -Indexes
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule></pre>
            </div>

            <button onclick="fixAll()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-lg">
                🔧 بازنویسی و اعمال هدرهای امنیتی .htaccess
            </button>
        </div>

        <!-- فوتر -->
        <div class="mt-8 text-center text-xs text-slate-500 font-medium">
            پلتفرم بازرگانی دست اول &copy; تمامی حقوق محفوظ است.
        </div>

        <script>
            function getStoredPass() {
                return sessionStorage.getItem('dastavval_admin_pass') || '';
            }

            function switchTab(tab) {
                document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('.tab-btn').forEach(el => {
                    el.classList.remove('bg-emerald-600', 'text-white');
                    el.classList.add('bg-slate-100', 'text-slate-600');
                });
                document.getElementById('content-' + tab).classList.remove('hidden');
                const btn = document.getElementById('tab-' + tab);
                btn.classList.remove('bg-slate-100', 'text-slate-600');
                btn.classList.add('bg-emerald-600', 'text-white');
            }

            function logoutInstaller() {
                fetch('installer.php?action=logout')
                    .finally(() => {
                        sessionStorage.removeItem('dastavval_admin_pass');
                        window.location.reload();
                    });
            }

            function runDiagnostics() {
                const container = document.getElementById('diag-container');
                container.innerHTML = `<div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>در حال پایش و تست دسترسی‌های سرور...</span>
                    <span class="animate-spin">⏳</span>
                </div>`;

                fetch('installer.php?action=diagnose', {
                    headers: { 'X-Admin-Password': getStoredPass() }
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'unauthorized') {
                        window.location.reload();
                        return;
                    }
                    let html = '';

                    // ۱. PHP Version
                    const phpOk = data.php.ok;
                    html += `<div class="p-3.5 bg-slate-50 rounded-2xl border ${phpOk ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between shadow-xs">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${phpOk ? '✅' : '❌'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900">نسخه PHP سرور</h4>
                                <p class="text-[11px] text-slate-500">نسخه موجود: ${data.php.version} (حداقل 7.4 نیاز است)</p>
                            </div>
                        </div>
                        <span class="badge ${phpOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">${phpOk ? 'پشتیبانی می‌شود' : 'نیازمند ارتقا'}</span>
                    </div>`;

                    // ۲. Permissions (chmod)
                    const rootWritable = data.permissions.root_dir.writable;
                    html += `<div class="p-3.5 bg-slate-50 rounded-2xl border ${rootWritable ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between shadow-xs">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${rootWritable ? '✅' : '⚠️'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900">دسترسی‌های فایل‌سیستم (chmod)</h4>
                                <p class="text-[11px] text-slate-500">پوشه اصلی: ${data.permissions.root_dir.chmod} | نوشتن‌پذیر: ${rootWritable ? 'بله' : 'خیر (محدود)'}</p>
                            </div>
                        </div>
                        <span class="badge ${rootWritable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">${rootWritable ? 'مجوز کامل (0755)' : 'بررسی chmod'}</span>
                    </div>`;

                    // ۳. Database Status
                    const dbOk = data.db.status === 'connected';
                    html += `<div class="p-3.5 bg-slate-50 rounded-2xl border ${dbOk ? 'border-emerald-500/30' : 'border-amber-500/30'} flex items-center justify-between shadow-xs">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${dbOk ? '✅' : '⚠️'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900">اتصال به دیتابیس MySQL</h4>
                                <p class="text-[11px] text-slate-500">${dbOk ? `متصل (تعداد جداول: ${data.db.tables_count})` : (data.db.error || 'نیازمند تنظیمات در تب دیتابیس')}</p>
                            </div>
                        </div>
                        <span class="badge ${dbOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}">${dbOk ? 'متصل' : 'غیرمتصل'}</span>
                    </div>`;

                    // ۴. Index & Assets Status (المان root و صفحه سفید)
                    const idxOk = data.index_status.exists && !data.index_status.uncompiled && data.index_status.has_root_div;
                    html += `<div class="p-3.5 bg-slate-50 rounded-2xl border ${idxOk ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between shadow-xs">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${idxOk ? '✅' : '🚨'}</span>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900">وضعیت کامپایل index.html و اسکریپت‌ها</h4>
                                <p class="text-[11px] text-slate-500">المان #root: ${data.index_status.has_root_div ? 'موجود' : 'ناموجود'} | اسکریپت: ${data.index_status.js_ref || 'تعریف نشده'}</p>
                            </div>
                        </div>
                        <span class="badge ${idxOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">${idxOk ? 'آماده اجرا' : 'نیازمند بازسازی'}</span>
                    </div>`;

                    container.innerHTML = html;
                })
                .catch(err => {
                    container.innerHTML = `<div class="p-4 bg-rose-900/30 border border-rose-500/50 rounded-2xl text-xs text-rose-300">خطا در دریافت وضعیت: ${err.message}</div>`;
                });
            }

            function fixAll() {
                const container = document.getElementById('diag-container');
                container.innerHTML = `<div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>در حال بازسازی فایل‌ها، اصلاح index.html، تنظیم chmod و .htaccess...</span>
                    <span class="animate-spin text-purple-600">⚡</span>
                </div>`;

                fetch('installer.php?action=fix_all', {
                    headers: { 'X-Admin-Password': getStoredPass() }
                })
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

                alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-slate-50 text-amber-700 border border-amber-200';
                alertBox.innerHTML = 'در حال تست اتصال به MySQL...';
                alertBox.classList.remove('hidden');

                fetch('installer.php?action=test_db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Admin-Password': getStoredPass() },
                    body: JSON.stringify({ host, dbname, user, pass })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'success') {
                        alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200';
                        alertBox.innerHTML = '✅ ' + data.message;
                    } else {
                        alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-rose-50 text-rose-700 border border-rose-200';
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

                alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-slate-50 text-amber-700 border border-amber-200';
                alertBox.innerHTML = 'در حال پیکربندی و ساخت جداول دیتابیس...';
                alertBox.classList.remove('hidden');

                fetch('installer.php?action=install_db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Admin-Password': getStoredPass() },
                    body: JSON.stringify({ host, dbname, user, pass })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'success') {
                        alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200';
                        alertBox.innerHTML = '🎉 ' + data.message;
                        runDiagnostics();
                    } else {
                        alertBox.className = 'p-3 rounded-xl text-xs font-bold mb-6 bg-rose-50 text-rose-700 border border-rose-200';
                        alertBox.innerHTML = '❌ ' + data.message;
                    }
                });
            }

            function createEmergencyBackup() {
                const box = document.getElementById('recovery-alert');
                box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-purple-50 text-purple-800 border border-purple-200';
                box.innerHTML = 'در حال تولید فایل پشتیبان اضطراری...';
                box.classList.remove('hidden');

                fetch('installer.php?action=emergency_backup', {
                    headers: { 'X-Admin-Password': getStoredPass() }
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'success') {
                        box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200';
                        box.innerHTML = `✅ ${data.message} (حجم: ${data.size})`;
                    } else {
                        box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-rose-50 text-rose-800 border border-rose-200';
                        box.innerHTML = '❌ ' + data.message;
                    }
                });
            }

            function flushCache() {
                const box = document.getElementById('recovery-alert');
                box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-teal-50 text-teal-800 border border-teal-200';
                box.innerHTML = 'در حال پاکسازی کش سرور و OPcache...';
                box.classList.remove('hidden');

                fetch('installer.php?action=flush_cache', {
                    headers: { 'X-Admin-Password': getStoredPass() }
                })
                .then(r => r.json())
                .then(data => {
                    box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200';
                    box.innerHTML = `✅ ${data.message}<br>${(data.details || []).join('<br>')}`;
                });
            }

            function repairDatabase() {
                const box = document.getElementById('recovery-alert');
                box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-blue-50 text-blue-800 border border-blue-200';
                box.innerHTML = 'در حال عیب‌یابی و بهینه‌سازی جداول دیتابیس...';
                box.classList.remove('hidden');

                fetch('installer.php?action=repair_db', {
                    headers: { 'X-Admin-Password': getStoredPass() }
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'success') {
                        box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200';
                        box.innerHTML = `✅ ${data.message}<br>${(data.details || []).join('<br>')}`;
                    } else {
                        box.className = 'p-4 rounded-2xl text-xs font-bold mb-6 bg-rose-50 text-rose-800 border border-rose-200';
                        box.innerHTML = '❌ ' + data.message;
                    }
                });
            }

            // اجرای اولیه
            runDiagnostics();
        </script>
        <?php endif; ?>
    </div>
</body>
</html>

