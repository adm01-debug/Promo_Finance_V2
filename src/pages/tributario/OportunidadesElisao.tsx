// ============================================
// PÁGINA: Oportunidades de Elisão Fiscal
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  TrendingUp,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  Banknote,
  SearchX,
  Upload,
  ShieldCheck,
  FileText,
  ExternalLink,
  History,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Download,
  FileSearch,
  CheckDouble,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOportunidadesElisao } from '@/hooks/useOportunidadesElisao';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import type { RegimeAplicavel, RiscoElisao } from '@/lib/tributario/elisao';
import { Progress } from '@/components/ui/progress';

const RISCO_BADGE: Record<RiscoElisao, string> = {
  baixo: 'bg-success/10 text-success border-success/30',
  medio: 'bg-warning/10 text-warning border-warning/30',
  alto: 'bg-destructive/10 text-destructive border-destructive/30',
};

const STATUS_LABEL: Record<string, string> = {
  identificada: 'Identificada',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  implementada: 'Implementada',
  descartada: 'Descartada',
};

export default function OportunidadesElisao() {
  const navigate = useNavigate();
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const [regimeAtual, setRegimeAtual] = useState<RegimeAplicavel>('simples');
  const [pl, setPl] = useState<number>(0);
  const [lucro, setLucro] = useState<number>(0);
  const [importacao, setImportacao] = useState<number>(0);
  const [pd, setPd] = useState<number>(0);
  const [beneficioIcms, setBeneficioIcms] = useState<number>(0);
  const [dividendos, setDividendos] = useState<number>(0);

  const {
    relatorio,
    oportunidadesSalvas,
    persistirOportunidades,
    atualizarStatus,
    temHistoricoSuficiente,
    alertas,
    creditosAuditoria,
    tarefasAcionaveis,
    decidirCredito,
    sincronizarBitrix,
  } = useOportunidadesElisao({
    empresaId,
    contexto: {
      regime_atual: regimeAtual,
      patrimonio_liquido: pl,
      lucro_liquido: lucro,
      receita_importacao: importacao,
      despesas_pd: pd,
      beneficio_icms_anual: beneficioIcms,
      dividendos_pf_anual: dividendos,
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-primary" />
            Oportunidades de Elisão Fiscal
          </h1>
          <p className="text-muted-foreground mt-1">
            9 estratégias legais analisadas a partir do perfil tributário da empresa.
          </p>
        </div>
        <Button
          onClick={() => persistirOportunidades.mutate()}
          disabled={!empresaId || persistirOportunidades.isPending || relatorio.total_aplicaveis === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar análise
        </Button>
      </div>

      {/* Parâmetros de contexto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contexto da empresa</CardTitle>
          <CardDescription>
            Empresa e variáveis usadas pelo motor para detectar oportunidades aplicáveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Empresa</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Regime atual</Label>
            <Select value={regimeAtual} onValueChange={(v) => setRegimeAtual(v as RegimeAplicavel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Patrimônio Líquido (R$)</Label>
            <Input type="number" value={pl} onChange={(e) => setPl(Number(e.target.value))} />
          </div>
          <div>
            <Label>Lucro Líquido anual (R$)</Label>
            <Input type="number" value={lucro} onChange={(e) => setLucro(Number(e.target.value))} />
          </div>
          <div>
            <Label>Importação anual (R$)</Label>
            <Input type="number" value={importacao} onChange={(e) => setImportacao(Number(e.target.value))} />
          </div>
          <div>
            <Label>Despesas P&D (R$)</Label>
            <Input type="number" value={pd} onChange={(e) => setPd(Number(e.target.value))} />
          </div>
          <div>
            <Label>Benefício ICMS anual (R$)</Label>
            <Input
              type="number"
              value={beneficioIcms}
              onChange={(e) => setBeneficioIcms(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Dividendos PF anuais (R$)</Label>
            <Input type="number" value={dividendos} onChange={(e) => setDividendos(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      {!temHistoricoSuficiente && empresaId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Histórico financeiro incompleto</AlertTitle>
          <AlertDescription>
            Cadastre 12 meses de faturamento e folha em "Histórico Tributário" para análise mais precisa.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estratégias analisadas</CardDescription>
            <CardTitle className="text-3xl">{relatorio.total_oportunidades}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardDescription>Aplicáveis ao seu perfil</CardDescription>
            <CardTitle className="text-3xl text-success">{relatorio.total_aplicaveis}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Economia estimada anual</CardDescription>
            <CardTitle className="text-3xl text-primary flex items-center gap-2">
              <TrendingUp className="h-7 w-7" />
              {formatCurrency(relatorio.economia_total_estimada)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="analise">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="analise">Análise atual</TabsTrigger>
          <TabsTrigger value="historico">Estratégias ({oportunidadesSalvas.length})</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria ({creditosAuditoria.length})</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({alertas.length})</TabsTrigger>
          <TabsTrigger value="acoes">Ações Bitrix ({tarefasAcionaveis.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analise" className="space-y-4 mt-4">
          {relatorio.total_aplicaveis === 0 && relatorio.total_oportunidades > 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="p-4 rounded-full bg-muted/50">
                  <SearchX className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-lg font-semibold">Nenhuma oportunidade aplicável encontrada</h3>
                  <p className="text-sm text-muted-foreground">
                    O motor avaliou {relatorio.total_oportunidades} estratégias, mas nenhuma se enquadra no perfil
                    atual da empresa. Importe 12 meses de histórico de faturamento e folha para uma análise mais
                    precisa.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/tributario/historico')}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Importar histórico tributário
                </Button>
              </CardContent>
            </Card>
          )}
          {relatorio.oportunidades.map((o) => (
            <Card
              key={o.estrategia}
              className={o.aplicavel ? 'border-primary/30' : 'opacity-60'}
              aria-label={`Estratégia ${o.nome} — ${o.aplicavel ? 'aplicável' : 'não aplicável'} — risco ${o.risco}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {o.aplicavel ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      {o.nome}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Scale className="h-3 w-3" />
                      {o.base_legal}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={RISCO_BADGE[o.risco]} variant="outline">
                      Risco {o.risco}
                    </Badge>
                    {o.aplicavel && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Economia estimada</div>
                        <div className="font-bold text-primary flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          {formatCurrency(o.economia_estimada)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{o.justificativa}</p>
                {o.aplicavel && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Próximos passos</div>
                    <ul className="space-y-1 text-sm">
                      {o.proximos_passos.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {o.observacoes && (
                  <Alert>
                    <AlertDescription className="text-xs">{o.observacoes}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="space-y-3 mt-4">
          {oportunidadesSalvas.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma oportunidade salva ainda. Use "Salvar análise" no topo.
              </AlertDescription>
            </Alert>
          ) : (
            oportunidadesSalvas.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{o.categoria || o.estrategia}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Identificada em {new Date(o.data_identificacao).toLocaleDateString('pt-BR')} ·{' '}
                        Economia: {formatCurrency(Number(o.economia_estimada || 0))}
                      </CardDescription>
                    </div>
                    <Select
                      value={o.status}
                      onValueChange={(v) => atualizarStatus.mutate({ id: o.id, status: v })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                {o.observacoes && (
                  <CardContent>
                    <p className="text-xs whitespace-pre-line text-muted-foreground">{o.observacoes}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4 mt-4">
          {creditosAuditoria.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
              Nenhum crédito pendente de auditoria para esta empresa.
            </div>
          ) : (
            creditosAuditoria.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{c.ncm}</Badge>
                        <Badge variant="secondary">{c.cst_csosn}</Badge>
                        <span className="text-sm font-medium">Nota: {c.nota?.arquivo_nome || 'Identificada'}</span>
                      </div>
                      <CardTitle className="text-lg">Crédito de {formatCurrency(c.valor_credito_calculado)}</CardTitle>
                    </div>
                    <Badge className={
                      c.status_aprovacao === 'aprovado' ? 'bg-success/10 text-success' :
                      c.status_aprovacao === 'rejeitado' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }>
                      {c.status_aprovacao.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-md">
                    <div>
                      <span className="text-muted-foreground block">Base de cálculo</span>
                      <span className="font-semibold">{formatCurrency(c.valor_base)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Metodologia</span>
                      <span className="font-semibold">{c.metodologia_aplicada}</span>
                    </div>
                  </div>
                  
                  {c.status_aprovacao === 'pendente' && (
                    <div className="flex gap-2 justify-end pt-2">
                      {c.nota?.arquivo_url && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(c.nota.arquivo_url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver XML/DANFE
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/5"
                        onClick={() => decidirCredito.mutate({ id: c.id, status: 'rejeitado' })}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-success hover:bg-success/90"
                        onClick={() => decidirCredito.mutate({ id: c.id, status: 'aprovado' })}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar para Recuperação
                      </Button>
                    </div>
                  )}
                  
                  {Array.isArray(c.historico_decisoes) && (c.historico_decisoes as any[]).length > 0 && (
                    <div className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <History className="h-3 w-3" />
                        <span>Histórico de decisões</span>
                      </div>
                      {(c.historico_decisoes as any[]).map((h: any, i: number) => (
                        <div key={i}>
                          • {new Date(h.data).toLocaleString()} - Alterado para {h.status}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4 mt-4">
          {alertas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
              Nenhum alerta de divergência para o período selecionado.
            </div>
          ) : (
            alertas.map((a) => (
              <Alert key={a.id} variant={a.severidade === 'alta' ? 'error' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{a.tipo_divergencia.replace('_', ' ').toUpperCase()}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{a.severidade}</Badge>
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="text-sm">{a.descricao}</p>
                  <div className="mt-2 text-[10px] opacity-70">
                    Detectado em {new Date(a.created_at).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </TabsContent>

        <TabsContent value="acoes" className="space-y-4 mt-4">
          {tarefasAcionaveis.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
              Nenhuma tarefa de recuperação ativa.
            </div>
          ) : (
            tarefasAcionaveis.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{t.titulo}</CardTitle>
                    <Badge variant={t.bitrix_sync_status === 'sincronizado' ? 'success' : 'outline'} className="gap-1">
                      {t.bitrix_sync_status === 'sincronizado' && <CheckCircle2 className="h-3 w-3" />}
                      Bitrix: {t.bitrix_sync_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t.descricao}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Valor em jogo: </span>
                      <span className="font-semibold text-primary">{formatCurrency(t.valor_envolvido)}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => sincronizarBitrix.mutate(t.id)}
                      disabled={sincronizarBitrix.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 ${sincronizarBitrix.isPending && 'animate-spin'}`} />
                      {t.bitrix_task_id ? 'Atualizar no Bitrix24' : 'Criar Tarefa no Bitrix24'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
