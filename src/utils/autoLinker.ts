import { Product } from '../types';

export interface AutoLinkResult {
  updatedContent: string;
  linksCount: number;
  linkedProducts: Product[];
}

/**
 * Normalizes text for Persian matching (replaces variations of y/k/spaces)
 */
export function normalizePersianText(str: string): string {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ') // replace zero-width spaces & multiple spaces with single space
    .trim();
}

/**
 * Builds a search dictionary from a list of products.
 * Includes product names, brand names, and key aliases.
 */
export function getProductKeywordsList(products: Product[]): Array<{
  keyword: string;
  normalizedKeyword: string;
  product: Product;
}> {
  const dictionary: Array<{ keyword: string; normalizedKeyword: string; product: Product }> = [];
  const seenKeywords = new Set<string>();

  products.forEach((prod) => {
    if (!prod || !prod.id) return;

    // Add full product name if valid (>= 3 chars)
    if (prod.name && prod.name.trim().length >= 3) {
      const normName = normalizePersianText(prod.name);
      if (!seenKeywords.has(normName)) {
        seenKeywords.add(normName);
        dictionary.push({
          keyword: prod.name.trim(),
          normalizedKeyword: normName,
          product: prod,
        });
      }
    }

    // Add brand name if distinct and >= 3 chars
    if (prod.brand && prod.brand.trim().length >= 3) {
      const normBrand = normalizePersianText(prod.brand);
      if (!seenKeywords.has(normBrand)) {
        seenKeywords.add(normBrand);
        dictionary.push({
          keyword: prod.brand.trim(),
          normalizedKeyword: normBrand,
          product: prod,
        });
      }
    }
  });

  // Sort keywords by length descending (longer specific matches first)
  return dictionary.sort((a, b) => b.normalizedKeyword.length - a.normalizedKeyword.length);
}

/**
 * Scans article markdown content and automatically embeds [[product:ID|Keyword]] shortcodes
 * for keywords matching store products.
 *
 * Rules:
 * - Does NOT modify headings (##, ###)
 * - Protects existing [[shortcodes]]
 * - Limits links to maxPerProduct (default 2) per product per article
 */
export function autoInjectProductShortcodes(
  content: string,
  products: Product[],
  maxPerProduct: number = 2
): AutoLinkResult {
  if (!content || !products || products.length === 0) {
    return { updatedContent: content || '', linksCount: 0, linkedProducts: [] };
  }

  // Step 1: Extract and protect existing shortcodes like [[product:123|name]] or [[factory:1|fac]]
  const protectedShortcodes: string[] = [];
  let maskedContent = content.replace(/\[\[[\s\S]*?\]\]/g, (match) => {
    const placeholder = `___SHORTCODE_PH_${protectedShortcodes.length}___`;
    protectedShortcodes.push(match);
    return placeholder;
  });

  // Step 2: Split content into lines to preserve Markdown structure (headings, lists)
  const lines = maskedContent.split('\n');
  const dictionary = getProductKeywordsList(products);
  const productLinkCounts = new Map<string, number>();
  const linkedProductSet = new Set<Product>();
  let totalLinksAdded = 0;

  const processedLines = lines.map((line) => {
    const trimmed = line.trim();

    // Skip headings or empty lines
    if (trimmed.startsWith('#') || trimmed.startsWith('[[') || !trimmed) {
      return line;
    }

    let modifiedLine = line;

    // Scan dictionary keywords
    for (const item of dictionary) {
      const prodId = String(item.product.id);
      const currentCount = productLinkCounts.get(prodId) || 0;
      if (currentCount >= maxPerProduct) continue;

      // Escape regex special chars in keyword
      const escapedKeyword = item.keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      // Look for keyword not enclosed in words or existing placeholders
      const regex = new RegExp(`(?<![\\w\u0600-\u06FF])${escapedKeyword}(?![\\w\u0600-\u06FF])`, 'i');

      if (regex.test(modifiedLine)) {
        // Replace first occurrence in this line
        modifiedLine = modifiedLine.replace(regex, (matchedStr) => {
          productLinkCounts.set(prodId, (productLinkCounts.get(prodId) || 0) + 1);
          linkedProductSet.add(item.product);
          totalLinksAdded++;
          return `[[product:${item.product.id}|${matchedStr}]]`;
        });
      }
    }

    return modifiedLine;
  });

  // Step 3: Re-join lines and restore protected shortcodes
  let resultText = processedLines.join('\n');
  protectedShortcodes.forEach((sc, idx) => {
    resultText = resultText.replace(`___SHORTCODE_PH_${idx}___`, sc);
  });

  return {
    updatedContent: resultText,
    linksCount: totalLinksAdded,
    linkedProducts: Array.from(linkedProductSet),
  };
}
