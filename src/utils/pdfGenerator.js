import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Clean customer name for safe cross-platform filename
 * @param {string} name 
 * @returns {string}
 */
export function cleanCustomerNameForFilename(name) {
  if (!name || typeof name !== 'string' || !name.trim()) return 'Customer';
  // Remove illegal characters: \ / : * ? " < > |
  let cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  return cleaned || 'Customer';
}

/**
 * Format date for safe filename (DD-MM-YYYY)
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function formatDateForFilename(dateInput) {
  if (!dateInput) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (typeof dateInput === 'string' && dateInput.includes('/')) {
    return dateInput.replace(/[\/\\]/g, '-');
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput).replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, '-');
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Build document PDF filename formatted with Customer Name and Date
 * e.g. CustomerName_DD-MM-YYYY_Bill.pdf
 * @param {object} params
 * @returns {string}
 */
export function buildDocumentPdfFilename({ customerName, date, type, number } = {}) {
  const safeName = cleanCustomerNameForFilename(customerName);
  const safeDate = formatDateForFilename(date);

  let typeSuffix = '';
  const lowerType = (type || '').toLowerCase();
  if (lowerType === 'invoice' || lowerType === 'bill') {
    typeSuffix = '_Bill';
  } else if (lowerType === 'receipt' || lowerType === 'money_receipt' || lowerType === 'moneyreceipt') {
    typeSuffix = '_Money_Receipt';
  } else if (lowerType === 'quotation') {
    typeSuffix = '_Quotation';
  } else if (lowerType === 'isp' || lowerType === 'isp_receipt') {
    typeSuffix = '_ISP_Receipt';
  } else if (lowerType === 'isp_bill') {
    typeSuffix = '_ISP_Bill';
  } else if (lowerType === 'warranty' || lowerType === 'service' || lowerType === 'warranty_slip') {
    typeSuffix = '_Warranty_Slip';
  } else if (lowerType === 'ledger') {
    typeSuffix = '_Ledger';
  } else if (type) {
    typeSuffix = `_${type.replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, '_')}`;
  }

  return `${safeName}_${safeDate}${typeSuffix}.pdf`;
}

/**
 * Safely trigger print with custom document.title so browser's "Save as PDF" suggests this filename
 * @param {string} titleFilename 
 */
