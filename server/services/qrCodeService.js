const QRCode = require('qrcode');

/**
 * QR Code Generator Service
 * Generates server-side QR Code Data URLs encoding verification paths (e.g. "/verify/HC-2026-000001")
 */
const generateQRCodeDataURL = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#1b2a4a',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    throw new Error(`Failed to generate QR code: ${err.message}`);
  }
};

module.exports = {
  generateQRCodeDataURL
};
