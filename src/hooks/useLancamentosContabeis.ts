import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ParsedLancamento } from '@/lib/lancamentos-csv-importer';
import { createAdaptiveChunkController } from '@/lib/adaptive-chunk';
import { createConcurrencyLimiter } from '@/lib/concurrency-limiter';

export interface LancamentoContabilInput {
  empresa_id: string;
  data_lancamento: string;
  historico: string;
  origem?: string;
  partidas: Array<{ conta_id: string; tipo: 'D' | 'C'; valor: number; historico_complementar?: string }>;
}

export function useLancamentosContabeis(empresaId?: string, ano?: number) {
  return useQuery({
    queryKey: ['lancamentos-contabeis', empresaId, ano],
    queryFn: async () => {
      if (!empresaId) return [];
      const inicio = `${ano || new Date().getFullYear()}-01-01`;
      const fim = `${ano || new Date().getFullYear()}-12-31`;
      const { data, error } = await supabase
        .from('lancamentos_contabeis')
        .select('*, partidas:partidas_contabeis(*, conta:plano_contas(codigo, descricao, nome))')
        .eq('empresa_id', empresaId)
        .gte('data_lancamento', inicio)
        .lte('data_lancamento', fim)
        .order('data_lancamento', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

export function useCriarLancamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LancamentoContabilInput) => {
      const totalD = input.partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
      const totalC = input.partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
      if (Math.abs(totalD - totalC) > 0.01) {
        throw new Error(`Débitos (${totalD.toFixed(2)}) ≠ Créditos (${totalC.toFixed(2)})`);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: lanc, error } = await supabase
        .from('lancamentos_contabeis')
        .insert({
          empresa_id: input.empresa_id,
          data_lancamento: input.data_lancamento,
          historico: input.historico,
          origem: input.origem || 'manual',
          valor_total: totalD,
          created_by: user?.id,
        })
        .select()
        .maybeSingle();
      if (error || !lanc) throw error || new Error('Falha ao criar lançamento');

      const { error: errPart } = await supabase.from('partidas_contabeis').insert(
        input.partidas.map(p => ({ ...p, lancamento_id: lanc.id })),
      );
      if (errPart) throw errPart;
      return lanc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lancamentos-contabeis'] });
      toast.success('Lançamento contábil registrado');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export interface ImportLoteFalha {
  /** Referência (lancamento_ref) original do CSV. */
  ref: string;
  /** Mensagem de erro. */
  error: string;
  /** Índice global (1-based) do lançamento na lista importada. */
  indiceGlobal: number;
  /** Índice (0-based) do chunk onde a falha ocorreu. */
  chunkIndex: number;
  /** Tamanho do chunk no momento da falha (definido pelo controlador adaptativo). */
  chunkSize: number;
  /** Posição (1-based) do lançamento dentro do chunk. */
  posicaoNoChunk: number;
}

export interface ImportLoteResult {
  sucesso: number;
  falhas: ImportLoteFalha[];
}

export interface ImportLoteInput {
  empresa_id: string;
  lancamentos: ParsedLancamento[];
  origem?: string;
  /**
   * Limite máximo de requests realmente executando em paralelo.
   * O `chunkSize` adaptativo pode crescer livremente, mas o número de
   * conexões simultâneas contra o backend nunca ultrapassa este valor —
   * evitando saturar o connection pool / rate-limit do PostgREST.
   * Default: 6 (alinhado ao limite típico de conexões HTTP/1.1 por origem).
   */
  concurrency?: number;
  /** done = quantos itens já processados; total = total de itens; chunkSize = lote atual sugerido pelo controlador adaptativo. */
  onProgress?: (done: number, total: number, chunkSize?: number) => void;
}

// Configuração inicial do chunk adaptativo. Os limites foram calibrados para
// inserts no Supabase (lançamento + partidas em ~2 round-trips por item).
// O controlador AIMD reage a latência por item e taxa de falhas em tempo real.
const ADAPTIVE_CHUNK = {
  initial: 10,
  min: 2,
  max: 50,
  targetLatencyPerItemMs: 250,
  failureThreshold: 0.1,
} as const;

/** Limite padrão de conexões simultâneas contra o backend. */
const DEFAULT_CONCURRENCY = 6;
/** Faixa segura aceita para `concurrency` (clamp aplicado em runtime). */
const CONCURRENCY_MIN = 1;
const CONCURRENCY_MAX = 16;

export function useImportLancamentosLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ImportLoteInput): Promise<ImportLoteResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      const result: ImportLoteResult = { sucesso: 0, falhas: [] };
      const total = input.lancamentos.length;
      let processados = 0;

      const processarLancamento = async (
        l: ParsedLancamento,
        ctx: { indiceGlobal: number; chunkIndex: number; chunkSize: number; posicaoNoChunk: number },
      ) => {
        let lancId: string | null = null;
        try {
          if (!l.balanceado || l.partidas.length < 2) {
            throw new Error('Lançamento não balanceado ou com menos de 2 partidas');
          }
          const { data: lanc, error } = await supabase
            .from('lancamentos_contabeis')
            .insert({
              empresa_id: input.empresa_id,
              data_lancamento: l.data,
              historico: l.historico,
              origem: input.origem || 'importacao_csv',
              valor_total: l.total_debito,
              created_by: user?.id,
            })
            .select('id')
            .maybeSingle();
          if (error || !lanc) throw error || new Error('Falha ao criar cabeçalho');
          lancId = lanc.id;

          const { error: errPart } = await supabase.from('partidas_contabeis').insert(
            l.partidas.map((p) => ({
              lancamento_id: lanc.id,
              conta_id: p.conta_id,
              tipo: p.tipo,
              valor: p.valor,
              historico_complementar: p.historico_complementar,
            })),
          );
          if (errPart) throw errPart;
          result.sucesso++;
        } catch (e) {
          // Compensação: remove cabeçalho órfão
          if (lancId) {
            await supabase.from('lancamentos_contabeis').delete().eq('id', lancId);
          }
          result.falhas.push({
            ref: l.ref,
            error: e instanceof Error ? e.message : 'Erro desconhecido',
            ...ctx,
          });
        } finally {
          processados++;
          input.onProgress?.(processados, total, controller.size());
        }
      };

      // Concorrência configurável (clamp em faixa segura) — limita o número
      // real de requests simultâneos contra o backend. O `chunkSize`
      // adaptativo continua livre para crescer (amortizando overhead do
      // loop), mas o paralelismo efetivo é controlado pelo semáforo.
      const concurrencyCeil = Math.min(
        CONCURRENCY_MAX,
        Math.max(CONCURRENCY_MIN, input.concurrency ?? DEFAULT_CONCURRENCY),
      );
      const limiter = createConcurrencyLimiter(concurrencyCeil);

      // Processa em chunks paralelos com tamanho adaptativo (AIMD).
      // O controlador cresce o lote quando o backend responde rápido e sem
      // falhas, e recua quando observa latência alta ou erros — ideal para
      // arquivos grandes onde o regime ótimo varia ao longo da execução.
      const controller = createAdaptiveChunkController({
        ...ADAPTIVE_CHUNK,
        onAdjust: (info) => {
          // Quando o controlador recua por latência/falhas, reduz também
          // a concorrência efetiva pela metade (mantendo CONCURRENCY_MIN).
          // Quando volta a crescer, restaura o teto configurado.
          if (info.reason === 'decrease-failures' || info.reason === 'decrease-latency') {
            const reduced = Math.max(CONCURRENCY_MIN, Math.floor(limiter.limit() / 2));
            if (reduced !== limiter.limit()) limiter.setLimit(reduced);
          } else if (info.reason === 'increase' && limiter.limit() < concurrencyCeil) {
            limiter.setLimit(Math.min(concurrencyCeil, limiter.limit() + 1));
          }
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug('[adaptive-chunk]', { ...info, concurrency: limiter.limit() });
          }
        },
      });

      let i = 0;
      while (i < total) {
        const size = controller.size();
        const chunk = input.lancamentos.slice(i, i + size);
        const falhasAntes = result.falhas.length;
        const t0 = performance.now();
        // Cada item passa pelo semáforo — o lote pode ter N itens, mas só
        // `limiter.limit()` deles executam simultaneamente.
        await Promise.all(chunk.map((l) => limiter.run(() => processarLancamento(l))));
        const durationMs = performance.now() - t0;
        const failed = result.falhas.length - falhasAntes;
        controller.report({ batchSize: chunk.length, durationMs, failed });
        i += chunk.length;
      }

      return result;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lancamentos-contabeis'] });
      if (res.falhas.length === 0) {
        toast.success(`${res.sucesso} lançamento(s) importado(s) com sucesso`);
      } else {
        toast.warning(`Importação concluída: ${res.sucesso} sucesso(s), ${res.falhas.length} falha(s)`);
      }
    },
    onError: (e: Error) => toast.error(`Erro na importação: ${e.message}`),
  });
}
