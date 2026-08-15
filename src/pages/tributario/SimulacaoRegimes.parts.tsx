// Sub-componentes da página SimulacaoRegimes — extraídos para zerar max-lines.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, AlertTriangle, TrendingDown, Sparkles, History as HistoryIcon, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CenarioDetalhes } from '@/components/tributario/simulacao/CenarioDetalhes';
import { ORDENACOES_HISTORICO, type PaginaHistorico } from '@/lib/tributario/historico-simulacao';
import type { OrdenacaoHistorico } from '@/lib/tributario/historico-simulacao';
import type { useSimulacaoRegimes, SimulacaoHistoricoAuditada } from '@/hooks/useSimulacaoRegimes';
import { corPorRegime } from './SimulacaoRegimes.helpers';

type ResultadoSimulacao = ReturnType<typeof useSimulacaoRegimes>['resultado'];
type ResumoAuditoria = ReturnType<typeof useSimulacaoRegimes>['resumoAuditoria'];
type Pagina = PaginaHistorico<SimulacaoHistoricoAuditada>;

export function RegimeRecomendadoCard({
  resultado,
  isRecomendacaoIA,
}: {
  resultado: ResultadoSimulacao;
  isRecomendacaoIA: boolean;
}) {
  return (
    <Card className="border-success/30 bg-gradient-to-br from-success/5 to-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-success/10">
            <Award className="h-8 w-8 text-success" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Regime Recomendado</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold text-success">{resultado.recomendado.nome}</h2>
              {isRecomendacaoIA && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse">
                  <Sparkles className="h-3 w-3 mr-1" /> IA
                </Badge>
              )}
              {resultado.fromCache && (
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20">
                  Cached
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{resultado.justificativaIA || resultado.justificativa}</p>
            {resultado.economiaAnualVsAtual !== undefined && resultado.economiaAnualVsAtual > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success">
                <TrendingDown className="h-4 w-4" aria-hidden="true" />
                <span className="font-semibold">
                  Economia: {formatCurrency(resultado.economiaAnualVsAtual)}/ano
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertasSimulacaoCard({ alertas }: { alertas: string[] }) {
  return (
    <Alert variant="default">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 space-y-1 mt-2">
          {alertas.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export function ComparativoCargaCard({ dadosGrafico }: { dadosGrafico: { name: string; valor: number; regime: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparativo de Carga Tributária</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-[220px]"
          role="img"
          aria-label="Gráfico de barras comparando carga tributária dos regimes elegíveis"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={130} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {dadosGrafico.map((d, i) => (
                  <Cell key={i} fill={corPorRegime(d.regime as Parameters<typeof corPorRegime>[0])} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CenariosTabs({ resultado }: { resultado: ResultadoSimulacao }) {
  return (
    <Tabs defaultValue={resultado.recomendado.regime}>
      <TabsList className="grid w-full grid-cols-3">
        {resultado.cenarios.map((c) => (
          <TabsTrigger key={c.regime} value={c.regime} disabled={!c.elegivel}>
            {c.nome}
            {c.regime === resultado.recomendado.regime && (
              <Sparkles className="h-3 w-3 ml-1 text-success" aria-hidden="true" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {resultado.cenarios.map((c) => (
        <TabsContent key={c.regime} value={c.regime}>
          <CenarioDetalhes cenario={c} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function HistoricoSimulacoesCard({
  historicoVisivel,
  pagina,
  resumoAuditoria,
  versaoMotor,
  somentePendencias,
  onSomentePendenciasChange,
  ordenacao,
  onOrdenacaoChange,
  onExportarAuditoria,
  onRestaurar,
  onPaginaChange,
}: {
  historicoVisivel: SimulacaoHistoricoAuditada[];
  pagina: Pagina;
  resumoAuditoria: ResumoAuditoria;
  versaoMotor: string;
  somentePendencias: boolean;
  onSomentePendenciasChange: (v: boolean) => void;
  ordenacao: OrdenacaoHistorico;
  onOrdenacaoChange: (v: OrdenacaoHistorico) => void;
  onExportarAuditoria: () => void;
  onRestaurar: (h: SimulacaoHistoricoAuditada) => void;
  onPaginaChange: (p: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Simulações Anteriores</CardTitle>
        <p className="text-xs text-muted-foreground">Motor tributário v{versaoMotor}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {resumoAuditoria.saudavel ? (
            <Badge variant="outline" className="text-success border-success/40">
              {resumoAuditoria.total} snapshot{resumoAuditoria.total > 1 ? 's' : ''} sem pendências
            </Badge>
          ) : (
            <>
              {resumoAuditoria.divergentes > 0 && (
                <Badge variant="outline" className="text-warning border-warning/40">
                  {resumoAuditoria.divergentes} divergente{resumoAuditoria.divergentes > 1 ? 's' : ''}
                </Badge>
              )}
              {resumoAuditoria.motorDesatualizado > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {resumoAuditoria.motorDesatualizado} com motor antigo
                </Badge>
              )}
              {resumoAuditoria.comAjustes > 0 && (
                <Badge
                  variant="outline"
                  className={
                    resumoAuditoria.comAjustesCriticos > 0
                      ? 'text-destructive border-destructive/40'
                      : 'text-warning border-warning/40'
                  }
                >
                  {resumoAuditoria.comAjustes} com ajustes
                  {resumoAuditoria.comAjustesCriticos > 0
                    ? ` (${resumoAuditoria.comAjustesCriticos} crítico${resumoAuditoria.comAjustesCriticos > 1 ? 's' : ''})`
                    : ''}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Switch
              id="filtro-pendencias-historico"
              checked={somentePendencias}
              onCheckedChange={onSomentePendenciasChange}
            />
            <Label htmlFor="filtro-pendencias-historico" className="text-xs font-normal">
              Somente snapshots com pendências
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ordenacao-historico" className="text-xs font-normal">
              Ordenar por
            </Label>
            <Select
              value={ordenacao}
              onValueChange={(v) => onOrdenacaoChange(v as OrdenacaoHistorico)}
            >
              <SelectTrigger id="ordenacao-historico" className="h-8 w-[190px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDENACOES_HISTORICO.map((o) => (
                  <SelectItem key={o.valor} value={o.valor} className="text-xs">
                    {o.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={historicoVisivel.length === 0}
            onClick={onExportarAuditoria}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar trilha de auditoria (CSV)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {historicoVisivel.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum snapshot com pendências — histórico íntegro.
          </p>
        )}
        {pagina.itens.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-2 p-2 rounded border text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">{h.regime_recomendado}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(h.data_simulacao).toLocaleString('pt-BR')}
                {h.versao_motor ? ` · v${h.versao_motor}` : ' · versão não registrada'}
              </p>
              {h.divergente && h.regimeRecalculado && (
                <p className="text-xs text-warning">
                  Recálculo atual indica {h.regimeRecalculado}
                </p>
              )}
              {h.ajustesAplicados.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  Ajustes: {h.ajustesAplicados.map((a) => `${a.rotulo} ${a.informado}→${a.aplicado}`).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {h.ajustesAplicados.length > 0 && (
                <Badge
                  variant="outline"
                  className={
                    h.ajustesAplicados.some((a) => a.severidade === 'critico')
                      ? 'text-destructive border-destructive/40'
                      : 'text-warning border-warning/40'
                  }
                  title={h.ajustesAplicados.map((a) => `${a.rotulo}: ${a.motivo}`).join('\n')}
                >
                  {h.ajustesAplicados.length} ajuste{h.ajustesAplicados.length > 1 ? 's' : ''}
                </Badge>
              )}
              {h.divergente && (
                <Badge variant="outline" className="text-warning border-warning/40">
                  Divergente
                </Badge>
              )}
              {!h.divergente && h.motorDesatualizado && (
                <Badge variant="outline" className="text-muted-foreground">
                  Motor antigo
                </Badge>
              )}

              {h.economia_anual_estimada !== null && h.economia_anual_estimada !== undefined && (
                <Badge variant="outline" className="text-success">
                  {formatCurrency(Number(h.economia_anual_estimada))}/ano
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestaurar(h)}
                aria-label={`Restaurar simulação de ${new Date(h.data_simulacao).toLocaleString('pt-BR')}`}
              >
                <HistoryIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Restaurar
              </Button>
            </div>
          </div>
        ))}

        {pagina.total > 0 && (
          <nav
            className="flex items-center justify-between pt-2"
            aria-label="Paginação do histórico de simulações"
          >
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Exibindo {pagina.inicio}–{pagina.fim} de {pagina.total} snapshot
              {pagina.total > 1 ? 's' : ''} · página {pagina.pagina}/{pagina.totalPaginas}
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina.pagina <= 1}
                onClick={() => onPaginaChange(pagina.pagina - 1)}
                aria-label="Página anterior do histórico"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina.pagina >= pagina.totalPaginas}
                onClick={() => onPaginaChange(pagina.pagina + 1)}
                aria-label="Próxima página do histórico"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        )}
      </CardContent>

    </Card>
  );
}
