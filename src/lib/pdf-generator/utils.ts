import { toast } from 'sonner';

export function openPrintWindow(): Window | null {
  const w = window.open('', '_blank');
  if (!w) {
    toast.error('Permita pop-ups para gerar o PDF');
    return null;
  }
  return w;
}

export function writeAndPrint(w: Window, html: string): void {
  w.document.write(html);
  w.document.close();
}

export function generateBarcodeHTML(code: string): string {
  return code
    .split('')
    .map((char, i) => {
      const width = parseInt(char) % 2 === 0 ? 2 : 1;
      const isBlack = i % 2 === 0;
      return `<div style="width: ${width}px; height: 100%; background: ${isBlack ? '#000' : '#fff'};"></div>`;
    })
    .join('');
}

export function getBancoCode(banco: string): string {
  const codes: Record<string, string> = {
    Itaú: '341-7',
    Bradesco: '237-2',
    'Banco do Brasil': '001-9',
    Caixa: '104-0',
    Santander: '033-7',
  };
  return codes[banco] || '000-0';
}
