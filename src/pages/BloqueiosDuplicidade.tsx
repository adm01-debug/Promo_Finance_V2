import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, PageBackground } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, CheckCircle2, Download, FileDown, History, ShieldCheck } from "lucide-react";
import { useBloqueiosData } from "./bloqueios-duplicidade/useBloqueiosData";
import { exportCSV, exportPDF } from "./bloqueios-duplicidade/bloqueiosExport";
import { StatsCards } from "./bloqueios-duplicidade/StatsCards";
import { FiltersBar } from "./bloqueios-duplicidade/FiltersBar";
import { BloqueiosTable } from "./bloqueios-duplicidade/BloqueiosTable";
import { DetailsDialog } from "./bloqueios-duplicidade/DetailsDialog";
import { containerVariants, itemVariants, emptyFilters, type BloqueiosFilters } from "./bloqueios-duplicidade/types";

export default function BloqueiosDuplicidade() {
  const [filters, setFilters] = useState<BloqueiosFilters>(emptyFilters);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { bloqueiosQuery, empresasQuery } = useBloqueiosData(filters);
  const { data: bloqueios, isLoading, refetch } = bloqueiosQuery;
  const { data: empresas } = empresasQuery;

  const totalValue = bloqueios?.reduce((acc, b) => acc + (Number(b.valor_bloqueado) || 0), 0) || 0;
  const totalCount = bloqueios?.length || 0;
  const mostTargeted =
    bloqueios?.reduce((acc: Record<string, number>, b) => {
      const name = (b.dados_tentativa as { fornecedor_nome?: string } | null)?.fornecedor_nome || "N/D";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}) || {};
  const topSupplier = Object.entries(mostTargeted).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined;

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto p-6 relative z-10 space-y-8 pb-20"
        >
          <PageHeader
            title="Cofre de Integridade"
            subtitle="Monitoramento cyber-neural de duplicidades e tentativas de pagamento redundantes bloqueadas pelo sistema."
            badge="Inteligência Anti-Fraude 10/10"
            icon={ShieldCheck}
            gradientFrom="from-primary"
            gradientVia="via-primary/80"
            gradientTo="to-indigo-500"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl font-bold h-10 px-6 gap-2 border-border hover:border-primary/50 bg-card/[0.02]"
                onClick={() => exportCSV(bloqueios)}
                disabled={!bloqueios?.length}
              >
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-bold h-10 px-6 gap-2 border-border hover:border-primary/50 bg-card/[0.02]"
                onClick={() => exportPDF(bloqueios, totalCount, totalValue)}
                disabled={!bloqueios?.length}
              >
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button
                className="rounded-xl font-black h-10 px-6 gap-2 shadow-2xl shadow-primary/30 hover:shadow-primary/50 bg-primary hover:bg-primary/90"
                asChild
              >
                <Link to="/configuracoes">
                  <History className="h-4 w-4" /> Ajustar Regras
                </Link>
              </Button>
            </div>
          </PageHeader>

          <StatsCards totalValue={totalValue} totalCount={totalCount} periodo={filters.periodo} topSupplier={topSupplier} />

          <FiltersBar
            filters={filters}
            setFilters={setFilters}
            onReset={() => setFilters(() => emptyFilters)}
            onRefetch={() => refetch()}
            empresas={empresas}
          />

          <BloqueiosTable
            bloqueios={bloqueios}
            isLoading={isLoading}
            onOpenDetails={(b) => {
              setSelectedBlock(b);
              setIsDetailsOpen(true);
            }}
          />

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 border border-border bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-xl rounded-[2rem] flex items-center gap-6 group hover:border-primary/30 transition-all">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Notificações Inteligentes</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  Alertas automáticos em tempo real para cada tentativa de duplicidade bloqueada.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary font-bold gap-1 text-sm hover:gap-2 transition-all">
                  Configurar Canais <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <Card className="p-8 border border-border bg-gradient-to-br from-blue-500/5 to-transparent backdrop-blur-xl rounded-[2rem] flex items-center gap-6 group hover:border-blue-500/30 transition-all">
              <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-8 w-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Conciliação Garantida</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  Motor de integridade que assegura que nenhum pagamento duplicado chegue ao extrato.
                </p>
                <Button variant="link" className="p-0 h-auto text-blue-400 font-bold gap-1 text-sm hover:gap-2 transition-all">
                  Ver Status do Motor <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        <DetailsDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} selectedBlock={selectedBlock} />
      </div>
    </MainLayout>
  );
}
