export const toPersianNum = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

export const toEnglishNum = (str: string | undefined | null): string => {
  if (!str) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(str)
    .replace(/[۰-۹]/g, (w) => farsiDigits.indexOf(w).toString())
    .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w).toString());
};

export const formatPriceToman = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "۰ تومان";
  const num = Math.round(Number(amount));
  return `${toPersianNum(num.toLocaleString())} تومان`;
};

export const normalizePersianText = (text: string | undefined | null): string => {
  if (!text) return "";
  return String(text)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .trim();
};

export const isValidIranianMobile = (phone: string | undefined | null): boolean => {
  if (!phone) return false;
  const clean = toEnglishNum(phone).replace(/\s|-|\+/g, "");
  // Matches 0912..., 912..., 98912...
  return /^(09\d{9}|9\d{9}|989\d{9})$/.test(clean);
};

export const isValidIranianPostalCode = (postalCode: string | undefined | null): boolean => {
  if (!postalCode) return false;
  const clean = toEnglishNum(postalCode).replace(/\s|-/g, "");
  // 10 digits, cannot start with 0 or 2
  return /^[13-9]\d{9}$/.test(clean);
};

export const isValidIranianNationalCode = (code: string | undefined | null): boolean => {
  if (!code) return false;
  const clean = toEnglishNum(code).replace(/\s|-/g, "");
  if (!/^\d{10}$/.test(clean)) return false;
  
  // Reject repetitive numbers like 1111111111, 0000000000
  if (/^(\d)\1{9}$/.test(clean)) return false;
  
  const check = parseInt(clean[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};
