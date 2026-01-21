import { useState, useEffect, useMemo, useCallback } from 'react';
import { Copy, Check, Download, Share2, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

// PIX Key Types
type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

interface PixData {
  keyType: PixKeyType;
  key: string;
  name: string;
  city: string;
  amount?: number;
  description?: string;
  transactionId?: string;
}

// Generate PIX payload (BR Code)
function generatePixPayload(data: PixData): string {
  const formatTLV = (id: string, value: string): string => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  // Merchant Account Information (ID 26)
  const gui = formatTLV('00', 'br.gov.bcb.pix');
  const pixKey = formatTLV('01', data.key);
  const merchantAccountInfo = formatTLV('26', gui + pixKey);

  // Point of Initiation Method (ID 01)
  const initiationMethod = data.amount ? formatTLV('01', '12') : formatTLV('01', '11');

  // Merchant Category Code (ID 52)
  const mcc = formatTLV('52', '0000');

  // Transaction Currency (ID 53) - 986 = BRL
  const currency = formatTLV('53', '986');

  // Transaction Amount (ID 54)
  const amount = data.amount ? formatTLV('54', data.amount.toFixed(2)) : '';

  // Country Code (ID 58)
  const countryCode = formatTLV('58', 'BR');

  // Merchant Name (ID 59)
  const merchantName = formatTLV('59', data.name.substring(0, 25));

  // Merchant City (ID 60)
  const merchantCity = formatTLV('60', data.city.substring(0, 15));

  // Additional Data Field (ID 62)
  let additionalData = '';
  if (data.description || data.transactionId) {
    const txId = data.transactionId || '***';
    additionalData = formatTLV('62', formatTLV('05', txId.substring(0, 25)));
  }

  // Build payload without CRC
  const payloadWithoutCRC =
    formatTLV('00', '01') + // Payload Format Indicator
    initiationMethod +
    merchantAccountInfo +
    mcc +
    currency +
    amount +
    countryCode +
    merchantName +
    merchantCity +
    additionalData +
    '6304'; // CRC placeholder

  // Calculate CRC-16 CCITT
  const crc = calculateCRC16(payloadWithoutCRC);

  return payloadWithoutCRC + crc;
}

// CRC-16 CCITT calculation
function calculateCRC16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Generate QR Code SVG
function generateQRCodeSVG(data: string, size: number = 200): string {
  // Simple QR code generation (for demo - use a proper library in production)
  // This creates a placeholder pattern
  const moduleSize = Math.floor(size / 25);
  const modules: boolean[][] = [];

  // Create a simple pattern based on data hash
  const hash = data.split('').reduce((a, b) => {
    return ((a << 5) - a + b.charCodeAt(0)) | 0;
  }, 0);

  for (let row = 0; row < 25; row++) {
    modules[row] = [];
    for (let col = 0; col < 25; col++) {
      // Position detection patterns
      if (
        (row < 7 && col < 7) ||
        (row < 7 && col >= 18) ||
        (row >= 18 && col < 7)
      ) {
        modules[row][col] =
          row === 0 ||
          row === 6 ||
          col === 0 ||
          col === 6 ||
          (row >= 2 && row <= 4 && col >= 2 && col <= 4);
      } else {
        // Data pattern (simplified)
        modules[row][col] = ((hash + row * col) % 3) === 0;
      }
    }
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;

  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      if (modules[row][col]) {
        svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

// QR Code Display Component
interface QRCodeDisplayProps {
  data: string;
  size?: number;
  logo?: string;
  className?: string;
}

export function QRCodeDisplay({ data, size = 200, logo, className }: QRCodeDisplayProps) {
  const qrSvg = useMemo(() => generateQRCodeSVG(data, size), [data, size]);

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className="bg-white p-4 rounded-lg"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      {logo && (
        <img
          src={logo}
          alt="Logo"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/5 h-1/5 object-contain bg-white rounded-lg p-1"
        />
      )}
    </div>
  );
}

// PIX QR Code Component
interface PixQRCodeProps {
  pixData: PixData;
  size?: number;
  showAmount?: boolean;
  showCopyButton?: boolean;
  showShareButton?: boolean;
  className?: string;
}

export function PixQRCode({
  pixData,
  size = 200,
  showAmount = true,
  showCopyButton = true,
  showShareButton = true,
  className,
}: PixQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => generatePixPayload(pixData), [pixData]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [payload]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Código PIX',
          text: payload,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to share:', error);
        }
      }
    }
  }, [payload]);

  const handleDownload = useCallback(() => {
    const svg = generateQRCodeSVG(payload, 400);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pix-qrcode-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [payload]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCodeDisplay data={payload} size={size} />
      </div>

      {/* Info */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pixData.name}
        </p>
        {showAmount && pixData.amount && (
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatAmount(pixData.amount)}
          </p>
        )}
        {pixData.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pixData.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              copied
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar código
              </>
            )}
          </button>
        )}

        <button
          onClick={handleDownload}
          className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          title="Baixar QR Code"
        >
          <Download className="w-5 h-5" />
        </button>

        {showShareButton && 'share' in navigator && (
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* PIX copia e cola */}
      <div className="mt-4 w-full max-w-md">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          PIX Copia e Cola:
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs font-mono break-all text-gray-600 dark:text-gray-400">
          {payload.length > 100 ? `${payload.substring(0, 100)}...` : payload}
        </div>
      </div>
    </div>
  );
}

// PIX payment form
interface PixPaymentFormProps {
  recipientName: string;
  recipientCity: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  onGenerate?: (payload: string) => void;
  className?: string;
}

export function PixPaymentForm({
  recipientName,
  recipientCity,
  pixKey,
  pixKeyType,
  onGenerate,
  className,
}: PixPaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showQR, setShowQR] = useState(false);

  const pixData: PixData = {
    keyType: pixKeyType,
    key: pixKey,
    name: recipientName,
    city: recipientCity,
    amount: amount ? parseFloat(amount) : undefined,
    description: description || undefined,
  };

  const handleGenerate = () => {
    const payload = generatePixPayload(pixData);
    onGenerate?.(payload);
    setShowQR(true);
  };

  if (showQR) {
    return (
      <div className={className}>
        <PixQRCode pixData={pixData} />
        <button
          onClick={() => setShowQR(false)}
          className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Gerar novo QR Code
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Valor (opcional)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            R$
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            step="0.01"
            min="0"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descrição (opcional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Pagamento do serviço"
          maxLength={25}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
      >
        <QrCode className="w-5 h-5" />
        Gerar QR Code PIX
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Chave PIX: {pixKey}
      </p>
    </div>
  );
}

export type { PixData, PixKeyType };
export { generatePixPayload, calculateCRC16 };
export default PixQRCode;
