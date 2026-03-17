import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEmpresas, useContasBancarias } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Building2, AlertCircle, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FluxoInterEmpresas() {
  const { data: empresas = [], isLoading: le } = useEmpresas();
  const { data: contas = [], isLoading: lc } = useContasBancarias();

  // Fetch transferências inter-empresas
  const { data: transferencias = [], isLoading: lt } = useQuery({
    queryKey: ['transferencias-intercompany'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = le || lc || lt;

  const analise = useMemo(() => {
    // Saldo por empresa
    const saldoEmpresa = empresas.map(emp => {
      const contasEmp = contas.filter((c: any) => c.empresa_id === emp.id);
      const saldo = contasEmp.reduce((s: number, c: any) => s + (c.saldo_atual || 0), 0);
      return {
        id: emp.id,
        nome: emp.nome_fantasia || emp.razao_social,
        cnpj: emp.cnpj,
        saldo,
        numContas: contasEmp.length,
      };
    });

    // Sugestões de otimização
    const sugestoes: Array<{ de: string; para: string; valor: number; motivo: string }> = [];
    const sorted = [...saldoEmpresa].sort((a, b) => b.saldo - a.saldo);
    
    if (sorted.length >= 2) {
      const maior = sorted[0];
      const menor = sorted[sorted.length - 1];
      if (maior.saldo > 0 && menor.saldo < maior.saldo * 0.1) {
        const sugestaoValor = Math.min(maior.saldo * 0.2, maior.saldo - menor.saldo);
        if (sugestaoValor > 100) {
          sugestoes.push({
            de: maior.nome,
            para: menor.nome,
            valor: sugestaoValor,
            motivo: `${menor.nome} tem saldo proporcionalmente baixo. Sugerimos redistribuir para equalizar liquidez.`,
          });
        }
      }
    }

    return { saldoEmpresa, sugestoes };
  }, [empresas, contas]);

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Posição atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Posição Inter-Empresas</CardTitle>
          <CardDescription>Visão da liquidez entre os CNPJs do grupo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analise.saldoEmpresa.map((emp, idx) => (
              <div key={emp.id} className="relative">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{emp.nome}</p>
                    <p className="text-xs text-muted-foreground font-mono">{emp.cnpj || '—'}</p>
                    <p className={cn('text-lg font-bold tabular-nums mt-1', emp.saldo >= 0 ? 'text-foreground' : 'text-destructive')}>
                      {formatCurrency(emp.saldo)}
                    </p>
                    <p className="text-xs text-muted-foreground">{emp.numContas} conta(s)</p>
                  </div>
                </div>
                {idx < analise.saldoEmpresa.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sugestões de otimização */}
      {analise.sugestoes.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent-foreground" />
              Sugestões de Otimização
            </CardTitle>
            <CardDescription>Redistribuição sugerida com base nos saldos atuais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analise.sugestoes.map((sug, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Badge variant="outline" className="shrink-0 border-amber-500/30 text-amber-700">
                  Sugestão
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-semibold">{sug.de}</span>
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold">{sug.para}</span>
                    <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/30">
                      {formatCurrency(sug.valor)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{sug.motivo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Histórico de transferências */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transferências Recentes</CardTitle>
          <CardDescription>Movimentações entre empresas do grupo</CardDescription>
        </CardHeader>
        <CardContent>
          {transferencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma transferência inter-empresas registrada</p>
              <p className="text-xs mt-1">Use a página de Movimentações para registrar transferências</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transferencias.slice(0, 10).map((t: any) => {
                const origem = empresas.find(e => e.id === t.empresa_id);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.descricao || 'Transferência'}</p>
                        <p className="text-xs text-muted-foreground">
                          {origem?.nome_fantasia || origem?.razao_social || 'N/A'} • {t.data_transferencia || t.created_at?.substring(0, 10)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold tabular-nums text-sm">{formatCurrency(t.valor || 0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
