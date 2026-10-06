import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface PixQrCodeProps {
  pixKey: string;
  customImageUrl?: string;
  amount?: number;
  receiverName?: string;
}

export const PixQrCode: React.FC<PixQrCodeProps> = ({
  pixKey,
  customImageUrl,
  amount,
  receiverName,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (customImageUrl) {
      setQrCodeDataUrl(customImageUrl);
      return;
    }

    if (pixKey) {
      // Generate clean QR code
      const cleanKey = pixKey.replace(/\D/g, '');
      const qrPayload = pixKey.includes('@') ? pixKey : cleanKey.length >= 10 ? cleanKey : pixKey;

      QRCode.toDataURL(qrPayload, {
        width: 220,
        margin: 1,
        color: {
          dark: '#1d1d1f',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [pixKey, customImageUrl, amount, receiverName]);

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-black/[0.08] shadow-2xs">
      <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl overflow-hidden flex items-center justify-center bg-white p-2">
        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="QR Code PIX para pagamento"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-xs text-slate-400 animate-pulse">Gerando QR Code...</div>
        )}
      </div>
      <p className="text-[11px] text-[#86868b] font-medium text-center mt-2">
        Abra o app do seu banco e aponte a câmera para pagar
      </p>
    </div>
  );
};
