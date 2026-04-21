import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, AlertTriangle, History, BarChart3, ScrollText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { InsightsIAKpis } from '@/components/insights-ia/InsightsIAKpis';
import { AnomaliasDetectadasPanel } from '@/components/admin/AnomaliasDetectadasPanel';
import { ConciliacaoHistoricoTab } from '@/components/insights-ia/ConciliacaoHistoricoTab';
import { AprendizadoMetricasTab } from '@/components/insights-ia/AprendizadoMetricasTab';
import { AuditoriaDecisoesTab } from '@/components/insights-ia/AuditoriaDecisoesTab';

export default function InsightsIA() {
  const [tab, setTab] = useState('anomalias');

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Insights de IA</h1>
            <p className="text-sm text-muted-foreground">
              Anomalias detectadas, sugestões de conciliação, aprendizado e auditoria explicável
            </p>
          </div>
        </div>

        <InsightsIAKpis />

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="anomalias" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Anomalias</span>
            </TabsTrigger>
            <TabsTrigger value="conciliacao" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Conciliação IA</span>
            </TabsTrigger>
            <TabsTrigger value="aprendizado" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Aprendizado</span>
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-2">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">Auditoria XAI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anomalias">
            <AnomaliasDetectadasPanel />
          </TabsContent>

          <TabsContent value="conciliacao">
            <ConciliacaoHistoricoTab />
          </TabsContent>

          <TabsContent value="aprendizado">
            <AprendizadoMetricasTab />
          </TabsContent>

          <TabsContent value="auditoria">
            <AuditoriaDecisoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
