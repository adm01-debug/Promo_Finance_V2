import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory } from 'lucide-react';
import { IpiSimulador } from './IpiSimulador';
import { IssSimulador } from './IssSimulador';
import { TabelasConsulta } from './TabelasConsulta';

export default function IpiIss() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="IPI e ISS"
            subtitle="Simuladores de IPI (TIPI) e de ISS com competência municipal e retenções na fonte."
            badge="Etapa D"
            icon={Factory}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-success"
          />
          <Tabs defaultValue="ipi" className="space-y-6">
            <TabsList>
              <TabsTrigger value="ipi">IPI</TabsTrigger>
              <TabsTrigger value="iss">ISS e retenções</TabsTrigger>
              <TabsTrigger value="tabelas">Tabelas</TabsTrigger>
            </TabsList>
            <TabsContent value="ipi">
              <IpiSimulador />
            </TabsContent>
            <TabsContent value="iss">
              <IssSimulador />
            </TabsContent>
            <TabsContent value="tabelas">
              <TabelasConsulta />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
