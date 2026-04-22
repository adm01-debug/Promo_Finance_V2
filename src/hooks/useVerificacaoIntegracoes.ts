import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StatusConsistencia = 'ok' | 'desbalanceado' | 'sem_partidas' | 'orfao';

export interface LancamentoIntegracaoRow {
  id: string;
  numero_lancamento: number;
  data_lancamento: string;
  historico: string;
  origem: string;
  valor_total: number;
  status: string;
  total_debito: number;
  total_credito: number;
  diferenca: number;
  qtd_partidas: number;
  status_consistencia: StatusConsistencia;
  external_ref?: string | null;
}

export interface ResumoIntegracao {
  origem: string;
  total: number;
  ok: number;
  desbalanceados: number;
  sem_partidas: number;
  ultima_importacao: string | null;
  valor_total: number;
  divergencia_total: number;
}

export interface VerificacaoIntegracoesData {
  lancamentos: LancamentoIntegracaoRow[];
  resumos: ResumoIntegracao[];
  total: number;
  totalOk: number;
  totalDivergentes: number;
}

interface PartidaRow {
  tipo: 'D' | 'C';
  valor: number;
}

interface RawLancamento {
  id: string;
  numero_lancamento: number;
  data_lancamento: string;
  historico: string;
  origem: string;
  valor_total: number;
  status: string;
  external_ref?: string | null;
  partidas: PartidaRow[] | null;
}

const ORIGENS_INTEGRACAO = ['bitrix24', 'bling', 'asaas', 'importacao_csv', 'webhook', 'api'];

export function useVerificacaoIntegracoes(empresaId?: string, ano?: number) {
  return useQuery<VerificacaoIntegracoesData>({
    queryKey: ['verificacao-integracoes', empresaId, ano],
    queryFn: async () => {
      if (!empresaId) {
        return { lancamentos: [], resumos: [], total: 0, totalOk: 0, totalDivergentes: 0 };
      }
      const inicio = `${ano || new Date().getFullYear()}-01-01`;
      const fim = `${ano || new Date().getFullYear()}-12-31`;

      const { data, error } = await supabase
        .from('lancamentos_contabeis')
        .select('id, numero_lancamento, data_lancamento, historico, origem, valor_total, status, external_ref, partidas:partidas_contabeis(tipo, valor)')
        .eq('empresa_id', empresaId)
        .neq('origem', 'manual')
        .gte('data_lancamento', inicio)
        .lte('data_lancamento', fim)
        .order('data_lancamento', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const rows: LancamentoIntegracaoRow[] = ((data || []) as unknown as RawLancamento[]).map(l => {
        const partidas = l.partidas || [];
        const totalD = partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + Number(p.valor || 0), 0);
        const totalC = partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + Number(p.valor || 0), 0);
        const diff = Math.abs(totalD - totalC);
        let status_consistencia: StatusConsistencia = 'ok';
        if (partidas.length === 0) status_consistencia = 'sem_partidas';
        else if (partidas.length < 2) status_consistencia = 'orfao';
        else if (diff > 0.01) status_consistencia = 'desbalanceado';

        return {
          id: l.id,
          numero_lancamento: l.numero_lancamento,
          data_lancamento: l.data_lancamento,
          historico: l.historico,
          origem: l.origem || 'desconhecida',
          valor_total: Number(l.valor_total || 0),
          status: l.status,
          external_ref: l.external_ref ?? null,
          total_debito: totalD,
          total_credito: totalC,
          diferenca: diff,
          qtd_partidas: partidas.length,
          status_consistencia,
        };
      });

      // Agregar por origem
      const mapa = new Map<string, ResumoIntegracao>();
      for (const r of rows) {
        const cur = mapa.get(r.origem) ?? {
          origem: r.origem,
          total: 0,
          ok: 0,
          desbalanceados: 0,
          sem_partidas: 0,
          ultima_importacao: null,
          valor_total: 0,
          divergencia_total: 0,
        };
        cur.total += 1;
        cur.valor_total += r.valor_total;
        cur.divergencia_total += r.diferenca;
        if (r.status_consistencia === 'ok') cur.ok += 1;
        else if (r.status_consistencia === 'desbalanceado') cur.desbalanceados += 1;
        else cur.sem_partidas += 1;
        if (!cur.ultima_importacao || r.data_lancamento > cur.ultima_importacao) {
          cur.ultima_importacao = r.data_lancamento;
        }
        mapa.set(r.origem, cur);
      }

      const resumos = Array.from(mapa.values()).sort((a, b) => b.total - a.total);
      const totalOk = rows.filter(r => r.status_consistencia === 'ok').length;
      const totalDivergentes = rows.length - totalOk;

      return {
        lancamentos: rows,
        resumos,
        total: rows.length,
        totalOk,
        totalDivergentes,
      };
    },
    enabled: !!empresaId,
    staleTime: 60_000,
  });
}

export const ORIGENS_KNOWN = ORIGENS_INTEGRACAO;
