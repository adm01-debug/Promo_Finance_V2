/**
 * Hook de cancelamento de NF-e — etapa 58.
 *
 * Responsabilidade: quando a SEFAZ confirmar um cancelamento (protocolo real),
 * este hook:
 *   1. Chama RPC `cancelar_nfe_estornar_xml_destacado` para zerar campos
 *      IBS/CBS e marcar creditos de origem=xml_destacado como estornados.
 *   2. Registra o evento no sefaz-event-logger com chaveAcesso.
 *
 * Enquanto a integracao SEFAZ nao esta homologada, `cancelarNFe` retorna
 * early com `{ ok: false, reason: 'sefaz_nao_integrada' }` sem chamar a RPC.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { registrarEvento } from '@/lib/sefaz-event-logger';

export interface CancelamentoParams {
  notaId: string;
  chaveAcesso: string;
  protocolo: string;
  /** @default false — deve ser true apenas com resposta SEFAZ homologada real */
  sefazConfirmado?: boolean;
}

export interface CancelamentoResult {
  ok: boolean;
  reason?: string;
  creditosEstornados?: number;
}

export function useCancelamentoNFe() {
  const cancelarNFe = useCallback(
    async (params: CancelamentoParams): Promise<CancelamentoResult> => {
      const { notaId, chaveAcesso, protocolo, sefazConfirmado = false } = params;

      if (!sefazConfirmado) {
        return { ok: false, reason: 'sefaz_nao_integrada' };
      }

      // Registra evento ANTES de gravar no banco (nao bloqueia se falhar)
      registrarEvento({
        tipo: 'CANCELAMENTO',
        chaveAcesso,
        protocolo,
        cStat: '135',
        xMotivo: 'Cancelamento de NF-e homologado',
        ambiente: 'producao',
      });

      const { data, error } = await supabase.rpc('cancelar_nfe_estornar_xml_destacado', {
        p_nota_id: notaId,
        p_protocolo: protocolo,
        p_chave_acesso: chaveAcesso,
      });

      if (error) {
        return { ok: false, reason: error.message };
      }

      return {
        ok: true,
        creditosEstornados: (data as { creditos_estornados?: number })?.creditos_estornados ?? 0,
      };
    },
    []
  );

  return { cancelarNFe };
}
