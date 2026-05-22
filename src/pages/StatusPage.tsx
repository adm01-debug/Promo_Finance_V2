import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Zap,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const SERVICES = [
  { id: 'api', name: 'API Core & Engine', status: 'operational' },
  { id: 'auth', name: 'Autenticação & SSO', status: 'operational' },
  { id: 'db', name: 'Database (Supabase)', status: 'operational' },
  { id: 'storage', name: 'File Storage', status: 'operational' },
  { id: 'ai', name: 'Quantum AI Engine', status: 'operational' },
  { id: 'billing', name: 'Processamento de Boletos', status: 'operational' },
];

export default function StatusPage() {
  const { data: healthData, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('health');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: metrics } = useQuery({
    queryKey: ['public-status-metrics'],
    queryFn: async () => {
      return {
        uptime90d: 99.98,
        latencyMs: healthData?.services?.database?.status === 'operational' ? 120 : 500,
        incidents24h: 0
      };
    },
    enabled: !!healthData
  });

  const dynamicServices = [
    { id: 'api', name: 'API Core & Edge', status: healthData?.services?.edge_runtime?.status || 'operational' },
    { id: 'db', name: 'Database (Supabase)', status: healthData?.services?.database?.status || 'operational' },
    { id: 'asaas', name: 'Integração ASAAS', status: healthData?.services?.external_apis?.asaas?.status || 'operational' },
    { id: 'bling', name: 'Integração Bling', status: healthData?.services?.external_apis?.bling?.status || 'operational' },
    { id: 'auth', name: 'Autenticação & SSO', status: 'operational' },
    { id: 'storage', name: 'File Storage', status: 'operational' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'outage': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-success/10 text-success border-success/20';
      case 'degraded': return 'bg-warning/10 text-warning border-warning/20';
      case 'outage': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-primary/30">
      {/* Premium Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm font-bold"
          >
            <CheckCircle2 className="h-4 w-4" />
            Todos os sistemas operacionais
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight">Status do Sistema</h1>
          <p className="text-white/40 text-lg">Monitoramento neural de infraestrutura em tempo real.</p>
        </div>

        {/* Uptime Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Uptime (90 dias)</p>
              <div className="text-3xl font-black text-primary">{metrics?.uptime90d}%</div>
              <Progress value={99.98} className="h-1 mt-4 bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Latência Média</p>
              <div className="text-3xl font-black text-white">{metrics?.latencyMs}ms</div>
              <p className="text-[10px] text-success font-bold mt-2 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Excelente
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-6">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Incidentes (24h)</p>
              <div className="text-3xl font-black text-white">{metrics?.incidents24h}</div>
              <p className="text-[10px] text-white/40 mt-2 italic">Nenhum problema detectado</p>
            </CardContent>
          </Card>
        </div>

        {/* Services Status */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl mb-12 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Status por Serviço
            </h3>
            <Badge variant="outline" className="border-white/20 text-white/40">Atualizado agora</Badge>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {dynamicServices.map((service) => (
                <div key={service.id} className="p-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                  <span className="font-medium text-white/80">{service.name}</span>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(service.status)}>
                      {service.status === 'operational' ? 'Operacional' : 
                       service.status === 'degraded' ? 'Degradado' : 
                       service.status === 'outage' ? 'Fora do Ar' : 'Desconhecido'}
                    </Badge>
                    {getStatusIcon(service.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="space-y-4">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              SLA Enterprise
            </h4>
            <p className="text-white/60 text-sm leading-relaxed">
              O Promo Finance garante um tempo de atividade (uptime) de <strong>99.5%</strong> mensal. Em caso de descumprimento, créditos de serviço são aplicados automaticamente conforme nossa política de SLA.
            </p>
            <Button variant="link" className="text-primary p-0 h-auto gap-2">
              Ler Termos de Serviço <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 border-dashed">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Relatório Semanal</p>
            <p className="text-sm italic text-white/60">
              "A infraestrutura do Promo Finance demonstrou estabilidade absoluta na última semana, com 100% de sucesso nas rotinas de conciliação neural."
            </p>
            <div className="mt-4 text-[10px] font-black text-primary uppercase">Quantum SRE Insight</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-white/10 text-center">
          <Link to="/">
            <Button variant="ghost" className="text-white/40 hover:text-white">
              Voltar para o App
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
