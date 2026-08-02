import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Generate a Barcode image as Data URI
 */
export function generateBarcodeDataUrl(text: string): string {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text || 'BARHAM-PRO-12345', {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      font: 'monospace',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 4,
      fontSize: 14,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Barcode generation error:', err);
    return '';
  }
}

/**
 * Generate a QR Code image as Data URI asynchronously
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text || 'https://barhampro.com', {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}
