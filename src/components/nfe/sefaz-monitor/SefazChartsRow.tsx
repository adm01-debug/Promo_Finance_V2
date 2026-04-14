import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface HealthHistoryPoint {
  time: string;
  timestamp: number;
  latency: number;
  online: boolean;
  status: number;
}

interface Props {
  healthHistory: HealthHistoryPoint[];
}

export function SefazChartsRow({ healthHistory }: Props) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Histórico de Latência</CardTitle>
          <CardDescription>Últimas {healthHistory.length} verificações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {healthHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthHistory}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}ms`} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}ms`, 'Latência']} />
                  <Area type="monotone" dataKey="latency" stroke="hsl(var(--primary))" fill="url(#latencyGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground"><p>Aguardando dados de monitoramento...</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Status em Tempo Real</CardTitle>
          <CardDescription>Disponibilidade recente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {healthHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthHistory}>
                  <defs>
                    <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(value) => value === 100 ? 'ON' : 'OFF'} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [value === 100 ? 'Online' : 'Offline', 'Status']} />
                  <Area type="stepAfter" dataKey="status" stroke="hsl(var(--success))" fill="url(#statusGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground"><p>Aguardando dados de monitoramento...</p></div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
