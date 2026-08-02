import { Invoice } from '../types';

/**
 * Format Iraqi Dinar amount with commas
 */
export function formatIQD(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' د.ع';
}

function safePrintHTML(htmlContent: string) {
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    console.warn('window.open popup blocked or failed:', e);
  }

  // Fallback using hidden iframe if popup is blocked
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500);
    }
  } catch (e) {
    console.error('Fallback print iframe failed:', e);
  }
}

/**
 * Standard A4 Invoice Printing
 */
export function printInvoicePDF(invoice: Invoice, formatSize: 'A4' | '88mm' | '44mm' = 'A4') {
  if (formatSize === '88mm') {
    return printThermalReceipt88mm(invoice);
  }
  if (formatSize === '44mm') {
    return printThermalReceipt44mm(invoice);
  }

  const itemsHtml = invoice.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: right;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center;">${formatIQD(item.unitPriceIQD)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: left; font-weight: bold;">${formatIQD(item.totalPriceIQD)}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <title>فاتورة رقم ${invoice.invoiceNumber}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
      @page {
        size: auto;
        margin: 10mm;
      }
      body {
        font-family: 'Tajawal', sans-serif;
        background-color: #ffffff;
        color: #0f172a;
        margin: 0;
        padding: 20px;
        direction: rtl;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-box {
        max-width: 800px;
        margin: auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 16px;
        margin-bottom: 20px;
      }
      .brand {
        font-size: 24px;
        font-weight: 800;
        color: #1e40af;
      }
      .inv-title {
        font-size: 18px;
        color: #475569;
        font-weight: 700;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
        background: #f8fafc;
        padding: 14px;
        border-radius: 8px;
        border: 1px solid #f1f5f9;
      }
      .info-item label {
        font-size: 12px;
        color: #64748b;
        display: block;
        margin-bottom: 2px;
      }
      .info-item span {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 24px;
      }
      th {
        background: #f1f5f9;
        color: #1e293b;
        padding: 10px;
        font-size: 13px;
        font-weight: 700;
        border-bottom: 2px solid #cbd5e1;
      }
      td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 13px;
        color: #334155;
      }
      .totals {
        width: 280px;
        margin-right: auto;
        background: #f8fafc;
        padding: 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 13px;
      }
      .total-row.grand {
        font-size: 16px;
        font-weight: 800;
        color: #1e40af;
        border-top: 2px dashed #cbd5e1;
        padding-top: 8px;
        margin-top: 4px;
      }
      .footer-note {
        text-align: center;
        margin-top: 30px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #64748b;
      }
      @media print {
        body { background: #ffffff; color: #000000; padding: 0; }
        .invoice-box { background: #ffffff; border: none; box-shadow: none; padding: 0; }
        .header { border-bottom-color: #000; }
        .brand { color: #000; }
        .info-grid { background: #f8fafc; border: 1px solid #e2e8f0; }
        .info-item span { color: #000; }
        th { background: #f1f5f9; color: #000; }
        td { border-bottom-color: #e2e8f0 !important; color: #000; }
        .totals { background: #f8fafc; border: 1px solid #e2e8f0; }
        .total-row.grand { color: #000; }
        button, .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <div class="header">
        <div>
          <div class="brand">Barham Pro | برهم برو</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">${invoice.shopName}</div>
          <div style="font-size: 12px; color: #64748b;">${invoice.shopAddress || ''} | هاتف: ${invoice.shopPhone || ''}</div>
        </div>
        <div style="text-align: left;">
          <div class="inv-title">فاتورة مبيعات / صيانة</div>
          <div style="font-size: 14px; font-weight: bold; color: #3b82f6; margin-top: 4px;"># ${invoice.invoiceNumber}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <label>اسم الزبون:</label>
          <span>${invoice.customerName}</span>
        </div>
        <div class="info-item">
          <label>رقم هاتف الزبون:</label>
          <span>${invoice.customerPhone}</span>
        </div>
        <div class="info-item">
          <label>تاريخ الفاتورة:</label>
          <span>${new Date(invoice.createdAt).toLocaleDateString('ar-IQ')}</span>
        </div>
        <div class="info-item">
          <label>طريقة الدفع:</label>
          <span>${invoice.paymentMethod === 'zain_cash' ? 'زين كاش (Zain Cash)' : invoice.paymentMethod === 'card' ? 'بطاقة إلكترونية' : 'نقداً (Cash)'}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th style="text-align: right;">الوصف / المنتج / الخدمة</th>
            <th style="width: 80px;">الكمية</th>
            <th style="width: 140px;">سعر الوحدة</th>
            <th style="width: 140px; text-align: left;">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>المجموع الفرعي:</span>
          <span>${formatIQD(invoice.subtotalIQD)}</span>
        </div>
        ${
          invoice.discountIQD > 0
            ? `<div class="total-row" style="color: #ef4444;">
                 <span>الخصم:</span>
                 <span>- ${formatIQD(invoice.discountIQD)}</span>
               </div>`
            : ''
        }
        <div class="total-row grand">
          <span>المبلغ الإجمالي:</span>
          <span>${formatIQD(invoice.totalIQD)}</span>
        </div>
      </div>

      ${
        invoice.notes
          ? `<div style="margin-top: 25px; padding: 12px; background: #0f172a; border-radius: 8px; font-size: 13px; color: #cbd5e1;">
               <strong>ملاحظات وشروط الضمان:</strong> ${invoice.notes}
             </div>`
          : ''
      }

      <div class="footer-note">
        شكراً لتعاملكم مع <strong>${invoice.shopName}</strong> - نظام Barham Pro لإدارة المحلات والصيانة
      </div>
    </div>

    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    </script>
  </body>
  </html>
  `;

  safePrintHTML(htmlContent);
}

/**
 * Thermal Receipt Printing for 88mm Roll Paper
 */
export function printThermalReceipt88mm(invoice: Invoice) {
  const itemsHtml = invoice.items
    .map(
      (item) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; font-weight: bold;">
      <span style="flex: 1; text-align: right;">${item.description} (x${item.quantity})</span>
      <span style="width: 80px; text-align: left;">${formatIQD(item.totalPriceIQD)}</span>
    </div>
  `
    )
    .join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <title>إيصال فاتورة ${invoice.invoiceNumber}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&display=swap');
      @page {
        size: 88mm auto;
        margin: 0;
      }
      body {
        font-family: 'Tajawal', sans-serif;
        width: 88mm;
        margin: 0 auto;
        padding: 6mm 4mm;
        background: #ffffff;
        color: #000000;
        box-sizing: border-box;
        direction: rtl;
        font-size: 12px;
        line-height: 1.4;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .bold { font-weight: 800; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .double-divider { border-top: 2px solid #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .brand { font-size: 18px; font-weight: 900; }
      @media print {
        body { margin: 0; padding: 4mm; }
        button, .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="text-center">
      <div class="brand">Barham Pro</div>
      <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${invoice.shopName}</div>
      <div style="font-size: 11px;">${invoice.shopAddress || 'العراق'}</div>
      <div style="font-size: 11px;">هاتف: ${invoice.shopPhone || ''}</div>
    </div>

    <div class="double-divider"></div>

    <div class="row">
      <span>رقم الوصل:</span>
      <span class="bold">#${invoice.invoiceNumber}</span>
    </div>
    <div class="row">
      <span>التاريخ:</span>
      <span>${new Date(invoice.createdAt).toLocaleDateString('ar-IQ')} ${new Date(invoice.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div class="row">
      <span>الزبون:</span>
      <span class="bold">${invoice.customerName}</span>
    </div>
    <div class="row">
      <span>هاتف الزبون:</span>
      <span>${invoice.customerPhone}</span>
    </div>

    <div class="divider"></div>

    <div style="font-weight: 800; margin-bottom: 6px; font-size: 13px;">المواد والخدمات:</div>
    ${itemsHtml}

    <div class="divider"></div>

    <div class="row" style="font-size: 12px;">
      <span>المجموع الفرعي:</span>
      <span>${formatIQD(invoice.subtotalIQD)}</span>
    </div>
    ${
      invoice.discountIQD > 0
        ? `<div class="row">
             <span>الخصم:</span>
             <span>- ${formatIQD(invoice.discountIQD)}</span>
           </div>`
        : ''
    }

    <div class="double-divider"></div>

    <div class="row" style="font-size: 15px; font-weight: 900;">
      <span>المبلغ الكلي:</span>
      <span>${formatIQD(invoice.totalIQD)}</span>
    </div>

    ${
      invoice.notes
        ? `<div class="divider"></div>
           <div style="font-size: 10px; margin-top: 4px;">
             <strong>الشروط والضمان:</strong> ${invoice.notes}
           </div>`
        : ''
    }

    <div class="divider"></div>

    <div class="text-center" style="margin-top: 10px; font-size: 11px; font-weight: bold;">
      شكراً لتعاملكم مع ${invoice.shopName}
      <br>
      <span style="font-size: 9.5px; color: #444;">Barham Pro</span>
    </div>

    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 400);
      };
    </script>
  </body>
  </html>
  `;

  safePrintHTML(htmlContent);
}

/**
 * Thermal Receipt Printing for 44mm Roll Paper
 */
export function printThermalReceipt44mm(invoice: Invoice) {
  const itemsHtml = invoice.items
    .map(
      (item) => `
    <div style="margin-bottom: 3px;">
      <div style="font-weight: bold; font-size: 10px;">${item.description}</div>
      <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
        <span>${item.quantity}x ${formatIQD(item.unitPriceIQD)}</span>
        <span style="font-weight: bold;">${formatIQD(item.totalPriceIQD)}</span>
      </div>
    </div>
  `
    )
    .join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <title>إيصال فاتورة ${invoice.invoiceNumber}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&display=swap');
      @page {
        size: 44mm auto;
        margin: 0;
      }
      body {
        font-family: 'Tajawal', sans-serif;
        width: 44mm;
        margin: 0 auto;
        padding: 4mm 2mm;
        background: #ffffff;
        color: #000000;
        box-sizing: border-box;
        direction: rtl;
        font-size: 9.5px;
        line-height: 1.3;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .text-center { text-align: center; }
      .bold { font-weight: 800; }
      .divider { border-top: 1px dashed #000; margin: 5px 0; }
      .double-divider { border-top: 1.5px solid #000; margin: 5px 0; }
      .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .brand { font-size: 13px; font-weight: 900; }
      @media print {
        body { margin: 0; padding: 2mm; }
        button, .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="text-center">
      <div class="brand">Barham Pro</div>
      <div style="font-size: 10px; font-weight: bold;">${invoice.shopName}</div>
      <div style="font-size: 8.5px;">هاتف: ${invoice.shopPhone || ''}</div>
    </div>

    <div class="double-divider"></div>

    <div class="row">
      <span>الوصل:</span>
      <span class="bold">#${invoice.invoiceNumber}</span>
    </div>
    <div class="row">
      <span>التاريخ:</span>
      <span>${new Date(invoice.createdAt).toLocaleDateString('ar-IQ')}</span>
    </div>
    <div class="row">
      <span>الزبون:</span>
      <span class="bold">${invoice.customerName}</span>
    </div>

    <div class="divider"></div>

    <div style="font-weight: 800; margin-bottom: 4px; font-size: 10px;">المواد:</div>
    ${itemsHtml}

    <div class="double-divider"></div>

    <div class="row" style="font-size: 11px; font-weight: 900;">
      <span>المجموع:</span>
      <span>${formatIQD(invoice.totalIQD)}</span>
    </div>

    <div class="divider"></div>

    <div class="text-center" style="margin-top: 6px; font-size: 8.5px; font-weight: bold;">
      شكراً لزيارتكم! - Barham Pro
    </div>

    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 400);
      };
    </script>
  </body>
  </html>
  `;

  safePrintHTML(htmlContent);
}
