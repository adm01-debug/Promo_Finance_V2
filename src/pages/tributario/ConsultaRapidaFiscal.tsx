import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { ConsultaUFTab } from './consulta-rapida/ConsultaUFTab';
import { ConsultaCnaeTab } from './consulta-rapida/ConsultaCnaeTab';
import { ConsultaNcmTab } from './consulta-rapida/ConsultaNcmTab';

/**
 * Consulta Rápida Fiscal — front-end da edge function `consulta-tributaria`.
 * Três recursos (UF, CNAE, NCM) com sinalização explícita de fallback.
 */
export default function ConsultaRapidaFiscal() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 sm:p-6">
          <PageHeader
            title="Consulta Rápida Fiscal"
            description="Alíquotas e regras tributárias por UF, CNAE e NCM, com fallback hierárquico sinalizado."
            icon={Search}
          />

          <Tabs defaultValue="uf" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="uf">UF</TabsTrigger>
              <TabsTrigger value="cnae">CNAE</TabsTrigger>
              <TabsTrigger value="ncm">NCM</TabsTrigger>
            </TabsList>
            <TabsContent value="uf"><ConsultaUFTab /></TabsContent>
            <TabsContent value="cnae"><ConsultaCnaeTab /></TabsContent>
            <TabsContent value="ncm"><ConsultaNcmTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
