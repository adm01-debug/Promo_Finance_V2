import DOMPurify from 'dompurify';
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
  // O HTML dos PDFs embute dados do banco (nomes, descrições) — sanitiza antes
  // do document.write para que markup malicioso não execute na origem do app.
  // Fragmento (WHOLE_DOCUMENT implícito=false): <html>/<head>/<body> saem, o
  // conteúdo (incl. <style>) fica; o doctype é reescrito para não cair em
  // quirks mode na impressão.
  w.document.write(`<!DOCTYPE html>${DOMPurify.sanitize(html)}`);
  w.document.close();
  // O auto-print vinha de um <script> inline que o sanitizador remove —
  // dispara daqui, com o documento já fechado e os estilos aplicados.
  w.print();
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
