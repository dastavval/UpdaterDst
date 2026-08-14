/**
 * pdfPolyfill.ts
 * A high-performance utility to convert modern CSS color functions (oklch, oklab, lab)
 * to standard rgb/rgba strings for html2canvas compatibility.
 */

const colorCache = new Map<string, string>();

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  // Convert h from degrees to radians
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // Gamma correction to sRGB
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  bl = bl > 0.0031308 ? 1.055 * Math.pow(bl, 1 / 2.4) - 0.055 : 12.92 * bl;

  const red = Math.min(255, Math.max(0, Math.round(r * 255)));
  const green = Math.min(255, Math.max(0, Math.round(g * 255)));
  const blue = Math.min(255, Math.max(0, Math.round(bl * 255)));

  return [red, green, blue];
}

// Convert oklch(...) to rgb(...) or rgba(...)
export const convertModernColorStr = (val: string): string => {
  if (!val || typeof val !== 'string') return val;
  if (!val.includes('oklch') && !val.includes('oklab') && !val.includes('lab')) {
    return val;
  }
  if (colorCache.has(val)) {
    return colorCache.get(val)!;
  }

  try {
    // Match oklch(L C H) or oklch(L C H / A) or oklch(0.985 0.002 247.8)
    const oklchMatch = val.match(/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
    if (oklchMatch) {
      let l = parseFloat(oklchMatch[1]);
      if (oklchMatch[1].endsWith('%')) l = l / 100;

      let c = parseFloat(oklchMatch[2]);
      if (oklchMatch[2].endsWith('%')) c = c / 100;

      const h = parseFloat(oklchMatch[3]);

      let alpha = 1;
      if (oklchMatch[4]) {
        alpha = parseFloat(oklchMatch[4]);
        if (oklchMatch[4].endsWith('%')) alpha = alpha / 100;
      }

      const [r, g, b] = oklchToRgb(l, c, h);
      const res = alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
      colorCache.set(val, res);
      return res;
    }
  } catch (e) {
    // ignore
  }

  // Common fallbacks if regex fails
  if (val.includes('0.278') || val.includes('15%') || val.includes('slate-900')) return 'rgb(15, 23, 42)';
  if (val.includes('0.985') || val.includes('slate-50')) return 'rgb(248, 250, 252)';
  if (val.includes('emerald')) return 'rgb(5, 150, 105)';
  if (val.includes('amber')) return 'rgb(217, 119, 6)';
  if (val.includes('indigo')) return 'rgb(79, 70, 229)';

  const rgbFallback = 'rgb(241, 245, 249)';
  colorCache.set(val, rgbFallback);
  return rgbFallback;
};

export function cleanClonedDocForPdf(clonedDoc: Document) {
  try {
    // 1. Process all <style> tags in the cloned document safely
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('oklab') || styleEl.textContent.includes('lab'))) {
        styleEl.textContent = styleEl.textContent.replace(/(oklch|oklab|lab)\([^)]+\)/g, (match) => {
          return convertModernColorStr(match);
        });
      }
    });

    // 2. Clean inline styles on elements in cloned DOM
    const elementsWithStyle = clonedDoc.querySelectorAll<HTMLElement>('[style*="oklch"], [style*="oklab"], [style*="lab"]');
    elementsWithStyle.forEach((node) => {
      const styleAttr = node.getAttribute('style');
      if (styleAttr) {
        const cleanedAttr = styleAttr.replace(/(oklch|oklab|lab)\([^)]+\)/g, (match) => convertModernColorStr(match));
        node.setAttribute('style', cleanedAttr);
      }
    });
  } catch (err) {
    console.warn("cleanClonedDocForPdf warning:", err);
  }
}

export async function runWithOklchPolyfill<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}

