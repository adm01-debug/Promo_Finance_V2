import { describe, expect, it } from 'vitest';
import { detectarTipo, validarMagicBytes } from '../magic-bytes';

function arquivo(nome: string, bytes: number[]): File {
  return new File([new Uint8Array(bytes)], nome);
}

describe('detectarTipo', () => {
  it('identifica PDF, PNG e ZIP/XLSX pelas assinaturas', () => {
    expect(detectarTipo(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe('pdf');
    expect(detectarTipo(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe('png');
    expect(detectarTipo(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe('zip');
  });

  it('identifica executáveis: PE, ELF e shebang', () => {
    expect(detectarTipo(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBe('exe');
    expect(detectarTipo(new Uint8Array([0x7f, 0x45, 0x4c, 0x46]))).toBe('elf');
    expect(detectarTipo(new Uint8Array([0x23, 0x21, 0x2f, 0x62, 0x69, 0x6e]))).toBe('script');
  });

  it('identifica texto UTF-8 e XML', () => {
    const texto = new TextEncoder().encode('data;valor\n2026-01-01;100,00');
    expect(detectarTipo(texto)).toBe('texto');
    const xml = new TextEncoder().encode('<?xml version="1.0"?><nfe/>');
    expect(detectarTipo(xml)).toBe('xml');
  });

  it('binário sem assinatura conhecida é desconhecido', () => {
    expect(detectarTipo(new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x00]))).toBe('desconhecido');
  });
});

describe('validarMagicBytes', () => {
  it('bloqueia executável mesmo renomeado para .pdf', async () => {
    const f = arquivo('malware.pdf', [0x4d, 0x5a, 0x90, 0x00, 0x03]);
    expect(await validarMagicBytes(f, ['.pdf'])).toMatch(/executável/);
  });

  it('rejeita binário que não bate com a extensão declarada', async () => {
    const f = arquivo('doc.pdf', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]); // PNG disfarçado
    expect(await validarMagicBytes(f, ['.pdf'])).toMatch(/não corresponde/);
  });

  it('aceita PDF legítimo e CSV de texto', async () => {
    const pdf = arquivo('nota.pdf', [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e]);
    expect(await validarMagicBytes(pdf, ['.pdf'])).toBeNull();
    const csv = arquivo('extrato.csv', Array.from(new TextEncoder().encode('a;b\n1;2')));
    expect(await validarMagicBytes(csv, ['.csv'])).toBeNull();
  });

  it('bloqueia .jar mesmo com assinatura zip válida', async () => {
    const jar = arquivo('payload.jar', [0x50, 0x4b, 0x03, 0x04]);
    expect(await validarMagicBytes(jar)).toMatch(/não é permitida/);
    const sh = arquivo('notas.sh', Array.from(new TextEncoder().encode('texto qualquer')));
    expect(await validarMagicBytes(sh)).toMatch(/não é permitida/);
  });

  it('aceita xlsx (zip) e rejeita extensão fora da lista aceita', async () => {
    const xlsx = arquivo('plan.xlsx', [0x50, 0x4b, 0x03, 0x04, 0x14]);
    expect(await validarMagicBytes(xlsx, ['.ofx', '.xlsx'])).toBeNull();
    const exe = arquivo('plan.zip', [0x50, 0x4b, 0x03, 0x04]);
    expect(await validarMagicBytes(exe, ['.ofx', '.csv'])).toMatch(/extensão .zip fora/);
  });
});
