import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EventoLog } from './types';

export interface StatsCardsProps {
  logs: EventoLog[];
}

export function StatsCards({ logs }: StatsCardsProps) {
  const stats = {
    sucesso: logs.filter((l) => l.status === 'sucesso').length,
    sem_regra: logs.filter((l) => l.status === 'sem_regra').length,
    erro: logs.filter((l) => l.status === 'erro').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sucesso (50 últimos)</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sucesso}</div>
        </CardContent>
      </Card>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sem regra</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sem_regra}</div>
        </CardContent>
      </Card>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Erros</CardTitle>
          <Activity className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.erro}</div>
        </CardContent>
      </Card>
    </div>
  );
}
