import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, CheckCircle2, XCircle, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WebhookSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, fail: 0 });

  const startSimulation = async () => {
    try {
      setIsRunning(true);
      setResults([]);
      setStats({ total: 0, success: 0, fail: 0 });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Criar a rodada
      const { data: run, error: runError } = await supabase
        .from('webhook_simulation_runs')
        .insert({
          status: 'pending',
          created_by: user.id
        } as any)
        .select()
        .single();

      if (runError || !run) throw runError || new Error('Falha ao criar rodada');
      const runData = run as any;

      // 2. Chamar a Edge Function
      const { error: funcError } = await supabase.functions.invoke('webhook-simulator', {
        body: { 
          run_id: runData.id, 
          target_function: 'asaas-webhook',
          scenarios_count: 50
        }
      });

      if (funcError) throw funcError;

      toast.success('Simulação iniciada com sucesso!');
      
      // 3. Monitorar resultados
      pollResults(runData.id);

    } catch (error: any) {
      console.error('Erro na simulação:', error);
      toast.error('Falha ao iniciar simulação: ' + error.message);
      setIsRunning(false);
    }
  };

  const pollResults = async (runId: string) => {
    const interval = setInterval(async () => {
      const { data: run } = await supabase
        .from('webhook_simulation_runs')
        .select('*')
        .eq('id', runId)
        .single();

      const runData = run as any;

      const { data: resultsData } = await supabase
        .from('webhook_simulation_results')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: false });

      if (resultsData) {
        setResults(resultsData);
        const success = resultsData.filter((r: any) => r.success).length;
        setStats({
          total: resultsData.length,
          success,
          fail: resultsData.length - success
        });
      }

      if (runData && (runData.status === 'completed' || runData.status === 'failed')) {
        clearInterval(interval);
        setIsRunning(false);
        if (runData.status === 'completed') {
          toast.success('Simulação finalizada!');
        } else {
          toast.error('Simulação falhou no processamento.');
        }
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Simulador de Estresse & Consistência
              </CardTitle>
              <CardDescription>
                Executa milhares de cenários de webhooks para validar a resiliência das Edge Functions.
              </CardDescription>
            </div>
            <Button 
              onClick={startSimulation} 
              disabled={isRunning}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
            >
              {isRunning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Iniciar Teste em Massa</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-card/5 border-white/5 p-4 text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Cenários Executados</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/10 p-4 text-center">
              <p className="text-sm text-emerald-400 uppercase tracking-wider mb-1">Sucesso</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.success}</p>
            </Card>
            <Card className="bg-red-500/5 border-red-500/10 p-4 text-center">
              <p className="text-sm text-red-400 uppercase tracking-wider mb-1">Falhas</p>
              <p className="text-2xl font-bold text-red-400">{stats.fail}</p>
            </Card>
          </div>

          {isRunning && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso da Simulação</span>
                <span>{Math.round((stats.total / 50) * 100)}%</span>
              </div>
              <Progress value={(stats.total / 50) * 100} className="h-1.5" />
            </div>
          )}

          <ScrollArea className="h-[300px] rounded-md border border-white/5 bg-black/20 p-4">
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                  <p>Aguardando início da simulação em massa...</p>
                </div>
              ) : (
                results.map((res: any) => (
                  <div key={res.id} className="flex items-center justify-between p-2 rounded bg-card/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      {res.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{res.scenario_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Latência: {res.duration_ms}ms | Status: {res.response_status}
                        </p>
                      </div>
                    </div>
                    <Badge variant={res.success ? "outline" : "destructive"} className="text-[10px]">
                      {res.success ? "VALIDADO" : "FALHOU"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}