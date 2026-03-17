import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { QrCode, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresas } from '@/hooks/useFinancialData';

export function PixDashboardRealtime() {
  const { data: empresas = [] } = useEmpresas();

  const { data: transferenciasHoje = [], isLoading: lt } = useQuery({
    queryKey: ['pix-dashboard-hoje'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('transferencias')
        .select('*')
        .gte('data_transferencia', hoje)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000, // Refresh every 15s
  });

  const { data: pagamentosHoje = [], isLoading: lp } = useQuery({
    queryKey: ['asaas-payments-hoje'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('asaas_payments')
        .select('*')
        .gte('data_vencimento', hoje)
        .lte('data_vencimento', hoje)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const isLoading = lt || lp;

  const stats = useMemo(() => {
    const pixEnviados = transferenciasHoje.filter(t => t.tipo === 'pix' || t.pix_chave_destino);
    const totalEnviado = pixEnviados.reduce((s, t) => s + (t.valor || 0), 0);
    const concluidos = pixEnviados.filter(t => ['realizado', 'concluido', 'completed'].includes(t.status));
    const pendentes = pixEnviados.filter(t => ['pendente', 'agendado', 'em_processamento'].includes(t.status));
    const falhas = pixEnviados.filter(t => ['cancelado', 'erro', 'failed', 'rejeitado'].includes(t.status));

    const pixRecebidos = pagamentosHoje.filter(p => p.tipo === 'pix' && ['RECEIVED', 'CONFIRMED'].includes(p.status));
    const totalRecebido = pixRecebidos.reduce((s, p) => s + (p.valor || 0), 0);

    // Per empresa
    const porEmpresa = empresas.map(emp => {
      const envEmp = pixEnviados.filter(t => t.empresa_id === emp.id);
      const recEmp = pagamentosHoje.filter(p => p.empresa_id === emp.id && p.tipo === 'pix');
      return {
        nome: emp.nome_fantasia || emp.razao_social,
        enviados: envEmp.length,
        totalEnviado: envEmp.reduce((s, t) => s + (t.valor || 0), 0),
        recebidos: recEmp.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).length,
        totalRecebido: recEmp.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).reduce((s, p) => s + (p.valor || 0), 0),
      };
    }).filter(e => e.enviados > 0 || e.recebidos > 0);

    return {
      totalEnviado,
      totalRecebido,
      qtdEnviados: pixEnviados.length,
      qtdRecebidos: pixRecebidos.length,
      qtdConcluidos: concluidos.length,
      qtdPendentes: pendentes.length,
      qtdFalhas: falhas.length,
      porEmpresa,
      ultimasTransacoes: pixEnviados.slice(0, 8),
    };
  }, [transferenciasHoje, pagamentosHoje, empresas]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        <Skeleton className="h-80 col-span-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={ArrowUpRight} label="PIX Enviados Hoje" value={formatCurrency(stats.totalEnviado)} sub={`${stats.qtdEnviados} operação(ões)`} variant="sent" />
        <KPICard icon={ArrowDownLeft} label="PIX Recebidos Hoje" value={formatCurrency(stats.totalRecebido)} sub={`${stats.qtdRecebidos} recebimento(s)`} variant="received" />
        <KPICard icon={Clock} label="Pendentes" value={String(stats.qtdPendentes)} sub="Aguardando processamento" variant={stats.qtdPendentes > 0 ? 'warning' : 'neutral'} />
        <KPICard icon={stats.qtdFalhas > 0 ? AlertCircle : CheckCircle2} label="Falhas" value={String(stats.qtdFalhas)} sub={stats.qtdFalhas === 0 ? 'Tudo ok!' : 'Requer atenção'} variant={stats.qtdFalhas > 0 ? 'danger' : 'success'} />
      </div>

      {/* Per empresa breakdown */}
      {stats.porEmpresa.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Operações PIX por CNPJ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.porEmpresa.map((emp, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <p className="text-sm font-semibold">{emp.nome}</p>
                    <p className="text-xs text-muted-foreground">{emp.enviados} enviado(s) • {emp.recebidos} recebido(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive tabular-nums">-{formatCurrency(emp.totalEnviado)}</p>
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">+{formatCurrency(emp.totalRecebido)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            Últimas Operações PIX
          </CardTitle>
          <CardDescription>Atualizando a cada 15 segundos</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.ultimasTransacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma operação PIX hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.ultimasTransacoes.map((t) => {
                const emp = empresas.find(e => e.id === t.empresa_id);
                const statusColor = ['realizado', 'concluido'].includes(t.status) ? 'text-emerald-600' 
                  : ['cancelado', 'erro', 'rejeitado'].includes(t.status) ? 'text-destructive' 
                  : 'text-muted-foreground';
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                        ['realizado', 'concluido'].includes(t.status) ? 'bg-emerald-500/10' : 'bg-muted')}>
                        <ArrowUpRight className={cn('h-4 w-4', statusColor)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.favorecido_nome || t.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {emp?.nome_fantasia || emp?.razao_social || ''} • {t.chave_pix || t.pix_chave_destino || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold tabular-nums text-sm">{formatCurrency(t.valor)}</p>
                      <Badge variant="outline" className={cn('text-[10px]', statusColor)}>{t.status}</Badge>
                    </div>
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

function KPICard({ icon: Icon, label, value, sub, variant }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  variant: 'sent' | 'received' | 'warning' | 'danger' | 'success' | 'neutral';
}) {
  const colors = {
    sent: { bg: 'bg-primary/10', icon: 'text-primary', value: 'text-foreground' },
    received: { bg: 'bg-emerald-500/10', icon: 'text-emerald-600', value: 'text-emerald-600' },
    warning: { bg: 'bg-accent/10', icon: 'text-accent-foreground', value: 'text-accent-foreground' },
    danger: { bg: 'bg-destructive/10', icon: 'text-destructive', value: 'text-destructive' },
    success: { bg: 'bg-emerald-500/10', icon: 'text-emerald-600', value: 'text-emerald-600' },
    neutral: { bg: 'bg-muted', icon: 'text-muted-foreground', value: 'text-muted-foreground' },
  };
  const c = colors[variant];
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
            <Icon className={cn('h-5 w-5', c.icon)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={cn('text-lg font-bold tabular-nums', c.value)}>{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
