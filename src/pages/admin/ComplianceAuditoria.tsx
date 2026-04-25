import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersistedState } from "@/lib/persisted-ui-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Banknote, Receipt, Activity, ClipboardCheck, Package, Hash } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ComplianceKpis } from "@/components/compliance/ComplianceKpis";
import { TrilhaFinanceiraTab } from "@/components/compliance/TrilhaFinanceiraTab";
import { TrilhaTributariaTab } from "@/components/compliance/TrilhaTributariaTab";
import { TrilhaSistemaTab } from "@/components/compliance/TrilhaSistemaTab";
import { ConformidadeFiscalTab } from "@/components/compliance/ConformidadeFiscalTab";
import { EvidenciasTab } from "@/components/compliance/EvidenciasTab";
import { VerificarIntegridadeTab } from "@/components/compliance/VerificarIntegridadeTab";
import { useRealtimeAuditToasts } from "@/hooks/useRealtimeAuditToasts";

export default function ComplianceAuditoria() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = usePersistedState<string>("compliance-auditoria:tab", "financeira");
  // URL ?tab=… vence sobre o último valor persistido (ex.: clique em toast realtime).
  const urlTab = searchParams.get("tab");
  useEffect(() => {
    if (urlTab && urlTab !== tab) setTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

  // Stream realtime audit toasts with deep-link to the right trilha
  useRealtimeAuditToasts();




  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Compliance & Auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Trilhas de auditoria financeira, tributária e de sistema · pacotes de evidências exportáveis
            </p>
          </div>
        </div>

        <ComplianceKpis />

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="financeira" className="gap-2">
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">Financeira</span>
            </TabsTrigger>
            <TabsTrigger value="tributaria" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Tributária</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="conformidade" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Conformidade</span>
            </TabsTrigger>
            <TabsTrigger value="evidencias" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Evidências</span>
            </TabsTrigger>
            <TabsTrigger value="verificar" className="gap-2">
              <Hash className="h-4 w-4" />
              <span className="hidden sm:inline">Integridade</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financeira"><TrilhaFinanceiraTab /></TabsContent>
          <TabsContent value="tributaria"><TrilhaTributariaTab /></TabsContent>
          <TabsContent value="sistema"><TrilhaSistemaTab /></TabsContent>
          <TabsContent value="conformidade"><ConformidadeFiscalTab /></TabsContent>
          <TabsContent value="evidencias"><EvidenciasTab /></TabsContent>
          <TabsContent value="verificar"><VerificarIntegridadeTab /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
