import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { Building2, Grid3X3, Wallet, ArrowLeftRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsolidacaoMultiCNPJ } from '@/components/tesouraria/ConsolidacaoMultiCNPJ';
import { MatrizCNPJBanco } from '@/components/tesouraria/MatrizCNPJBanco';
import { TesourariaCentralizada } from '@/components/tesouraria/TesourariaCentralizada';
import { FluxoInterEmpresas } from '@/components/tesouraria/FluxoInterEmpresas';
import { TransferenciaDialog } from '@/components/financeiro/TransferenciaDialog';

export default function Tesouraria() {
  const [activeTab, setActiveTab] = useState('consolidacao');
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Tesouraria Multi-CNPJ
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão consolidada de 3 CNPJs × 12+ contas bancárias
            </p>
          </div>
          <Button onClick={() => setIsTransferOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4" />
            Nova Transferência
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="consolidacao" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Consolidação</span>
            </TabsTrigger>
            <TabsTrigger value="matriz" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Matriz</span>
            </TabsTrigger>
            <TabsTrigger value="tesouraria" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Tesouraria</span>
            </TabsTrigger>
            <TabsTrigger value="intercompany" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Inter-Empresas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consolidacao">
            <ConsolidacaoMultiCNPJ />
          </TabsContent>
          <TabsContent value="matriz">
            <MatrizCNPJBanco />
          </TabsContent>
          <TabsContent value="tesouraria">
            <TesourariaCentralizada />
          </TabsContent>
          <TabsContent value="intercompany">
            <FluxoInterEmpresas />
          </TabsContent>
        </Tabs>
      </div>

      <TransferenciaDialog open={isTransferOpen} onOpenChange={setIsTransferOpen} />
    </MainLayout>
  );
}
