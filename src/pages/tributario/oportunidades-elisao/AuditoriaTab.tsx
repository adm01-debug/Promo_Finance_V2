// @ts-nocheck
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TabsContent } from '@/components/ui/tabs';
import {
  AlertCircle, CheckCheck, CheckCircle2, Download, FilePieChart, FileText, History, XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { baixarRelatorioAuditoriaCreditos } from '@/lib/tributario/relatorio-pdf';
import type { Database } from '@/integrations/supabase/types';

interface AuditoriaTabProps {
  creditosAuditoria: Database['public']['Tables']['elisao_creditos_auditoria']['Row'][];
  empresaRazaoSocial: string;
  decidirCredito: { mutate: (args: { id: string; status: string }) => void };
}

export function AuditoriaTab({ creditosAuditoria, empresaRazaoSocial, decidirCredito }: AuditoriaTabProps) {
  return (
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
                  {c.regra && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCheck className="h-3 w-3 text-success" />
                      <span>Regra: {c.regra.descricao}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={
                    c.status_aprovacao === 'aprovado' ? 'bg-success/10 text-success' :
                    c.status_aprovacao === 'rejeitado' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }>
                    {c.status_aprovacao.toUpperCase()}
                  </Badge>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground">Score de Confiança</span>
                    <div className="flex items-center gap-2 w-24">
                      <Progress value={c.score_confianca || 100} className="h-1" />
                      <span className="text-[10px] font-bold">{c.score_confianca || 100}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-3 rounded-md">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Base de cálculo</span>
                  <span className="font-semibold">{formatCurrency(c.valor_base)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Metodologia</span>
                  <span className="font-semibold">{c.metodologia_aplicada}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">CST Origem (XML)</span>
                  <span className="font-semibold">{((c.nota?.dados_extraidos as Record<string, unknown> | undefined)?.cst as string | undefined) || 'N/D'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Identificado em</span>
                  <span className="font-semibold">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {Array.isArray(c.divergencias_detectadas) && c.divergencias_detectadas.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                  <div className="flex items-center gap-2 text-destructive text-xs font-bold mb-2 uppercase">
                    <AlertCircle className="h-4 w-4" />
                    Divergências Encontradas
                  </div>
                  <ul className="space-y-1">
                    {(c.divergencias_detectadas as Array<{ campo: string; mensagem: string }>).map((d, idx: number) => (
                      <li key={idx} className="text-xs flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        <span>{d.campo}: {d.mensagem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-white/5 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 rounded-xl border-white/10 hover:bg-card/5"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,"
                      + "ID,NCM,CST,Valor,Status,Score,Metodologia\n"
                      + `${c.id},${c.ncm},${c.cst_csosn},${c.valor_credito_calculado},${c.status_aprovacao},${c.score_confianca},${c.metodologia_aplicada}`;
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `auditoria_credito_${c.id}.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 rounded-xl border-white/10 hover:bg-card/5"
                  onClick={() => baixarRelatorioAuditoriaCreditos(empresaRazaoSocial || 'Empresa', [c])}
                >
                  <FilePieChart className="h-4 w-4 text-primary" />
                  Auditoria PDF
                </Button>
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

              {Array.isArray(c.historico_decisoes) && (c.historico_decisoes as Array<{ data: string; status: string }>).length > 0 && (
                <div className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <History className="h-3 w-3" />
                    <span>Histórico de decisões</span>
                  </div>
                  {(c.historico_decisoes as Array<{ data: string; status: string }>).map((h, i: number) => (
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
  );
}
