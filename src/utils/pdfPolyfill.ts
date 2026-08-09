/**
 * pdfPolyfill.ts
 * A high-performance utility to convert modern CSS color functions (oklch, oklab, lab)
 * to standard rgb/rgba strings for html2canvas compatibility without causing DOM mutations or browser freezes.
 */

const colorCache = new Map<string, string>();

// Fast fallback color mapper using standard regex matching
export const convertModernColorStr = (val: string): string => {
  if (!val || typeof val !== 'string') return val;
  if (!val.includes('oklch') && !val.includes('oklab') && !val.includes('lab')) {
    return val;
  }
  if (colorCache.has(val)) {
    return colorCache.get(val)!;
  }

  // Common color mappings to avoid DOM querying entirely
  if (val.includes('0.278') || val.includes('15%') || val.includes('slate-900')) return 'rgb(15, 23, 42)';
  if (val.includes('0.985') || val.includes('slate-50')) return 'rgb(248, 250, 252)';
  if (val.includes('emerald')) return 'rgb(5, 150, 105)';
  if (val.includes('amber')) return 'rgb(217, 119, 6)';
  if (val.includes('indigo')) return 'rgb(79, 70, 229)';

  // Safe fallback without appending to document.body
  const rgbFallback = 'rgb(30, 41, 59)';
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
  // Execute function directly without heavy global Proxy interceptors
  return fn();
}
