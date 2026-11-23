import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockRpc, mockRegistrarEvento } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockRegistrarEvento: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mockRpc } }));
vi.mock('@/lib/sefaz-event-logger', () => ({ registrarEvento: mockRegistrarEvento }));

import { useCancelamentoNFe } from './useCancelamentoNFe';
import { beforeEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCancelamentoNFe -- estorno xml_destacado (etapa 58)', () => {
  it('sefazConfirmado=false -> retorna early, nao chama rpc nem registra evento', async () => {
    const { result } = renderHook(() => useCancelamentoNFe());
    const res = await result.current.cancelarNFe({
      notaId: 'nota-1',
      chaveAcesso: '35260101000000000000550010000000011000000011',
      protocolo: '',
      sefazConfirmado: false,
    });
    expect(res).toEqual({ ok: false, reason: 'sefaz_nao_integrada' });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRegistrarEvento).not.toHaveBeenCalled();
  });

  it('sefazConfirmado=true + rpc ok -> ok=true, creditosEstornados=2, evento gravado com chaveAcesso', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { nota_id: 'nota-1', protocolo: 'PROT123', creditos_estornados: 2 },
      error: null,
    });
    const { result } = renderHook(() => useCancelamentoNFe());
    const chave = '35260101000000000000550010000000011000000011';
    const res = await result.current.cancelarNFe({
      notaId: 'nota-1',
      chaveAcesso: chave,
      protocolo: 'PROT123',
      sefazConfirmado: true,
    });
    expect(res).toEqual({ ok: true, creditosEstornados: 2 });
    expect(mockRpc).toHaveBeenCalledWith('cancelar_nfe_estornar_xml_destacado', {
      p_nota_id: 'nota-1',
      p_protocolo: 'PROT123',
      p_chave_acesso: chave,
    });
    expect(mockRegistrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'CANCELAMENTO', chaveAcesso: chave, protocolo: 'PROT123' })
    );
  });

  it('sefazConfirmado=true + rpc erro -> ok=false com reason', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'nota_ja_cancelada' } });
    const { result } = renderHook(() => useCancelamentoNFe());
    const res = await result.current.cancelarNFe({
      notaId: 'nota-1',
      chaveAcesso: 'chave',
      protocolo: 'PROT99',
      sefazConfirmado: true,
    });
    expect(res).toEqual({ ok: false, reason: 'nota_ja_cancelada' });
  });

  it('evento de cancelamento sempre inclui chaveAcesso quando sefazConfirmado=true', async () => {
    mockRpc.mockResolvedValueOnce({ data: { creditos_estornados: 0 }, error: null });
    const { result } = renderHook(() => useCancelamentoNFe());
    const chave = '99991234000195550010000000020000000021';
    await result.current.cancelarNFe({
      notaId: 'nota-2',
      chaveAcesso: chave,
      protocolo: 'PROT456',
      sefazConfirmado: true,
    });
    const chamada = mockRegistrarEvento.mock.calls[0][0];
    expect(chamada.chaveAcesso).toBe(chave);
    expect(chamada.tipo).toBe('CANCELAMENTO');
  });
});
