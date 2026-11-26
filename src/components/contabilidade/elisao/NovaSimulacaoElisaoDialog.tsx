import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCcw } from 'lucide-react';
import { supabaseDyn as supabase } from '@/lib/supabase-dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { REGIMES_ESPECIAIS, type RegimeEspecial } from '@/types/reforma-tributaria';
import { CRONOGRAMA_OFICIAL } from '@/lib/reforma-tributaria/cronograma-oficial';
import {
  PREMISSAS_PADRAO,
  REGIMES_ATUAIS,
  calcularCenario,
  formatarMoeda,
  podeCalcular,
  type CenarioCbs,
  type FontesContabeis,
  type PremissasCenario,
} from '@/lib/contabilidade/simulacao-regimes';
import { ROTULO_FONTE, buscarFontesContabeis } from '@/lib/contabilidade/fontes-contabeis';
import type { AnexoSimples } from '@/lib/tributario/calculadora/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
}

/** PostgrestError não é `Error`: sem isso a mensagem vira "[object Object]". */
function mensagemErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (erro && typeof erro === 'object' && 'message' in erro) {
    const msg = (erro as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return String(erro);
}

const ANEXOS_SIMPLES: AnexoSimples[] = ['I', 'II', 'III', 'IV', 'V'];

export function NovaSimulacaoElisaoDialog({ open, onOpenChange, empresaId }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [premissas, setPremissas] = useState<PremissasCenario>(PREMISSAS_PADRAO);
  const [ajustes, setAjustes] = useState<{ faturamento?: number; compras?: number }>({});

  const fontesQuery = useQuery({
    queryKey: ['elisao-fontes-contabeis', empresaId],
    queryFn: () => buscarFontesContabeis(empresaId),
    enabled: open && !!empresaId,
    staleTime: 60_000,
  });

  const fontes = useMemo<FontesContabeis | null>(() => {
    if (!fontesQuery.data) return null;
    return {
      ...fontesQuery.data,
      faturamento12m: ajustes.faturamento ?? fontesQuery.data.faturamento12m,
      comprasServicos12m: ajustes.compras ?? fontesQuery.data.comprasServicos12m,
    };
  }, [fontesQuery.data, ajustes]);

  const cenario = useMemo(
    () => (podeCalcular(fontes) && fontes ? calcularCenario(fontes, premissas) : null),
    [fontes, premissas]
  );

  const salvar = useMutation({
    mutationFn: async () => {
      if (!cenario || !fontes) throw new Error('Sem faturamento apurado no período');
      const { error } = await supabase.from('elisao_simulacoes_regime').insert({
        empresa_id: empresaId,
        ano_referencia: premissas.anoReferencia,
        regime_atual: premissas.regimeAtual,
        regime_simulado: `Reforma Tributária (CBS/IBS) — ${premissas.anoReferencia}`,
        carga_atual: cenario.cargaAtual,
        carga_simulada: cenario.cargaSimulada,
        economia_estimada: cenario.economiaEstimada,
        premissas: {
          nome: premissas.nome.trim(),
          ano_referencia: premissas.anoReferencia,
          regime_atual: premissas.regimeAtual,
          anexo_simples: premissas.anexoSimples,
          percentual_vendas: premissas.percentualVendas,
          cenario_cbs: premissas.cenarioCbs,
          aliquota_cbs_override: premissas.aliquotaCbsOverride,
          regime_especial: premissas.regimeEspecial,
          dados_simulacao: cenario.dados,
        },
        detalhes: {
          fontes,
          resultado: cenario.resultado,
          residuais_transicao: cenario.residuais,
          carga_simulada_base: cenario.cargaSimuladaBase,
          ano_teste: cenario.anoTeste,
          avisos: cenario.avisos,
          aliquotas: {
            atual_percentual: cenario.aliquotaAtualPercentual,
            simulada_percentual: cenario.aliquotaSimuladaPercentual,
          },
        },
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elisao_simulacoes', empresaId] });
      toast.success('Cenário criado com os dados reais do período.');
      onOpenChange(false);
    },
    onError: (erro: unknown) =>
      toast.error(`Não foi possível salvar o cenário: ${mensagemErro(erro)}`),
  });

  useEffect(() => {
    if (!open) {
      setPremissas(PREMISSAS_PADRAO);
      setAjustes({});
    }
  }, [open]);

  const sincronizar = async () => {
    setAjustes({});
    const atualizado = await fontesQuery.refetch();
    // `fontesQuery.data` só muda depois do próximo render — o toast tem que usar
    // o retorno do refetch, senão mostra o total antigo.
    const dados = atualizado.data ?? fontesQuery.data;
    if (atualizado.error) {
      toast.error(`Falha ao sincronizar: ${mensagemErro(atualizado.error)}`);
      return;
    }
    if (dados && dados.faturamento12m > 0) {
      toast.success(
        `Sincronizado: ${ROTULO_FONTE[dados.fonteFaturamento]} — ${formatarMoeda(dados.faturamento12m)} de receita e ${formatarMoeda(dados.comprasServicos12m)} de compras/serviços desde ${dados.janelaInicio}.`
      );
    } else {
      toast.warning(
        'Nenhuma receita lançada nos últimos 12 meses. Lance notas fiscais ou títulos a receber para simular.'
      );
    }
  };

  const podeSalvar = !!cenario && premissas.nome.trim().length > 0 && !salvar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Novo Cenário de Elisão Fiscal</DialogTitle>
          <DialogDescription>
            Compara a carga tributária real dos últimos 12 meses com o cenário CBS/IBS do ano
            escolhido (LC 214/2025).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid gap-2">
            <Label htmlFor="cenario-nome">Nome do Cenário</Label>
            <Input
              id="cenario-nome"
              placeholder="Ex: Planejamento 2027 — revisão anual"
              value={premissas.nome}
              onChange={(e) => setPremissas({ ...premissas, nome: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cenario-ano">Ano de referência</Label>
              <Select
                value={String(premissas.anoReferencia)}
                onValueChange={(v) => setPremissas({ ...premissas, anoReferencia: Number(v) })}
              >
                <SelectTrigger id="cenario-ano">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRONOGRAMA_OFICIAL.map((linha) => (
                    <SelectItem key={linha.ano} value={String(linha.ano)}>
                      {linha.ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cenario-regime">Regime atual</Label>
              <Select
                value={premissas.regimeAtual}
                onValueChange={(v) => setPremissas({ ...premissas, regimeAtual: v })}
              >
                <SelectTrigger id="cenario-regime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES_ATUAIS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {premissas.regimeAtual === 'Simples Nacional' && (
            <div className="grid gap-2">
              <Label htmlFor="cenario-anexo">Anexo do Simples Nacional</Label>
              <Select
                value={premissas.anexoSimples}
                onValueChange={(v) =>
                  setPremissas({ ...premissas, anexoSimples: v as AnexoSimples })
                }
              >
                <SelectTrigger id="cenario-anexo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANEXOS_SIMPLES.map((anexo) => (
                    <SelectItem key={anexo} value={anexo}>
                      Anexo {anexo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Comércio usa Anexo I. Serviços usam III (Fator R ≥ 28% sobre a folha apurada) ou V.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cenario-faturamento">Faturamento 12m (R$)</Label>
              <Input
                id="cenario-faturamento"
                type="number"
                value={fontes?.faturamento12m ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({
                    ...a,
                    faturamento: e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cenario-compras">Compras/serviços 12m (R$)</Label>
              <Input
                id="cenario-compras"
                type="number"
                value={fontes?.comprasServicos12m ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({
                    ...a,
                    compras: e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cenario-vendas">% de vendas de mercadorias</Label>
              <Input
                id="cenario-vendas"
                type="number"
                min={0}
                max={100}
                value={premissas.percentualVendas}
                onChange={(e) =>
                  setPremissas({
                    ...premissas,
                    percentualVendas: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cenario-cbs">Cenário de alíquota CBS</Label>
              <Select
                value={premissas.cenarioCbs}
                onValueChange={(v) => setPremissas({ ...premissas, cenarioCbs: v as CenarioCbs })}
              >
                <SelectTrigger id="cenario-cbs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cronograma">Cronograma oficial (LC 214/2025)</SelectItem>
                  <SelectItem value="tcu">Estimativa TCU (11,2%)</SelectItem>
                  <SelectItem value="livre">Alíquota livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {premissas.cenarioCbs === 'livre' && (
            <div className="grid gap-2">
              <Label htmlFor="cenario-cbs-livre">Alíquota CBS livre (%)</Label>
              <Input
                id="cenario-cbs-livre"
                type="number"
                step="0.01"
                value={premissas.aliquotaCbsOverride ?? ''}
                onChange={(e) =>
                  setPremissas({
                    ...premissas,
                    aliquotaCbsOverride: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="cenario-especial">Regime especial</Label>
            <Select
              value={premissas.regimeEspecial}
              onValueChange={(v) =>
                setPremissas({ ...premissas, regimeEspecial: v as RegimeEspecial | 'nenhum' })
              }
            >
              <SelectTrigger id="cenario-especial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum</SelectItem>
                {REGIMES_ESPECIAIS.map((r) => (
                  <SelectItem key={r.regime} value={r.regime}>
                    {r.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 text-xs border-dashed"
            onClick={sincronizar}
            disabled={fontesQuery.isFetching}
          >
            {fontesQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Sincronizar com Contabilidade (Automático)
          </Button>

          {fontesQuery.error && (
            <p className="text-xs text-destructive">
              Falha ao ler os dados contábeis: {mensagemErro(fontesQuery.error)}
            </p>
          )}

          {fontes && (
            <p className="text-[11px] text-muted-foreground">
              Fonte: {ROTULO_FONTE[fontes.fonteFaturamento]} · {fontes.notasConsideradas} nota(s) de
              venda,{' '}
              {fontes.comprasServicos12m > 0
                ? 'compras com fornecedor'
                : 'sem compras com fornecedor'}{' '}
              e {formatarMoeda(fontes.folha12m)} de folha desde {fontes.janelaInicio}
              {fontes.titulosConsiderados > 0 ? ` · ${fontes.titulosConsiderados} título(s)` : ''}
            </p>
          )}

          {cenario ? (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Carga no regime atual ({premissas.regimeAtual})</span>
                <span className="font-mono">{formatarMoeda(cenario.cargaAtual)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Carga simulada (CBS/IBS {premissas.anoReferencia})</span>
                <span className="font-mono">{formatarMoeda(cenario.cargaSimulada)}</span>
              </div>
              {cenario.residuais.total > 0 && (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>dos quais ICMS/ISS/PIS/COFINS residuais</span>
                  <span className="font-mono">{formatarMoeda(cenario.residuais.total)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span>Economia estimada</span>
                <span
                  className={cn(
                    cenario.economiaEstimada > 0 && 'text-emerald-600',
                    cenario.economiaEstimada < 0 && 'text-destructive',
                    cenario.economiaEstimada === 0 && 'text-muted-foreground'
                  )}
                >
                  {formatarMoeda(cenario.economiaEstimada)}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline">
                  {cenario.aliquotaAtualPercentual.toFixed(2)}% →{' '}
                  {cenario.aliquotaSimuladaPercentual.toFixed(2)}%
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {cenario.economiaEstimada > 0
                    ? 'Cenário novo mais barato'
                    : cenario.economiaEstimada < 0
                      ? 'Cenário novo mais caro'
                      : 'Cargas equivalentes'}
                </span>
              </div>
              {[...cenario.avisos, ...cenario.resultado.observacoes].slice(0, 3).map((obs) => (
                <p key={obs} className="text-[11px] text-muted-foreground">
                  {obs}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {fontesQuery.isLoading
                ? 'Lendo os dados contábeis do período...'
                : 'Sem faturamento apurado no período — não é possível calcular o cenário.'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={!podeSalvar}>
            {salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Cenário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
