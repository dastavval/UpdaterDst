# 📘 راهنمای راه اندازی و نصب ۱ کلیکی پلتفرم دست اول (ویژه phpMyAdmin و سرور)

این راهنما به گونه‌ای طراحی شده است که **بدون هیچگونه دانش فنی یا کدنویسی**، بتوانید سایت را روی سرور شخصی یا‌هاست خود راه اندازی کنید.

---

## 🗄️ بخش اول: نصب پایگاه داده در phpMyAdmin (فقط ۳ کلیک)

1. وارد پانل **cPanel** یا **DirectAdmin** یا مدیریت هاست خود شوید و گزینه **phpMyAdmin** را باز کنید.
2. از سمت چپ روی نام دیتابیس خود کلیک کنید (یا یک دیتابیس جدید با نام `dastavval_db` بسازید).
3. از منوی بالای phpMyAdmin روی زبانه **Import (ورود)** کلیک کنید.
4. دکمه **Choose File** را بزنید و فایل `database.sql` (موجود در پوشه اصلی این پروژه) را انتخاب کنید.
5. دکمه **Go** در پایین صفحه را بفشارید. 
✨ **تمام! تمام جدول‌ها و داده‌های اولیه به صورت کاملاً خودکار در phpMyAdmin ساخته شدند.**

---

## 🚀 بخش دوم: راه اندازی پلتفرم روی سرور مجازی (VPS) با ۱ فرمان

اگر سرور مجازی (Ubuntu / Debian) دارید، کافیست کد زیر را کپی کرده و در ترمینال سرور پیست کنید:

```bash
chmod +x deploy.sh && ./deploy.sh
```

این فرمان به طور خودکار:
- Node.js و Nginx را نصب می‌کند.
- پکیج‌ها را دانلود و بیلد می‌سازد.
- سایت را به صورت دائمی و بدون قطع شدن روی سرور فعال می‌کند.

---

## ⚙️ بخش سوم: اتصال دامنه و پورت 3000

اگر می‌خواهید سایت روی دامنه شما (مثلاً `dastavval.com`) باز شود:
در Nginx فایل `/etc/nginx/sites-available/default` را باز کرده و کد زیر را قرار دهید:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
سپس فرمان `sudo systemctl restart nginx` را بزنید.

---

🎉 **تبریک! پلتفرم بازرگانی و بنکداری دست اول شما با تمام امکانات آماده بهره‌برداری است.**
