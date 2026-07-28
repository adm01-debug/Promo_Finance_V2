import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Database, Gauge, Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { SLOPanel } from '@/components/admin/SLOPanel';
import { FiscalHealthBadge } from '@/components/admin/FiscalHealthBadge';

// Consolida em uma única visão SRE (SLO, Edge, Telemetria) — item #17 do plano.
const AdminSystemHealth = lazy(() => import('@/pages/AdminSystemHealth'));
const AdminEdgeHealth = lazy(() => import('@/pages/AdminEdgeHealth'));
const AdminTelemetria = lazy(() => import('@/pages/AdminTelemetria'));

type TabKey = 'slo' | 'system' | 'edge' | 'telemetry';

const TAB_META: Record<TabKey, { label: string; icon: typeof Activity; description: string }> = {
  slo: { label: 'SLO & Error Budget', icon: Gauge, description: 'Latência, disponibilidade e orçamento de erro' },
  system: { label: 'Sistema', icon: Server, description: 'Saúde geral, integrações e automações' },
  edge: { label: 'Edge Functions', icon: Activity, description: 'Latência, taxa de erro e últimos erros por função' },
  telemetry: { label: 'Telemetria DB', icon: Database, description: 'Queries lentas, alertas de performance e trends' },
};

const FallbackPanel = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export default function SRECommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const initialTab = (params.get('tab') as TabKey) || 'slo';
  const [tab, setTab] = useState<TabKey>(initialTab);

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

  const handleTabChange = (value: string) => {
    const next = value as TabKey;
    setTab(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams, { replace: true });
  };

  if (isAdmin === null) {
    return (
      <MainLayout>
        <div className="p-6">
          <FallbackPanel />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) return null;

  const meta = TAB_META[tab];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Gauge className="h-6 w-6 text-primary" aria-hidden />
              SRE Command Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Visão unificada de confiabilidade — {meta.description}.
            </p>
          </div>
          <FiscalHealthBadge />
        </header>

        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            {(Object.keys(TAB_META) as TabKey[]).map((key) => {
              const Icon = TAB_META[key].icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-2">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">{TAB_META[key].label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="slo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SLO & Error Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <SLOPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Suspense fallback={<FallbackPanel />}>
              <AdminSystemHealth />
            </Suspense>
          </TabsContent>

          <TabsContent value="edge">
            <Suspense fallback={<FallbackPanel />}>
              <AdminEdgeHealth />
            </Suspense>
          </TabsContent>

          <TabsContent value="telemetry">
            <Suspense fallback={<FallbackPanel />}>
              <AdminTelemetria />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
