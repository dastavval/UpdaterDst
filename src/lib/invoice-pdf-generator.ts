import jsPDF from 'jspdf';
import { toPng, toJpeg } from 'html-to-image';

/**
 * Triggers native responsive print/PDF dialog using a clean, isolated iframe.
 * Works seamlessly in mobile browsers, desktop, and iframe sandboxes.
 */
export function printInvoiceViaIframe(elementId: string = 'printable-invoice'): boolean {
  try {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
      window.print();
      return true;
    }

    // Check if previous print iframe exists and clean it up
    const existingIframe = document.getElementById('dastavval-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'dastavval-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return true;
    }

    const headContent = `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>پیش‌فاکتور رسمی - دست اول</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 6mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Vazirmatn', Tahoma, 'Segoe UI', Arial, sans-serif;
          direction: rtl;
          background: #ffffff;
          color: #0f172a;
          font-size: 11px;
        }
        .a4-box {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }
        .a4-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .a4-table th, .a4-table td {
          border: 1px solid #cbd5e1;
          padding: 4px 6px;
          font-size: 10px;
        }
        .a4-table th {
          background-color: #f1f5f9 !important;
          font-weight: 800;
        }
        .a4-header-bg {
          background-color: #f8fafc !important;
        }
        .no-print, .print\\:hidden {
          display: none !important;
        }
        input, button, select {
          border: none !important;
          background: transparent !important;
        }
      </style>
    `;

    // Clone element and remove control buttons
    const cloned = originalElement.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('.no-print, button').forEach(el => {
      // Keep digital seals and static elements, remove interactive buttons
      if (!el.closest('.OfficialUnifiedSealSignature') && !el.classList.contains('preserve-print')) {
        el.remove();
      }
    });

    doc.open();
    doc.write(`<!DOCTYPE html><html><head>${headContent}</head><body>${cloned.outerHTML}</body></html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print failed, falling back to window.print', e);
        window.print();
      }
    }, 400);

    return true;
  } catch (err) {
    console.error('Print iframe error:', err);
    try {
      window.print();
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Downloads invoice directly as a standard, high-resolution, responsive A4 PDF file.
 */
export async function downloadInvoicePdfDirectly(
  elementId: string = 'printable-invoice',
  filename: string = 'Pishfaktor.pdf'
): Promise<{ success: boolean; message: string }> {
  const element = document.getElementById(elementId);
  if (!element) {
    return { success: false, message: 'المان پیش‌فاکتور یافت نشد.' };
  }

  // Ensure fonts are ready
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch (e) {}

  try {
    // Generate crisp canvas snapshot
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node: HTMLElement) => {
        if (node.classList && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      }
    });

    if (!dataUrl) {
      throw new Error('Image data capture returned empty');
    }

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const availableWidth = pdfWidth - margin * 2;
    const availableHeight = pdfHeight - margin * 2;

    const imgWidth = availableWidth;
    const totalImgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

    let heightLeft = totalImgHeight;
    let position = margin;
    let page = 1;

    while (heightLeft > 0) {
      if (page > 1) {
        pdf.addPage();
        position = margin;
      }

      pdf.addImage(
        dataUrl,
        'PNG',
        margin,
        position - availableHeight * (page - 1),
        imgWidth,
        totalImgHeight,
        undefined,
        'FAST'
      );

      heightLeft -= availableHeight;
      page++;
    }

    pdf.save(filename);
    return {
      success: true,
      message: `فایل PDF پیش‌فاکتور (${filename}) با موفقیت دانلود شد.`
    };
  } catch (err) {
    console.warn('Direct jsPDF generation failed, initiating print fallback:', err);
    printInvoiceViaIframe(elementId);
    return {
      success: true,
      message: 'پنجره ذخیره PDF و چاپ پیش‌فاکتور آماده شد.'
    };
  }
}
