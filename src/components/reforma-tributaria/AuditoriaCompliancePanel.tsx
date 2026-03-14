// ============================================
// COMPONENTE: AUDITORIA DE COMPLIANCE
// ============================================

import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuditoriaCompliance } from '@/hooks/useAuditoriaCompliance';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  empresaId: string;
}

export function AuditoriaCompliancePanel({ empresaId }: Props) {
  const { achamentos, resumo, isExecutando, executarAuditoria, resolverAchamento } = useAuditoriaCompliance(empresaId);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critico': return <Badge variant="destructive">Crítico</Badge>;
      case 'erro': return <Badge className="bg-warning text-warning-foreground">Erro</Badge>;
      case 'aviso': return <Badge className="bg-warning/70 text-warning-foreground">Aviso</Badge>;
      default: return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Auditoria de Compliance</h2>
          <p className="text-sm text-muted-foreground">Verificação automática de inconsistências</p>
        </div>
        <Button onClick={executarAuditoria} disabled={isExecutando}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isExecutando ? 'animate-spin' : ''}`} />
          {isExecutando ? 'Analisando...' : 'Executar Auditoria'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${resumo.scoreCompliance >= 80 ? 'text-success' : resumo.scoreCompliance >= 60 ? 'text-warning' : 'text-destructive'}`}>
              {resumo.scoreCompliance}%
            </div>
            <Progress value={resumo.scoreCompliance} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{resumo.criticos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{resumo.erros}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.impactoFinanceiroTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {achamentos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Achamentos ({achamentos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {achamentos.map((item, idx) => (
                <AccordionItem key={item.id} value={`item-${idx}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex-1">
                        <p className="font-medium">{item.titulo}</p>
                        <p className="text-sm text-muted-foreground">{item.categoria}</p>
                      </div>
                      {getSeverityBadge(item.severidade)}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4">
                      <p>{item.descricao}</p>
                      {item.impactoFinanceiro && (
                        <p><strong>Impacto:</strong> {formatCurrency(item.impactoFinanceiro)}</p>
                      )}
                      <div className="p-3 rounded bg-muted">
                        <p className="text-sm font-medium">Recomendação:</p>
                        <p className="text-sm">{item.recomendacao}</p>
                      </div>
                      {item.status === 'pendente' && (
                        <Button size="sm" onClick={() => resolverAchamento(item.id)}>
                          Marcar como resolvido
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle className="h-12 w-12 text-success" />
            <div>
              <h3 className="text-lg font-semibold text-success">Compliance 100%!</h3>
              <p className="text-success/80">Nenhuma inconsistência detectada.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AuditoriaCompliancePanel;
