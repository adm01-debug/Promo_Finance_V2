import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { QrCode, LayoutDashboard, FileStack, ShieldCheck, Download, Plus } from 'lucide-react';
import { PixDashboardRealtime } from '@/components/pix-hub/PixDashboardRealtime';
import { PixTemplates } from '@/components/pix-hub/PixTemplates';
import { AprovacaoRapidaMobile } from '@/components/pix-hub/AprovacaoRapidaMobile';
import { PixRecebimento } from '@/components/pix-hub/PixRecebimento';
import { Button } from '@/components/ui/button';
import { NovaCobrancaDialog } from '@/components/asaas/NovaCobrancaDialog';
import { useEmpresas } from '@/hooks/useFinancialData';

export default function PixHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const { data: empresas = [] } = useEmpresas();
  const firstEmpresaId = empresas?.[0]?.id;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <QrCode className="h-7 w-7 text-primary" />
              Central PIX
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Ecosystem 360°: Dashboard em tempo real, templates, split e recebimento instantâneo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4" /> Conciliação
            </Button>
            <Button onClick={() => setReceiveDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Receber via PIX
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="receber" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Recebimento</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileStack className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="aprovacao" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Aprovação</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PixDashboardRealtime />
          </TabsContent>
          <TabsContent value="receber" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PixRecebimento />
          </TabsContent>
          <TabsContent value="templates" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PixTemplates />
          </TabsContent>
          <TabsContent value="aprovacao" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AprovacaoRapidaMobile />
          </TabsContent>
        </Tabs>

        <NovaCobrancaDialog 
          open={receiveDialogOpen} 
          onOpenChange={setReceiveDialogOpen} 
          empresaId={firstEmpresaId} 
        />
      </div>
    </MainLayout>
  );
}
