import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ExternalLink, Download } from 'lucide-react';

export function QRDisplay({ batchId, qrCodeUrl, publicVerifyUrl, size = 180 }) {
  const targetUrl = publicVerifyUrl || (batchId ? `${window.location.origin}/verify/${batchId}` : '');

  const handleDownload = () => {
    const svg = document.getElementById(`qr-svg-${batchId}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 40;
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `HoneyChain_QR_${batchId || 'code'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!batchId && !qrCodeUrl) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-xl">
      <div className="p-3 bg-stone-950 rounded-xl border border-amber-500/20 shadow-inner mb-3">
        {qrCodeUrl && qrCodeUrl.startsWith('data:image') ? (
          <img src={qrCodeUrl} alt={`QR Code for ${batchId}`} className="w-auto h-auto max-w-[200px]" />
        ) : (
          <QRCodeSVG
            id={`qr-svg-${batchId}`}
            value={targetUrl}
            size={size}
            bgColor="#0f0d0b"
            fgColor="#f59e0b"
            level="H"
            includeMargin={true}
          />
        )}
      </div>

      <div className="text-center space-y-1 mb-4">
        <p className="text-xs text-stone-400 font-mono font-medium">BATCH IDENTIFIER</p>
        <p className="text-sm font-bold text-amber-400 font-mono tracking-wider">{batchId}</p>
      </div>

      <div className="flex flex-wrap gap-2 w-full justify-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download PNG
        </button>

        {batchId && (
          <a
            href={`/verify/${batchId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public Page
          </a>
        )}
      </div>
    </div>
  );
}
