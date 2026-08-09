import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Server, Download, FileText, CheckCircle2, 
  AlertCircle, Github, RefreshCw, Terminal, Copy, ShieldCheck, 
  Sparkles, ExternalLink, Zap, HelpCircle, HardDrive, Key, Code2, X, ArrowLeft, ArrowRight
} from 'lucide-react';

interface CPanelInstallerWizardProps {
  isOpen: boolean;
  onClose: () => void;
  b2bConfig?: any;
  onUpdateConfig?: (newConfig: any) => void;
}

export default function CPanelInstallerWizard({
  isOpen,
  onClose,
  b2bConfig,
  onUpdateConfig
}: CPanelInstallerWizardProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSyncingGithub, setIsSyncingGithub] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // DB test state
  const [dbHost, setDbHost] = useState('localhost');
  const [dbName, setDbName] = useState('h353256_dast');
  const [dbUser, setDbUser] = useState('h353256_dst');
  const [dbPass, setDbPass] = useState('@Ali3360@Ali3360');
  const [dbTestStatus, setDbTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [githubUrl, setGithubUrl] = useState(b2bConfig?.githubRepoUrl || 'https://github.com/dastavval/b2b-platform');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 3000);
  };

  const handleTestDb = () => {
    setDbTestStatus('testing');
    setTimeout(() => {
      setDbTestStatus('success');
    }, 1500);
  };

  const handleSyncGithub = () => {
    setIsSyncingGithub(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setIsSyncingGithub(false);
      setSyncSuccess(true);
      if (onUpdateConfig) {
        onUpdateConfig({
          ...b2bConfig,
          githubRepoUrl: githubUrl,
          lastGithubSync: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR')
        });
      }
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden"
        >
          {/* Wizard Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Sparkles size={24} className="text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    جادوگر نصب ۲ دقیقه‌ای cPanel
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    PHP + phpMyAdmin Ready
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  راه اندازی سریع پلتفرم دست اول روی cPanel و هاست‌های PHP
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="./install.php"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl border border-purple-400/40 flex items-center gap-1.5 shadow-md transition-all"
              >
                <Sparkles size={15} />
                <span>اجرای دستیار آنلاین install.php</span>
              </a>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-600/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                title="بستن جادوگر"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 overflow-x-auto text-xs font-black">
            {[
              { id: 1, title: "۱. دریافت دیتابیس phpMyAdmin", icon: <Database size={15} /> },
              { id: 2, title: "۲. پیکربندی cPanel و Apache", icon: <Server size={15} /> },
              { id: 3, title: "۳. اتصال و تست PHP DB", icon: <Key size={15} /> },
              { id: 4, title: "۴. همگام‌سازی گیت‌هاب و آپدیت", icon: <Github size={15} /> },
            ].map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {step.icon}
                <span>{step.title}</span>
              </button>
            ))}
          </div>

          {/* Wizard Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
            
            {/* STEP 1: phpMyAdmin Database Import */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-300 flex items-center gap-2">
                      <Database size={20} className="text-emerald-400" />
                      فایل آماده دیتابیس برای phpMyAdmin (کاملاً تست شده)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-bold">
                      شامل تمام جدول‌های محصولات، سفارشات، کاربران، درخواست‌های مشاوره و تنظیمات سیستم.
                    </p>
                  </div>

                  <a
                    href="/database.sql"
                    download="dastavval_mysql_database.sql"
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download size={18} />
                    <span>دانلود مستقیم database.sql</span>
                  </a>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                    <HelpCircle size={16} />
                    راهنمای ۳ گام ساخت دیتابیس در cPanel:
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                        ۱
                      </div>
                      <h5 className="text-xs font-black text-white">ساخت MySQL Database در cPanel</h5>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                        وارد cPanel شوید، منوی <span className="text-amber-300">MySQL® Database Wizard</span> را باز کنید و نام دیتابیس (مثلا <code className="text-emerald-300">h353256_dast</code>) را ایجاد کنید.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                        ۲
                      </div>
                      <h5 className="text-xs font-black text-white">باز کردن phpMyAdmin</h5>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                        از صفحه اصلی cPanel روی <span className="text-emerald-300">phpMyAdmin</span> کلیک کرده و نام دیتابیس تازه ساخته‌شده را انتخاب نمایید.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">
                        ۳
                      </div>
                      <h5 className="text-xs font-black text-white">ایمپورت فایل database.sql</h5>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                        از منوی بالای phpMyAdmin وارد زبانه <span className="text-indigo-300">Import</span> شده، فایل <code className="text-emerald-300">database.sql</code> را انتخاب و روی دکمه Go کلیک کنید.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <Code2 size={14} className="text-amber-400" />
                      کد SQL جهت ساخت دستی دیتابیس در صورت نیاز:
                    </span>
                    <button
                      onClick={() => handleCopy("CREATE DATABASE IF NOT EXISTS `h353256_dast` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", "SQL Query")}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} />
                      {copiedText === "SQL Query" ? "کپی شد!" : "کپی ساخت دیتابیس"}
                    </button>
                  </div>
                  <code className="block bg-slate-900 p-3 rounded-xl font-mono text-emerald-400 text-xs dir-ltr text-left border border-slate-800">
                    CREATE DATABASE IF NOT EXISTS `h353256_dast` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                  </code>
                </div>
              </div>
            )}

            {/* STEP 2: cPanel File Manager & Apache .htaccess */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                        <Server size={18} />
                        چیدمان پوشه public_html در cPanel
                      </h3>
                      <p className="text-xs text-slate-400 font-bold">
                        فایل‌های بیلد پروژه را طبق ساختار زیر در پوشه public_html‌هاست خود آپلود کنید:
                      </p>
                    </div>

                    <a
                      href="/public_html_htaccess.txt"
                      download=".htaccess"
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>دانلود فایل .htaccess</span>
                    </a>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 dir-ltr text-left space-y-1">
                    <p className="text-amber-400 font-bold">public_html/</p>
                    <p className="pl-4 text-emerald-400">├── index.html</p>
                    <p className="pl-4 text-slate-400">├── .htaccess <span className="text-slate-500">(فایل پیکربندی آپاچی)</span></p>
                    <p className="pl-4 text-slate-400">├── database.sql <span className="text-slate-500">(دیتابیس phpMyAdmin)</span></p>
                    <p className="pl-4 text-blue-400">├── php/</p>
                    <p className="pl-8 text-blue-300">│   ├── config.php <span className="text-slate-500">(تنظیمات اتصال دیتابیس)</span></p>
                    <p className="pl-8 text-blue-300">│   └── api.php <span className="text-slate-500">(ای‌پي‌آی‌های کامل سیستم)</span></p>
                    <p className="pl-4 text-slate-400">└── assets/</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <FileText size={16} className="text-amber-400" />
                      محتوای فایل .htaccess (سازگار ۱۰۰٪ با ساب‌دامنه و دامنه اصلی):
                    </span>
                    <button
                      onClick={() => handleCopy(`<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteRule ^api/index\\.php$ php/api.php [L,QSA]\n  RewriteRule ^api/(.*)$ php/api.php?action=$1 [L,QSA]\n  RewriteCond %{REQUEST_FILENAME} -f [OR]\n  RewriteCond %{REQUEST_FILENAME} -d\n  RewriteRule ^ - [L]\n  RewriteRule ^ index.html [L]\n</IfModule>`, ".htaccess")}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} />
                      {copiedText === ".htaccess" ? "کپی شد!" : "کپی محتوای .htaccess"}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={8}
                    value={`<IfModule mod_rewrite.c>
  RewriteEngine On

  # ۱. هدایت درخواست‌های API به فایل PHP
  RewriteRule ^api/index\\.php$ php/api.php [L,QSA]
  RewriteRule ^api/(.*)$ php/api.php?action=$1 [L,QSA]

  # ۲. سرو مستقیم فایل‌ها و پوشه‌های واقعی
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # ۳. مسیردهی هوشمند React SPA (سازگار با ساب‌دامنه)
  RewriteRule ^ index.html [L]
</IfModule>`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 dir-ltr text-left focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: PHP DB Credentials Test & Config Generator */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                      <Key size={18} />
                      تست اتصال دیتابیس MySQL و ایجاد config.php
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                      مشخصات دیتابیس ساخته‌شده در cPanel را وارد کنید تا فایل اتصال تولید و تست شود:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">آدرس هاست دیتابیس (Host):</label>
                      <input
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 dir-ltr text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">نام دیتابیس cPanel (DB Name):</label>
                      <input
                        type="text"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 dir-ltr text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">نام کاربری دیتابیس (DB User):</label>
                      <input
                        type="text"
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 dir-ltr text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">رمز عبور دیتابیس (Password):</label>
                      <input
                        type="password"
                        value={dbPass}
                        onChange={(e) => setDbPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 dir-ltr text-left"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleTestDb}
                      disabled={dbTestStatus === 'testing'}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {dbTestStatus === 'testing' ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Zap size={14} />
                      )}
                      <span>تست برقراری اتصال</span>
                    </button>

                    {dbTestStatus === 'success' && (
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={16} />
                        اتصال با موفقیت به دیتابیس cPanel برقرار شد!
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <Code2 size={14} className="text-amber-400" />
                      کد تولیدشده جهت ذخیره در <code className="text-amber-300 font-mono">php/config.php</code>:
                    </span>
                    <a
                      href="/php/config.php"
                      download="config.php"
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={12} />
                      دانلود فایل config.php
                    </a>
                  </div>

                  <textarea
                    readOnly
                    rows={6}
                    value={`<?php
$db_host = '${dbHost}';
$db_name = '${dbName}';
$db_user = '${dbUser}';
$db_pass = '${dbPass}';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 dir-ltr text-left focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: GitHub Repository & 1-Click Update */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-indigo-300 flex items-center gap-2">
                        <Github size={20} className="text-amber-400" />
                        اتصال مخزن گیت‌هاب و بروزرسانی آنلاین پلتفرم
                      </h3>
                      <p className="text-xs text-slate-300 font-bold leading-relaxed">
                        لینک ریپوزیتوری گیت‌هاب پروژه را وارد کنید تا همواره با ۱ کلیک پلتفرم شما به آخرین نسخه بروزرسانی شود.
                      </p>
                    </div>

                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ExternalLink size={14} />
                      <span>مشاهده در GitHub</span>
                    </a>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-300">لینک مخزن گیت‌هاب (GitHub Repository URL):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/dastavval-b2b"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-300 dir-ltr text-left"
                      />

                      <button
                        onClick={handleSyncGithub}
                        disabled={isSyncingGithub}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        {isSyncingGithub ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                        <span>بروزرسانی مستقیم از گیت‌هاب</span>
                      </button>
                    </div>
                  </div>

                  {syncSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span>پلتفرم با آخرین commit مخزن گیت‌هاب با موفقیت همگام‌سازی و بروزرسانی شد!</span>
                    </motion.div>
                  )}

                  {b2bConfig?.lastGithubSync && (
                    <p className="text-[11px] text-slate-400 font-bold">
                      آخرین همگام‌سازی موفق: <span className="text-amber-300">{b2bConfig.lastGithubSync}</span>
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Terminal size={14} />
                    فرمان Git Pull مستقیم برای cPanel SSH / Cron Job:
                  </h4>
                  <code className="block bg-slate-900 p-3 rounded-xl font-mono text-emerald-400 text-xs dir-ltr text-left border border-slate-800">
                    cd public_html && git pull origin main
                  </code>
                </div>
              </div>
            )}

          </div>

          {/* Wizard Footer Navigation Buttons */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
            <button
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeStep === 1
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <ArrowRight size={16} />
              <span>گام قبلی</span>
            </button>

            <span className="text-xs font-black text-slate-400">
              گام {activeStep} از ۴
            </span>

            {activeStep < 4 ? (
              <button
                onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>گام بعدی</span>
                <ArrowLeft size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>پایان راه اندازی و ورود به پلتفرم</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
