import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Database, Mail, Shield, Zap, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditoriaTributariaTab } from '@/components/admin/AuditoriaTributariaTab';
import { ResumosExecutivosTab } from '@/components/admin/ResumosExecutivosTab';
import { logger } from '@/lib/logger';

interface HealthRow {
  function_name: string;
  total_calls: number;
  error_count: number;
  error_rate_pct: number | null;
  p95_ms: number | null;
}

export default function AdminSystemHealth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data, error }) => {
      if (error) {
        logger.error('Erro ao verificar role admin', error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
      if (!data) navigate('/');
    });
  }, [user, navigate]);

  const { data: edgeHealth } = useQuery({
    queryKey: ['sys-edge-health'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vw_edge_health' as never).select('*');
      if (error) throw error;
      return (data ?? []) as unknown as HealthRow[];
    },
    enabled: isAdmin === true,
    refetchInterval: 60_000,
  });

  const { data: cnpjaCacheStats } = useQuery({
    queryKey: ['sys-cnpja-cache'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('cnpja_cache')
        .select('*', { count: 'exact', head: true });
      const { count: validos } = await supabase
        .from('cnpja_cache')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());
      return { total: total ?? 0, validos: validos ?? 0 };
    },
    enabled: isAdmin === true,
    refetchInterval: 60_000,
  });

  const { data: regimeCacheStats } = useQuery({
    queryKey: ['sys-regime-cache'],
    queryFn: async () => {
      const { count } = await supabase
        .from('regime_decision_cache' as never)
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());
      return { ativos: count ?? 0 };
    },
    enabled: isAdmin === true,
    refetchInterval: 60_000,
  });

  const { data: agendamentosStats } = useQuery({
    queryKey: ['sys-agendamentos'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('relatorios_tributarios_agendados' as never)
        .select('*', { count: 'exact', head: true });
      const { count: ativos } = await supabase
        .from('relatorios_tributarios_agendados' as never)
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      return { total: total ?? 0, ativos: ativos ?? 0 };
    },
    enabled: isAdmin === true,
    refetchInterval: 60_000,
  });

  if (isAdmin === null) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (isAdmin === false) return null;

  const totalCalls = (edgeHealth ?? []).reduce((s, r) => s + r.total_calls, 0);
  const totalErrors = (edgeHealth ?? []).reduce((s, r) => s + r.error_count, 0);
  const errorRate = totalCalls ? ((totalErrors / totalCalls) * 100).toFixed(2) : '0.00';
  const maxP95 = Math.max(0, ...(edgeHealth ?? []).map((r) => r.p95_ms ?? 0));
  const slaOk = Number(errorRate) < 1 && maxP95 < 3000;
  const cnpjaHitRate = cnpjaCacheStats?.total
    ? ((cnpjaCacheStats.validos / cnpjaCacheStats.total) * 100).toFixed(1)
    : '0.0';

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            System Health
          </h1>
          <p className="text-muted-foreground">Painel operacional consolidado · atualizado a cada 60s</p>
        </div>
        <Badge variant={slaOk ? 'outline' : 'destructive'} className="text-sm">
          SLA: {slaOk ? 'OK' : 'Atenção'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria tributária</TabsTrigger>
          <TabsTrigger value="resumos">Resumos executivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={item}>
              <KpiCard icon={<Zap className="h-4 w-4" />} label="Edge — chamadas 7d" value={totalCalls.toLocaleString('pt-BR')} hint={`${errorRate}% erros`} />
            </motion.div>
            <motion.div variants={item}>
              <KpiCard icon={<Activity className="h-4 w-4" />} label="Edge — pior p95" value={`${maxP95} ms`} hint={maxP95 < 1000 ? 'Excelente' : maxP95 < 3000 ? 'Aceitável' : 'Lento'} />
            </motion.div>
            <motion.div variants={item}>
              <KpiCard icon={<Database className="h-4 w-4" />} label="CNPJá cache" value={`${cnpjaHitRate}%`} hint={`${cnpjaCacheStats?.validos ?? 0}/${cnpjaCacheStats?.total ?? 0} válidos`} />
            </motion.div>
            <motion.div variants={item}>
              <KpiCard icon={<Shield className="h-4 w-4" />} label="Cache regime" value={String(regimeCacheStats?.ativos ?? 0)} hint="entradas ativas (TTL 7d)" />
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Relatórios agendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{agendamentosStats?.ativos ?? 0}</p>
                <p className="text-sm text-muted-foreground">
                  ativos · {agendamentosStats?.total ?? 0} totais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subsistemas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/edge-health">
                    Edge Functions detalhado <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/telemetria">
                    Telemetria <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/audit-logs">
                    Auditoria geral <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auditoria">
          <AuditoriaTributariaTab />
        </TabsContent>

        <TabsContent value="resumos">
          <ResumosExecutivosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}
