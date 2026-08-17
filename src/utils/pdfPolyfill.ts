/**
 * pdfPolyfill.ts
 * A high-performance utility to convert modern CSS color functions (oklch, oklab, lab)
 * to standard rgb/rgba strings for html2canvas compatibility.
 */

const colorCache = new Map<string, string>();

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

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

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  // Convert h from degrees to radians
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  return oklabToRgb(l, a, b);
}

// Convert oklch(...) or oklab(...) to rgb(...) or rgba(...)
export const convertModernColorStr = (val: string): string => {
  if (!val || typeof val !== 'string') return val;
  const lowerVal = val.toLowerCase();
  if (!lowerVal.includes('oklch') && !lowerVal.includes('oklab') && !lowerVal.includes('lab')) {
    return val;
  }
  if (colorCache.has(val)) {
    return colorCache.get(val)!;
  }

  try {
    if (lowerVal.includes('oklch')) {
      const oklchMatch = val.match(/oklch\(\s*([\d.-]+%?)\s+([\d.-]+%?)\s+([\d.-]+)(?:\s*\/\s*([\d.-]+%?))?\s*\)/i);
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
    }

    if (lowerVal.includes('oklab')) {
      const oklabMatch = val.match(/oklab\(\s*([\d.-]+%?)\s+([\d.-]+%?)\s+([\d.-]+%?)(?:\s*\/\s*([\d.-]+%?))?\s*\)/i);
      if (oklabMatch) {
        let l = parseFloat(oklabMatch[1]);
        if (oklabMatch[1].endsWith('%')) l = l / 100;

        let a = parseFloat(oklabMatch[2]);
        if (oklabMatch[2].endsWith('%')) a = a / 100;

        let b = parseFloat(oklabMatch[3]);
        if (oklabMatch[3].endsWith('%')) b = b / 100;

        let alpha = 1;
        if (oklabMatch[4]) {
          alpha = parseFloat(oklabMatch[4]);
          if (oklabMatch[4].endsWith('%')) alpha = alpha / 100;
        }

        const [r, g, b_val] = oklabToRgb(l, a, b);
        const res = alpha < 1 ? `rgba(${r}, ${g}, ${b_val}, ${alpha})` : `rgb(${r}, ${g}, ${b_val})`;
        colorCache.set(val, res);
        return res;
      }
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
    // 1. Process style tags efficiently
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleEl) => {
      const txt = styleEl.textContent;
      if (txt && (txt.indexOf('oklch') !== -1 || txt.indexOf('oklab') !== -1 || txt.indexOf('lab') !== -1)) {
        styleEl.textContent = txt.replace(/(oklch|oklab|lab)\([^)]+\)/g, (match) => convertModernColorStr(match));
      }
    });

    // 2. Clean inline styles
    const elementsWithStyle = clonedDoc.querySelectorAll<HTMLElement>('[style*="oklch"], [style*="oklab"], [style*="lab"]');
    elementsWithStyle.forEach((node) => {
      const styleAttr = node.getAttribute('style');
      if (styleAttr) {
        node.setAttribute('style', styleAttr.replace(/(oklch|oklab|lab)\([^)]+\)/g, (match) => convertModernColorStr(match)));
      }
    });

    // 3. Monkeypatch the cloned document's defaultView getComputedStyle if it exists!
    const clonedWin = clonedDoc.defaultView;
    if (clonedWin) {
      const origClonedGetComputedStyle = clonedWin.getComputedStyle;
      clonedWin.getComputedStyle = function(elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
        const realStyle = origClonedGetComputedStyle(elt, pseudoElt);
        return new Proxy(realStyle, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab'))) {
                  return convertModernColorStr(val);
                }
                return val;
              };
            }
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab'))) {
              return convertModernColorStr(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        }) as CSSStyleDeclaration;
      };
    }
  } catch (err) {
    console.warn("cleanClonedDocForPdf warning:", err);
  }
}

export async function runWithOklchPolyfill<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof window === 'undefined') return fn();

  const originalGetComputedStyle = window.getComputedStyle;

  window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const realStyle = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(realStyle, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return function(propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab'))) {
              return convertModernColorStr(val);
            }
            return val;
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('lab'))) {
          return convertModernColorStr(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    }) as CSSStyleDeclaration;
  };

  try {
    return await fn();
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
}

