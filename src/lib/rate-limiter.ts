/**
 * DASTAVVAL B2B PLATFORM - Client-Side Login Rate Limiter & Brute-Force Prevention Utility
 * مدیریت تلاش‌های ورود و جلوگیری از حملات Brute Force با تایمر قفل حساب
 */

export interface RateLimitStatus {
  isLocked: boolean;
  attemptsCount: number;
  remainingAttempts: number;
  remainingSeconds: number;
  remainingMinutesFormatted: string;
}

const MAX_ALLOWED_ATTEMPTS = 5; // حداکثر ۵ تلاش ناموفق
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // قفل ۱۵ دقیقه‌ای (۹۰۰ ثانیه)
const STORAGE_PREFIX = "dastavval_rate_limit_";

/**
 * دریافت کلید ذخیره‌سازی برای کاربر یا دستگاه
 */
function getStorageKey(identifier: string): string {
  const cleanId = (identifier || "global_device").toLowerCase().trim().replace(/[^a-z0-9_@.-]/g, "_");
  return `${STORAGE_PREFIX}${cleanId}`;
}

/**
 * بررسی وضعیت محدودیت نرخ ورود بدون افزایش تعداد خطا
 */
export function checkLoginRateLimit(identifier: string): RateLimitStatus {
  const key = getStorageKey(identifier);
  let data = { count: 0, lockUntil: 0 };

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read rate limit data:", e);
  }

  const now = Date.now();

  // اگر زمان قفل منقضی شده باشد، آمار صفر می‌شود
  if (data.lockUntil > 0 && now >= data.lockUntil) {
    resetLoginAttempts(identifier);
    return {
      isLocked: false,
      attemptsCount: 0,
      remainingAttempts: MAX_ALLOWED_ATTEMPTS,
      remainingSeconds: 0,
      remainingMinutesFormatted: "۰:۰۰"
    };
  }

  // اگر حساب قفل باشد
  if (data.lockUntil > now) {
    const diffMs = data.lockUntil - now;
    const totalSec = Math.ceil(diffMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return {
      isLocked: true,
      attemptsCount: data.count,
      remainingAttempts: 0,
      remainingSeconds: totalSec,
      remainingMinutesFormatted: formatted
    };
  }

  const remaining = Math.max(0, MAX_ALLOWED_ATTEMPTS - data.count);
  return {
    isLocked: false,
    attemptsCount: data.count,
    remainingAttempts: remaining,
    remainingSeconds: 0,
    remainingMinutesFormatted: "۰:۰۰"
  };
}

/**
 * ثبت یک تلاش ناموفق جدید برای ورود
 */
export function recordFailedLoginAttempt(identifier: string): RateLimitStatus {
  const key = getStorageKey(identifier);
  const now = Date.now();
  let currentStatus = checkLoginRateLimit(identifier);

  if (currentStatus.isLocked) {
    return currentStatus;
  }

  const newCount = currentStatus.attemptsCount + 1;
  let lockUntil = 0;

  if (newCount >= MAX_ALLOWED_ATTEMPTS) {
    lockUntil = now + LOCKOUT_DURATION_MS;
  }

  const payload = {
    count: newCount,
    lastAttempt: now,
    lockUntil
  };

  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn("Could not save rate limit data:", e);
  }

  return checkLoginRateLimit(identifier);
}

/**
 * بازنشانی آمار تلاش‌های ناموفق پس از ورود موفق
 */
export function resetLoginAttempts(identifier: string): void {
  const key = getStorageKey(identifier);
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("Could not clear rate limit data:", e);
  }
}
