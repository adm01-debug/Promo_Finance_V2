import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';

interface HealthRow {
  function_name: string;
  total_calls: number;
  error_count: number;
  error_rate_pct: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  last_call_at: string;
}

interface ErrorLog {
  id: string;
  function_name: string;
  event: string;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export default function AdminEdgeHealth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data, error }) => {
        if (error) {
          logger.error('Erro ao verificar role admin', error);
          setIsAdmin(false);
          return;
        }
        setIsAdmin(!!data);
        if (!data) navigate('/');
      });
  }, [user, navigate]);

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['edge-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_edge_health' as never)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as HealthRow[];
    },
    enabled: isAdmin === true,
    refetchInterval: 30_000,
  });

  const { data: errors } = useQuery({
    queryKey: ['edge-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_logs')
        .select('id, function_name, event, error_message, duration_ms, created_at')
        .eq('level', 'error')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ErrorLog[];
    },
    enabled: isAdmin === true,
    refetchInterval: 30_000,
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

  const totalCalls = (health || []).reduce((s, r) => s + r.total_calls, 0);
  const totalErrors = (health || []).reduce((s, r) => s + r.error_count, 0);
  const overallErrorRate =
    totalCalls > 0 ? ((totalErrors / totalCalls) * 100).toFixed(2) : '0.00';
  const maxP95 = Math.max(0, ...(health || []).map((r) => r.p95_ms ?? 0));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saúde das Edge Functions</h1>
        <p className="text-muted-foreground">
          Métricas dos últimos 7 dias · atualizado a cada 30s
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chamadas (7d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de erro (7d)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallErrorRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalErrors} erros em {totalCalls} chamadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pior latência p95</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxP95.toLocaleString('pt-BR')} ms</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Por função
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <Skeleton className="h-40 w-full" />
          ) : (health || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum log registrado ainda. Execute alguma função tributária para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Chamadas</TableHead>
                  <TableHead className="text-right">Erros</TableHead>
                  <TableHead className="text-right">Taxa erro</TableHead>
                  <TableHead className="text-right">p50 (ms)</TableHead>
                  <TableHead className="text-right">p95 (ms)</TableHead>
                  <TableHead>Última chamada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(health || []).map((row) => (
                  <TableRow key={row.function_name}>
                    <TableCell className="font-mono text-xs">{row.function_name}</TableCell>
                    <TableCell className="text-right">{row.total_calls}</TableCell>
                    <TableCell className="text-right">{row.error_count}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          (row.error_rate_pct ?? 0) > 5
                            ? 'destructive'
                            : (row.error_rate_pct ?? 0) > 1
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {(row.error_rate_pct ?? 0).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.p50_ms ?? '—'}</TableCell>
                    <TableCell className="text-right">{row.p95_ms ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.last_call_at).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Últimos 50 erros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(errors || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro registrado. 🎉</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(errors || []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.function_name}</TableCell>
                    <TableCell className="text-xs">{e.event}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-md truncate">
                      {e.error_message ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {e.duration_ms ? `${e.duration_ms} ms` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
