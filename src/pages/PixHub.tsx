import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { QrCode, LayoutDashboard, FileStack, ShieldCheck } from 'lucide-react';
import { PixDashboardRealtime } from '@/components/pix-hub/PixDashboardRealtime';
import { PixTemplates } from '@/components/pix-hub/PixTemplates';
import { AprovacaoRapidaMobile } from '@/components/pix-hub/AprovacaoRapidaMobile';

export default function PixHub() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <QrCode className="h-7 w-7 text-primary" />
            Central PIX
          </h1>
          <p className="text-muted-foreground mt-1">
            Dashboard em tempo real, templates e aprovação rápida para 50+ PIX/dia
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileStack className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="aprovacao" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Aprovação</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PixDashboardRealtime />
          </TabsContent>
          <TabsContent value="templates">
            <PixTemplates />
          </TabsContent>
          <TabsContent value="aprovacao">
            <AprovacaoRapidaMobile />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
