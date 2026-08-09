#!/bin/bash

# =================================================================
# اسکریپت نصب اتوماتیک و ۱ کلیکی پلتفرم دست اول روی سرور (Ubuntu/Debian)
# Dastavval 1-Click Automated Server Installer
# =================================================================

echo "===================================================="
echo "🚀 در حال آغاز نصب اتوماتیک پلتفرم بازرگانی دست اول..."
echo "===================================================="

# ۱. بروزرسانی مخازن سیستم
echo "📦 ۱. در حال بروزرسانی پکیج‌های سیستم..."
sudo apt update -y && sudo apt upgrade -y

# ۲. نصب Node.js و Nginx و MySQL / phpMyAdmin dependencies
echo "🌐 ۲. در حال نصب Node.js و Nginx..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git unzip pm2 -y

# ۳. نصب بسته پروژه
echo "📂 ۳. در حال دریافت آخرین نسخه کد و نصب وابستگی‌ها..."
npm install

# ۴. ساخت نسخه نهایی پروژکشن
echo "🏗️ ۴. در حال بیلد پروژه جهت اجرا با حداکثر سرعت..."
npm run build

# ۵. کانفیگ PM2 جهت اجرای همیشگی و خودکار در صورت ریستارت سرور
echo "⚡ ۵. راه اندازی سرویس در پس‌زمینه با PM2..."
pm2 stop dastavval 2>/dev/null || true
pm2 start npm --name "dastavval" -- run dev -- --port 3000
pm2 save
pm2 startup

echo "===================================================="
echo "✅ نصب با موفقیت کامل انجام شد!"
echo "📍 پلتفرم روی پورت 3000 آماده به کار است."
echo "💡 برای وارد کردن دیتابیس در phpMyAdmin، فایل database.sql موجود در پوشه اصلی را Import کنید."
echo "===================================================="
