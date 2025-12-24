import { useState, useEffect, useMemo } from 'react';

export interface PixPayload {
  chave: string;
  valor: number;
  txid?: string;
  descricao?: string;
  nomeBeneficiario?: string;
  cidadeBeneficiario?: string;
}

export interface QRCodePixData {
  payload: string;
  qrCodeUrl: string;
  copiaCola: string;
}

// Funções para calcular CRC16 CCITT-FALSE
function crc16ccitt(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEMVField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function generatePixPayload(params: PixPayload): string {
  const { chave, valor, txid, descricao, nomeBeneficiario, cidadeBeneficiario } = params;

  // Payload Format Indicator
  let payload = formatEMVField('00', '01');

  // Merchant Account Information
  let merchantInfo = formatEMVField('00', 'BR.GOV.BCB.PIX');
  merchantInfo += formatEMVField('01', chave);
  
  if (descricao) {
    merchantInfo += formatEMVField('02', descricao.substring(0, 72));
  }

  payload += formatEMVField('26', merchantInfo);

  // Merchant Category Code
  payload += formatEMVField('52', '0000');

  // Transaction Currency (986 = BRL)
  payload += formatEMVField('53', '986');

  // Transaction Amount
  if (valor > 0) {
    payload += formatEMVField('54', valor.toFixed(2));
  }

  // Country Code
  payload += formatEMVField('58', 'BR');

  // Merchant Name
  const nome = (nomeBeneficiario || 'EMPRESA').substring(0, 25).toUpperCase();
  payload += formatEMVField('59', nome);

  // Merchant City
  const cidade = (cidadeBeneficiario || 'CIDADE').substring(0, 15).toUpperCase();
  payload += formatEMVField('60', cidade);

  // Additional Data Field Template
  if (txid) {
    const additionalData = formatEMVField('05', txid.substring(0, 25));
    payload += formatEMVField('62', additionalData);
  }

  // CRC16 placeholder
  payload += '6304';

  // Calculate and append CRC16
  const crc = crc16ccitt(payload);
  payload = payload.slice(0, -4) + crc;

  return payload;
}

export function usePixQRCode(params: PixPayload) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (!params.chave) return '';
    return generatePixPayload(params);
  }, [params.chave, params.valor, params.txid, params.descricao, params.nomeBeneficiario, params.cidadeBeneficiario]);

  useEffect(() => {
    if (!payload) {
      setQrCodeUrl('');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Gerar QR Code usando API pública
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
    
    // Verificar se a imagem carrega
    const img = new Image();
    img.onload = () => {
      setQrCodeUrl(qrApiUrl);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Erro ao gerar QR Code');
      setIsLoading(false);
    };
    img.src = qrApiUrl;
  }, [payload]);

  const copiarCodigoCompleto = async () => {
    if (!payload) return false;
    
    try {
      await navigator.clipboard.writeText(payload);
      return true;
    } catch {
      return false;
    }
  };

  return {
    payload,
    qrCodeUrl,
    isLoading,
    error,
    copiarCodigoCompleto,
  };
}

// Hook para gerar PIX a partir de uma conta a receber
export function usePixCobranca(contaReceber?: {
  id: string;
  valor: number;
  cliente_nome: string;
  descricao: string;
  chave_pix?: string;
}) {
  const [chavePix, setChavePix] = useState(contaReceber?.chave_pix || '');

  const pixParams: PixPayload = useMemo(() => ({
    chave: chavePix,
    valor: contaReceber?.valor || 0,
    txid: contaReceber?.id?.substring(0, 25).replace(/-/g, ''),
    descricao: contaReceber?.descricao?.substring(0, 72),
    nomeBeneficiario: 'EMPRESA',
    cidadeBeneficiario: 'CIDADE',
  }), [chavePix, contaReceber?.valor, contaReceber?.id, contaReceber?.descricao]);

  const qrCode = usePixQRCode(pixParams);

  return {
    ...qrCode,
    chavePix,
    setChavePix,
  };
}
