/**
 * Testes — caminhoNoStorage (Etapa 20)
 *
 * O delete de anexos lia `anexo.storage_path`, coluna que não existe em
 * `anexos_financeiros`, e chamava `remove([''])`: todo arquivo apagado pela
 * tela ficava no bucket. A URL é o único ponteiro persistido.
 */
import { describe, it, expect } from 'vitest';
import { caminhoNoStorage } from '@/lib/storage-path';

const BASE = 'https://bwwbeyolnnzppeuhgkcd.supabase.co/storage/v1/object';

describe('caminhoNoStorage', () => {
  it('extrai o caminho de uma URL pública', () => {
    expect(caminhoNoStorage(`${BASE}/public/financeiro/contas_pagar/abc/0.123.pdf`)).toBe(
      'contas_pagar/abc/0.123.pdf'
    );
  });

  it('extrai o caminho de uma URL assinada, descartando o token', () => {
    expect(caminhoNoStorage(`${BASE}/sign/financeiro/contas_receber/x/1.pdf?token=eyJhbGci`)).toBe(
      'contas_receber/x/1.pdf'
    );
  });

  it('decodifica nomes com espaço e acento', () => {
    expect(
      caminhoNoStorage(`${BASE}/public/financeiro/movimentacoes/1/nota%20fiscal%20b%C3%A1sica.pdf`)
    ).toBe('movimentacoes/1/nota fiscal básica.pdf');
  });

  it('devolve null quando não há URL — o caso que produzia remove([])', () => {
    expect(caminhoNoStorage(null)).toBeNull();
    expect(caminhoNoStorage(undefined)).toBeNull();
    expect(caminhoNoStorage('')).toBeNull();
  });

  it('devolve null quando o bucket não aparece na URL', () => {
    expect(caminhoNoStorage('https://exemplo.com/qualquer/coisa.pdf')).toBeNull();
  });

  it('devolve null quando o caminho depois do bucket está vazio', () => {
    expect(caminhoNoStorage(`${BASE}/public/financeiro/`)).toBeNull();
  });

  it('aceita outro bucket', () => {
    expect(caminhoNoStorage(`${BASE}/public/comprovantes/a/b.png`, 'comprovantes')).toBe('a/b.png');
  });

  it('não quebra com percent-encoding malformado', () => {
    expect(caminhoNoStorage(`${BASE}/public/financeiro/a/100%.pdf`)).toBe('a/100%.pdf');
  });
});
