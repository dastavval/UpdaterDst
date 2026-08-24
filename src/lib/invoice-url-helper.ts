/**
 * Helper module for generating clean, static, numeric factor/invoice URLs
 * safely encoded without Farsi or special characters for SMS & web display.
 */

// Convert Persian and Arabic digits to clean English digits
export function convertToEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

// Extract only clean numeric digits from tracking number / order ID e.g. "ORD-3360" -> "3360"
export function extractCleanNumericOrderCode(orderIdOrTracking: string | number | null | undefined): string {
  if (!orderIdOrTracking) return '0';
  const withEngDigits = convertToEnglishDigits(orderIdOrTracking);
  const cleanDigits = withEngDigits.replace(/^[^\d]*/, '').replace(/\D/g, '');
  return cleanDigits || withEngDigits.replace(/\s+/g, '') || '0';
}

/**
 * Generates clean static numeric URL for invoice view
 * e.g., https://dastavval.com/invoice/3360 or https://dastavval.com/factors/3360.pdf
 */
export function generateInvoiceUrl(
  orderIdOrTracking: string | number | null | undefined, 
  options?: { format?: 'pdf' | 'html'; domain?: string }
): string {
  const code = extractCleanNumericOrderCode(orderIdOrTracking);
  const domain = options?.domain || 'dastavval.com';
  if (options?.format === 'pdf') {
    return `https://${domain}/factors/${code}.pdf`;
  }
  return `https://${domain}/invoice/${code}`;
}

/**
 * Generates relative static factor link e.g. /invoice/3360
 */
export function generateRelativeInvoicePath(orderIdOrTracking: string | number | null | undefined): string {
  const code = extractCleanNumericOrderCode(orderIdOrTracking);
  return `/invoice/${code}`;
}