export function triggerPrintWithFilename(titleFilename) {
  const originalTitle = document.title;
  if (titleFilename) {
    document.title = titleFilename.replace(/\.pdf$/i, '');
  }
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

/**
 * Trigger immediate browser download of a Blob or File
 * @param {Blob|File} blobOrFile 
 * @param {string} filename 
 */
export function downloadPdfFile(blobOrFile, filename) {
  const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  const url = URL.createObjectURL(blobOrFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Locate printable element with retries
 */
export async function findPrintableElement(elementId = 'printable-content', maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const el = document.getElementById(elementId) || 
               document.querySelector('.invoice-printable, .quotation-printable, .statement-printable, .money-receipt-printable, .warranty-slip-printable, #printable-content');
    if (el) return el;
    await new Promise(res => setTimeout(res, 60));
  }
  return null;
}

/**
 * Generate high-definition PDF from a DOM element
 * @param {HTMLElement} element 
 * @param {string} filename 
 * @param {object} options 
 * @returns {Promise<{ pdf: jsPDF, blob: Blob, file: File, filename: string }>}
 */
export async function generatePdfFromElement(element, filename = 'FC_Technology_Document.pdf', options = {}) {
  if (!element) {
    throw new Error('No element provided for PDF generation');
  }

  const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  const a4WidthPx = 794; // Standard 210mm at 96 DPI

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font timeout
    }
  }

  // Preload all images (logo, watermark, authority seal/signature) inside printable element before capture
  const printableImages = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    printableImages.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 800);
      });
    })
  );

  const canvas = await html2canvas(element, {
    scale: 2, // 2x crispness
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: a4WidthPx,
    onclone: (clonedDoc) => {
      // Inject high-precision print styles to fix html2canvas text baseline drop and pin signatures to bottom
      const styleTag = clonedDoc.createElement('style');
      styleTag.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
        * {
          box-sizing: border-box !important;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', -apple-system, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', -apple-system, sans-serif !important;
        }
        /* Fix text vertical alignment in table rows and calculation boxes */
        .invoice-printable table,
        .quotation-printable table,
        .money-receipt-printable table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        .invoice-printable table tr,
        .quotation-printable table tr,
        .money-receipt-printable table tr {
          vertical-align: middle !important;
        }
        .invoice-printable table th,
        .invoice-printable table td,
        .quotation-printable table th,
        .quotation-printable table td,
        .money-receipt-printable table th,
        .money-receipt-printable table td {
          vertical-align: middle !important;
          line-height: 1.35 !important;
        }
        .invoice-printable table td > div,
        .invoice-printable table th > div,
        .quotation-printable table td > div,
        .quotation-printable table th > div {
          min-height: 22px !important;
          display: flex !important;
          align-items: center !important;
        }
        .invoice-subtotal-box {
          display: flex !important;
          flex-direction: column !important;
        }
        .invoice-subtotal-box > div {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          line-height: 1.35 !important;
        }
        .invoice-subtotal-box span {
          display: inline-flex !important;
          align-items: center !important;
          line-height: 1.35 !important;
        }
        /* Bill, Quotation and Money Receipt size 12 font styling */
        .invoice-printable,
        .quotation-printable,
        .money-receipt-printable {
          font-size: 12px !important;
        }
        .invoice-printable table,
        .invoice-printable table th,
        .invoice-printable table td,
        .quotation-printable table,
        .quotation-printable table th,
        .quotation-printable table td,
        .money-receipt-printable table,
        .money-receipt-printable table th,
        .money-receipt-printable table td {
          font-size: 12px !important;
        }
        .invoice-printable .invoice-transparent-box,
        .invoice-printable .invoice-subtotal-box,
        .quotation-printable .quotation-transparent-box,
        .money-receipt-printable .invoice-transparent-box {
          font-size: 12px !important;
        }
        /* Terms and Conditions font size 10 */
        .invoice-printable .invoice-terms-box,
        .invoice-printable .invoice-terms-box *,
        .quotation-printable .quotation-terms-box,
        .quotation-printable .quotation-terms-box * {
          font-size: 10px !important;
          line-height: 1.35 !important;
        }
        /* Glossy Ash headers & title badges for Invoice and Quotation */
        .silver-title-badge,
        .invoice-printable .silver-title-badge,
        .quotation-printable .silver-title-badge {
          background: linear-gradient(180deg, #ffffff 0%, #edf2f7 32%, #d8e1e8 68%, #e6ecf2 100%) !important;
          background-color: #e2e8f0 !important;
          color: #090d16 !important;
          border: 1px solid #94a3b8 !important;
          border-bottom: 1.5px solid #64748b !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 1px 3px rgba(15, 23, 42, 0.08) !important;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) !important;
          font-weight: 800 !important;
          letter-spacing: 0.03em !important;
        }
        .silver-header-row,
        .invoice-printable thead tr,
        .quotation-printable thead tr {
          background: linear-gradient(180deg, #ffffff 0%, #edf2f7 28%, #d8e1e8 68%, #e4ecf3 100%) !important;
          background-color: #e2e8f0 !important;
          color: #090d16 !important;
          border-top: 1px solid #94a3b8 !important;
          border-bottom: 1.5px solid #64748b !important;
        }
        .silver-header-row th,
        .invoice-printable thead th,
        .quotation-printable thead th {
          background: linear-gradient(180deg, #ffffff 0%, #edf2f7 28%, #d8e1e8 68%, #e4ecf3 100%) !important;
          background-color: #e2e8f0 !important;
          color: #090d16 !important;
          font-weight: 800 !important;
          border-color: #94a3b8 !important;
          border-top: 1px solid #94a3b8 !important;
          border-bottom: 1.5px solid #64748b !important;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75) !important;
        }
        /* Bottom silver divider */
        .silver-bottom-divider {
          width: 100% !important;
          border-top: 2px solid #94a3b8 !important;
          margin-top: auto !important;
          margin-bottom: 6px !important;
        }
        /* Pinned signatures at very bottom of page */
        .invoice-signatures,
        .quotation-signatures,
        .money-receipt-signatures,
        .warranty-signatures,
        .statement-signatures {
          margin-top: auto !important;
          padding-top: 14px !important;
          padding-bottom: 10px !important;
          width: 100% !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-end !important;
        }
      `;
      clonedDoc.head.appendChild(styleTag);

      // Find element or clone root in cloned document
      const clonedEl = clonedDoc.getElementById(element.id || 'printable-content') || 
                       clonedDoc.querySelector('.invoice-printable, .quotation-printable, .statement-printable, .money-receipt-printable, .warranty-slip-printable, #printable-content') || 
                       clonedDoc.body.firstElementChild;
      
      if (clonedEl) {
        // Expand parent chain to A4 standard width
        let p = clonedEl.parentElement;
        while (p && p !== clonedDoc.body) {
          p.style.width = `${a4WidthPx}px`;
          p.style.maxWidth = `${a4WidthPx}px`;
          p.style.minWidth = `${a4WidthPx}px`;
          p.style.margin = '0 auto';
          p.style.padding = '0';
          p.style.overflow = 'visible';
          p.style.position = 'static';
          p.style.transform = 'none';
          p = p.parentElement;
        }

        clonedEl.style.width = `${a4WidthPx}px`;
        clonedEl.style.minWidth = `${a4WidthPx}px`;
        clonedEl.style.maxWidth = `${a4WidthPx}px`;
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.margin = '0 auto';
        clonedEl.style.backgroundColor = '#ffffff';

        // Check if single-page document (invoice, quotation, money receipt, warranty slip):
        // Standard A4 height is 1123px (794 * 297 / 210).
        // Force exact 1-page fit so document never splits into 2 pages!
        const isSinglePageDoc = options.forceSinglePage !== false && (
          options.singlePage === true ||
          clonedEl.classList.contains('invoice-printable') || 
          clonedEl.classList.contains('quotation-printable') || 
          clonedEl.classList.contains('money-receipt-printable') ||
          clonedEl.classList.contains('warranty-slip-printable') ||
          clonedEl.id === 'printable-content'
        );

        if (isSinglePageDoc) {
          const a4HeightPx = 1123;
          clonedEl.style.display = 'flex';
          clonedEl.style.flexDirection = 'column';
          clonedEl.style.justifyContent = 'space-between';
          clonedEl.style.boxSizing = 'border-box';
          clonedEl.style.height = `${a4HeightPx}px`;
          clonedEl.style.maxHeight = `${a4HeightPx}px`;
          clonedEl.style.minHeight = `${a4HeightPx}px`;
          clonedEl.style.overflow = 'hidden';
          clonedEl.style.padding = '16px 20px 14px 20px';

          // Pin signatures to the bottom
          const sigBlock = clonedEl.querySelector('.invoice-signatures, .quotation-signatures, .money-receipt-signatures, .warranty-signatures');
          if (sigBlock) {
            sigBlock.style.marginTop = 'auto';
            sigBlock.style.paddingTop = '14px';
            sigBlock.style.paddingBottom = '4px';
          }
        }

        // Hide screen action buttons and print:hidden elements
        const toHide = clonedEl.querySelectorAll('.print\\:hidden, button, [data-pdf-hide="true"]');
        toHide.forEach((node) => {
          node.style.display = 'none';
        });

        // Auto-ensure authority seal & signature image is present in any printable document
        const sigBlocks = clonedDoc.querySelectorAll(
          '.invoice-signatures, .quotation-signatures, .money-receipt-signatures, .statement-signatures, .warranty-signatures, [class*="-signatures"]'
        );
        sigBlocks.forEach((sigBlock) => {
          const cols = Array.from(sigBlock.children);
          const authCol = cols.find((c) => 
            c.textContent.includes('কর্তৃপক্ষ') || 
            c.textContent.includes('Authorized') ||
            c.textContent.includes('Authority')
          ) || (cols.length > 1 ? cols[cols.length - 1] : null);

          if (authCol && !authCol.querySelector('img')) {
            const borderLine = authCol.querySelector('.border-t, [style*="border-top"]') || authCol.firstElementChild;
            const sigImg = clonedDoc.createElement('img');
            sigImg.src = '/authority_seal_signature.png';
            sigImg.alt = 'Authorized Seal & Signature';
            sigImg.className = 'h-14 object-contain mx-auto mb-1 select-none';
            sigImg.style.height = '54px';
            sigImg.style.objectFit = 'contain';
            sigImg.style.display = 'block';
            sigImg.style.margin = '0 auto 4px auto';
            if (borderLine) {
              authCol.insertBefore(sigImg, borderLine);
            } else {
              authCol.prepend(sigImg);
            }
          }
        });

        // Ensure quotation and warranty transparent boxes stay transparent
        const transparentBoxes = clonedEl.querySelectorAll('.quotation-transparent-box, .warranty-transparent-box');
        transparentBoxes.forEach((tb) => {
          tb.style.backgroundColor = 'transparent';
        });
      }
    },
    ...options
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const isSinglePageDoc = options.forceSinglePage !== false && (
    options.singlePage === true ||
    element.classList.contains('invoice-printable') || 
    element.classList.contains('quotation-printable') || 
    element.classList.contains('money-receipt-printable') ||
    element.classList.contains('warranty-slip-printable') ||
    imgHeight <= pageHeight + 5
  );

  if (isSinglePageDoc) {
    if (imgHeight > pageHeight) {
      // Scale down proportionally to fit precisely on a single A4 page
      const scale = pageHeight / imgHeight;
      const fitWidth = imgWidth * scale;
      const fitHeight = pageHeight;
      const offsetX = (pageWidth - fitWidth) / 2;
      pdf.addImage(imgData, 'JPEG', offsetX, 0, fitWidth, fitHeight, undefined, 'FAST');
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    }
  } else {
    // Multi-page slicing for tall statements / ledger accounts
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
  }

  const blob = pdf.output('blob');
  const file = new File([blob], safeFilename, {
    type: 'application/pdf',
    lastModified: Date.now()
  });

  return { pdf, blob, file, filename: safeFilename };
}

/**
 * Creates a clean fallback printable element when no #printable-content is available in DOM
 */
export function createFallbackPrintableElement(data, lang = 'bn') {
  const container = document.createElement('div');
  container.id = 'temp-pdf-fallback';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '36px';
  container.style.color = '#111827';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.boxSizing = 'border-box';

  const { title, number, date, customerName, customerMobile, amount, details } = data;

  container.innerHTML = `
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 26px; font-weight: 900; color: #020617; margin: 0; text-transform: uppercase;">FC TECHNOLOGY</h1>
        <p style="font-size: 11px; color: #475569; margin: 4px 0 2px 0;">কম্পিউটার, ল্যাপটপ, সিসি ক্যামেরা ও আইটি পণ্যের বিশ্বস্ত প্রতিষ্ঠান</p>
        <p style="font-size: 11px; color: #64748b; margin: 0;">দোকান নং #১৮, আর এফ জোহরা টাওয়ার, নীচ তলা, আগ্রাবাদ, চট্টগ্রাম।</p>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">হটলাইন: 09613-181920, 01812-091939 | Email: fctechnologist@gmail.com</p>
      </div>
      <div style="text-align: right;">
        <div style="background-color: #0f172a; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 4px; display: inline-block; text-transform: uppercase; margin-bottom: 6px;">
          ${title || 'ডকুমেন্ট'}
        </div>
        ${number ? `<p style="font-size: 12px; font-weight: bold; margin: 2px 0;">নম্বর: <span style="font-family: monospace; color: #2563eb;">${number}</span></p>` : ''}
        ${date ? `<p style="font-size: 11px; color: #64748b; margin: 2px 0;">তারিখ: <b>${date}</b></p>` : ''}
      </div>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #64748b; font-weight: 600;">গ্রাহকের নাম:</span>
        <span style="font-weight: 800; color: #0f172a;">${customerName || '-'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #64748b; font-weight: 600;">মোবাইল নম্বর:</span>
        <span style="font-family: monospace; font-weight: bold; color: #334155;">${customerMobile || '-'}</span>
      </div>
      ${amount !== undefined && amount !== null ? `
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 8px;">
        <span style="font-weight: bold; color: #047857;">টাকার পরিমাণ / বকেয়া:</span>
        <span style="font-weight: 900; font-family: monospace; font-size: 15px; color: #047857;">৳ ${Number(amount).toLocaleString()}</span>
      </div>` : ''}
    </div>

    ${details ? `
    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <h3 style="font-size: 12px; font-weight: 800; color: #334155; margin: 0 0 8px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">বিস্তারিত বিবরণ:</h3>
      <pre style="font-family: inherit; font-size: 11px; color: #475569; white-space: pre-wrap; margin: 0; line-height: 1.6;">${details}</pre>
    </div>` : ''}

    <div style="margin-top: 60px; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px;">
      <div style="border-top: 1px solid #94a3b8; width: 160px; text-align: center; padding-top: 6px; font-weight: 600; color: #334155;">
        গ্রাহকের স্বাক্ষর
      </div>
      <div style="width: 220px; text-align: center;">
        <img src="/authority_seal_signature.png" alt="Authorized Seal & Signature" style="height: 75px; display: block; margin: 0 auto 6px auto; object-fit: contain;" />
        <div style="border-top: 1px solid #94a3b8; padding-top: 6px; font-weight: 700; color: #1e293b;">
          কর্তৃপক্ষের স্বাক্ষর ও সিল
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * Helper to share a PDF file using Web Share API
 */
export async function sharePdfNative({ file, title, text }) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: title || file.name,
      text: text || ''
    });
    return { success: true, method: 'native-file' };
  } else if (navigator.share) {
    // If files aren't supported by share sheet, download the file and share text/link
    downloadPdfFile(file, file.name);
    try {
      await navigator.share({
        title: title || file.name,
        text: text || ''
      });
      return { success: true, method: 'download-and-text-share' };
    } catch {
      return { success: true, method: 'download-only' };
    }
  } else {
    // Web Share not supported: download file directly
    downloadPdfFile(file, file.name);
    return { success: true, method: 'download-only' };
  }
}
