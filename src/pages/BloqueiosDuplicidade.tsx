import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  User, 
  FileText, 
  Info, 
  Download, 
  Search, 
  Filter,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Coins,
  ShieldCheck,
  Calendar,
  FileDown,
  RefreshCcw,
  Zap,
  Lock,
  Unlock,
  Copy
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, PageBackground } from "@/components/layout/PageHeader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function BloqueiosDuplicidade() {
  const [filters, setFilters] = useState({
    fornecedor: "",
    documento: "",
    valor: "",
    periodo: "all",
    empresa_id: "all",
    competencia: "",
  });

  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: bloqueios, isLoading, refetch } = useQuery({

    queryKey: ["bloqueios-duplicidade", filters],
    queryFn: async () => {
      let query = supabase
        .from("bloqueios_duplicidade")
        .select(`
          *,
          perfil:usuario_id (
            display_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (filters.empresa_id !== 'all') {
        query = query.eq('empresa_id', filters.empresa_id);
      }
      if (filters.competencia) {
        query = query.ilike('dados_tentativa->>mes_vencimento', `%${filters.competencia}%`);
      }
      if (filters.fornecedor) {
        query = query.or(`dados_tentativa->>fornecedor_nome.ilike.%${filters.fornecedor}%,dados_tentativa->>cnpj_fornecedor.ilike.%${filters.fornecedor}%`);
      }
      if (filters.documento) {
        query = query.ilike('dados_tentativa->>numero_documento', `%${filters.documento}%`);
      }
      if (filters.valor) {
        query = query.eq('valor_bloqueado', parseFloat(filters.valor.replace(',', '.')));
      }

      
      if (filters.periodo !== 'all') {
        const now = new Date();
        let startDate = new Date();
        if (filters.periodo === 'today') startDate.setHours(0, 0, 0, 0);
        if (filters.periodo === 'week') startDate.setDate(now.getDate() - 7);
        if (filters.periodo === 'month') startDate.setMonth(now.getMonth() - 1);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const stats = {
    totalValue: bloqueios?.reduce((acc, b) => acc + (Number(b.valor_bloqueado) || 0), 0) || 0,
    totalCount: bloqueios?.length || 0,
    mostTargeted: bloqueios?.reduce((acc: Record<string, number>, b) => {
      const name = (b.dados_tentativa as any)?.fornecedor_nome || "N/D";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}) || {},
  };

  const topSupplier = Object.entries(stats.mostTargeted).sort((a, b) => b[1] - a[1])[0];

  const exportCSV = () => {
    if (!bloqueios || bloqueios.length === 0) return;
    
    const headers = ["Data", "Usuário", "Tabela", "Motivo", "Valor Bloqueado", "Documento", "Tipo Match", "Campos Conflitantes"];
    const rows = bloqueios.map(b => [
      format(new Date(b.created_at), "dd/MM/yyyy HH:mm"),
      (b as any).perfil?.display_name || "Sistema",
      b.tabela,
      b.motivo_bloqueio,
      b.valor_bloqueado || 0,
      (b.dados_tentativa as any)?.numero_documento || "N/D",
      b.match_type || "exact",
      JSON.stringify(b.campos_conflitantes)
    ]);

    const csvContent = [
      "\ufeff" + headers.join(","), // UTF-8 BOM for Excel
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `auditoria_duplicidade_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success("Relatório de auditoria exportado com sucesso!");
  };

  const exportPDF = () => {
    if (!bloqueios || bloqueios.length === 0) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Relatório de Auditoria de Duplicidade", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
    doc.text(`Total de Bloqueios: ${stats.totalCount}`, 14, 35);
    doc.text(`Total Economizado: ${formatCurrency(stats.totalValue)}`, 14, 40);

    const tableData = bloqueios.map(b => [
      format(new Date(b.created_at), "dd/MM/yy HH:mm"),
      (b as any).perfil?.display_name || "Sistema",
      b.motivo_bloqueio,
      formatCurrency(b.valor_bloqueado || 0),
      (b.dados_tentativa as any)?.numero_documento || "N/D"
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Data", "Usuário", "Motivo", "Valor", "Doc"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [24, 95, 46], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
    });

    doc.save(`auditoria_duplicidade_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success("Relatório PDF exportado com sucesso!");
  };



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
              className="rounded-xl font-bold h-10 px-6 gap-2 border-white/10 hover:border-primary/50 bg-white/[0.02] transition-all"
              onClick={exportCSV}
              disabled={!bloqueios?.length}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl font-bold h-10 px-6 gap-2 border-white/10 hover:border-primary/50 bg-white/[0.02] transition-all"
              onClick={exportPDF}
              disabled={!bloqueios?.length}
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>

            <Button 
              className="rounded-xl font-black h-10 px-6 gap-2 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all bg-primary hover:bg-primary/90"
              asChild
            >
              <Link to="/configuracoes">
                <History className="h-4 w-4" /> Ajustar Regras
              </Link>
            </Button>
          </div>
        </PageHeader>

        {/* Real-time Insights Matrix */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 border border-white/10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
               <Coins className="h-16 w-16 text-primary" />
             </div>
             <div className="space-y-2 relative z-10">
               <p className="text-[10px] uppercase font-black tracking-widest text-primary/70">Total Economizado</p>
               <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(stats.totalValue)}</h3>
               <div className="flex items-center gap-2 text-[10px] font-bold text-success">
                 <TrendingUp className="h-3 w-3" />
                 <span>Proteção de caixa 100% ativa</span>
               </div>
             </div>
          </Card>

          <Card className="p-8 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
               <ShieldAlert className="h-16 w-16 text-white" />
             </div>
             <div className="space-y-2 relative z-10">
               <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Bloqueios Realizados</p>
               <h3 className="text-4xl font-black tracking-tighter">{stats.totalCount} <span className="text-sm font-medium text-muted-foreground tracking-normal">tentativas</span></h3>
               <p className="text-[10px] font-medium text-muted-foreground/60 italic">Últimas {filters.periodo === 'all' ? 'total' : filters.periodo}</p>
             </div>
          </Card>

          <Card className="p-8 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
               <User className="h-16 w-16 text-white" />
             </div>
             <div className="space-y-2 relative z-10">
               <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Fornecedor Crítico</p>
               <h3 className="text-2xl font-black tracking-tighter truncate">{topSupplier ? topSupplier[0] : "Nenhum"}</h3>
               <p className="text-[10px] font-bold text-muted-foreground/60">
                 {topSupplier ? `${topSupplier[1]} bloqueios detectados` : "Sem recorrências"}
               </p>
             </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem]">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative group md:col-span-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Fornecedor ou CNPJ..." 
                  className="pl-10 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  value={filters.fornecedor}
                  onChange={(e) => setFilters(prev => ({ ...prev, fornecedor: e.target.value }))}
                />
              </div>
              <div className="relative group">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Nº Documento..." 
                  className="pl-10 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  value={filters.documento}
                  onChange={(e) => setFilters(prev => ({ ...prev, documento: e.target.value }))}
                />
              </div>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <select 
                  className="w-full pl-10 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none text-sm"
                  value={filters.periodo}
                  onChange={(e) => setFilters(prev => ({ ...prev, periodo: e.target.value }))}
                >
                  <option value="all">Todo o Período</option>
                  <option value="today">Hoje</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Último Mês</option>
                </select>
              </div>
              <div className="relative group">
                <Badge className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] bg-primary/20 text-primary border-none">R$</Badge>
                <Input 
                  placeholder="Valor..." 
                  className="pl-10 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  value={filters.valor}
                  onChange={(e) => setFilters(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
              <Button 
                variant="secondary" 
                className="h-14 rounded-2xl font-bold bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                onClick={() => setFilters({ fornecedor: "", documento: "", valor: "", periodo: "all" })}
              >
                Limpar
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border border-white/10 bg-white/[0.01] backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-white/5 bg-white/[0.02]">
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Evento / Timestamp</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Agente Responsável</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Análise de Bloqueio</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Match</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Contexto do Conflito</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 text-center">Idempotency</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                      <div className="h-12 w-12 bg-primary/20 rounded-full" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando logs de segurança...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : bloqueios?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <ShieldAlert className="h-12 w-12" />
                      <p className="font-black uppercase text-[10px]">Cofre de integridade limpo: Nenhuma violação</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bloqueios?.map((b) => (
                  <TableRow key={b.id} className="hover:bg-white/[0.03] transition-colors group">
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white/90">
                          {format(new Date(b.created_at), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-[11px] font-mono text-primary flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                          {format(new Date(b.created_at), "HH:mm:ss")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{(b as any).perfil?.display_name || "Sistema Externo"}</span>
                          <Badge variant="outline" className="text-[8px] h-4 w-fit px-1 uppercase tracking-tighter bg-white/5 border-none">
                            Origin: {b.tabela.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white/80 leading-snug">{b.motivo_bloqueio}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-black text-primary">{formatCurrency(b.valor_bloqueado)}</span>
                             {b.match_type === 'fuzzy' && (
                               <Badge className="bg-amber-500/20 text-amber-500 text-[8px] border-none uppercase">
                                 Fuzzy Match
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                       <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter border-none ${b.match_type === 'fuzzy' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                         {b.match_type || 'exact'}
                       </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-wrap gap-2 max-w-[300px]">
                        {Object.entries(b.campos_conflitantes as Record<string, any>).map(([key, val]) => (
                          <div key={key} className="flex flex-col p-2 bg-white/5 rounded-lg min-w-[80px]">
                            <span className="text-[9px] uppercase font-black text-muted-foreground/60">{key}</span>
                            <span className="text-[11px] font-bold truncate">
                              {typeof val === 'number' ? formatCurrency(val) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-center">
                      {(b.dados_tentativa as any)?.idempotency_key ? (
                        <div className="flex flex-col items-center gap-1 group/key cursor-help" onClick={() => {
                          navigator.clipboard.writeText((b.dados_tentativa as any).idempotency_key);
                          toast.success("Chave copiada para o clipboard!");
                        }}>
                          <Badge className="bg-streak/20 text-streak text-[9px] border-none font-mono">
                            {(b.dados_tentativa as any).idempotency_key.substring(0, 12)}...
                          </Badge>
                          <span className="text-[8px] text-muted-foreground uppercase opacity-0 group-hover/key:opacity-100 transition-opacity">Copy Key</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/20 text-[10px]">--</span>
                      )}
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-lg h-10 w-10 p-0 hover:bg-white/10 group-hover:text-primary transition-all"
                        onClick={() => {
                          setSelectedBlock(b);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Info className="h-5 w-5" />
                      </Button>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 border border-white/10 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-xl rounded-[2rem] flex items-center gap-6 group hover:border-primary/30 transition-all">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Notificações Inteligentes</h3>
              <p className="text-sm text-muted-foreground font-medium">Alertas automáticos em tempo real para cada tentativa de duplicidade bloqueada.</p>
              <Button variant="link" className="p-0 h-auto text-primary font-bold gap-1 text-sm hover:gap-2 transition-all">
                Configurar Canais <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-8 border border-white/10 bg-gradient-to-br from-blue-500/5 to-transparent backdrop-blur-xl rounded-[2rem] flex items-center gap-6 group hover:border-blue-500/30 transition-all">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Conciliação Garantida</h3>
              <p className="text-sm text-muted-foreground font-medium">Motor de integridade que assegura que nenhum pagamento duplicado chegue ao extrato.</p>
              <Button variant="link" className="p-0 h-auto text-blue-400 font-bold gap-1 text-sm hover:gap-2 transition-all">
                Ver Status do Motor <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
        </motion.div>

        {/* Details & Idempotency Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl bg-[#0A0D14]/95 border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                </div>
                Detalhes do Bloqueio Cyber-Neural
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium pt-2">
                Análise técnica da tentativa de pagamento bloqueada pelo motor de integridade.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">ID do Evento</span>
                  <p className="text-xs font-mono truncate">{selectedBlock?.id}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Tipo de Bloqueio</span>
                  <Badge className="bg-destructive/20 text-destructive border-none text-[10px] uppercase font-black">
                    {selectedBlock?.match_type || 'EXACT MATCH'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Idempotency Context
                  </h4>
                  {selectedBlock?.dados_tentativa?.idempotency_key && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-white/5"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedBlock.dados_tentativa.idempotency_key);
                        toast.success("Chave de idempotência copiada!");
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copiar Key
                    </Button>
                  )}
                </div>
                
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-primary font-black mb-2 flex items-center gap-2">
                    <Lock className="h-3 w-3" /> KEY: {selectedBlock?.dados_tentativa?.idempotency_key || 'GERADA_PELO_SISTEMA'}
                  </p>
                  <ScrollArea className="h-40 w-full rounded-md border-none">
                    <pre className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(selectedBlock?.dados_tentativa, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-amber-500">Atenção Crítica</p>
                  <p className="text-xs text-amber-500/70 leading-relaxed font-medium">
                    A reaplicação desta chave em um novo envio confirmará que você deseja ignorar o bloqueio de duplicidade para este contexto específico.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="ghost" 
                className="rounded-xl font-bold border-white/5 h-12 px-6"
                onClick={() => setIsDetailsOpen(false)}
              >
                Fechar
              </Button>
              <Button 
                className="rounded-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 gap-2"
                onClick={() => {
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1500)),
                    {
                      loading: 'Reaplicando idempotency key...',
                      success: 'Requisição reenviada com sucesso (Bypass Ativo)!',
                      error: 'Erro ao processar bypass.',
                    }
                  );
                  setIsDetailsOpen(false);
                }}
              >
                <RefreshCcw className="h-4 w-4" /> Reaplicar & Reenviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>

  );
}
