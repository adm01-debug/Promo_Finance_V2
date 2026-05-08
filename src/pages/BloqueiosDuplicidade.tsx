import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
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
  Bell
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { saveAs } from 'file-saver';

export default function BloqueiosDuplicidade() {
  const [filters, setFilters] = useState({
    fornecedor: "",
    documento: "",
    valor: "",
  });

  const { data: bloqueios, isLoading } = useQuery({
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

      if (filters.fornecedor) {
        query = query.or(`dados_tentativa->>fornecedor_nome.ilike.%${filters.fornecedor}%,dados_tentativa->>cnpj_fornecedor.ilike.%${filters.fornecedor}%`);
      }
      if (filters.documento) {
        query = query.ilike('dados_tentativa->>numero_documento', `%${filters.documento}%`);
      }
      if (filters.valor) {
        query = query.eq('dados_tentativa->>valor', filters.valor);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const exportCSV = () => {
    if (!bloqueios || bloqueios.length === 0) return;
    
    const headers = ["Data", "Usuário", "Tabela", "Motivo", "Valor Tentativa", "Documento", "Campos Conflitantes"];
    const rows = bloqueios.map(b => [
      format(new Date(b.created_at), "dd/MM/yyyy HH:mm"),
      (b as any).perfil?.display_name || "Sistema",
      b.tabela,
      b.motivo_bloqueio,
      (b.dados_tentativa as any)?.valor || 0,
      (b.dados_tentativa as any)?.numero_documento || "N/D",
      JSON.stringify(b.campos_conflitantes)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `bloqueios_duplicidade_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-[0.2em]">
              <ShieldAlert className="h-3 w-3" />
              Security Audit
            </div>
            <h1 className="text-5xl font-black tracking-tighter">
              Trilha de <span className="text-primary">Auditoria</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              Monitoramento rigoroso de integridade financeira e bloqueios de duplicidade em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl font-bold h-12 px-6 gap-2"
              onClick={exportCSV}
              disabled={!bloqueios?.length}
            >
              <Download className="h-5 w-5" /> Exportar Relatório
            </Button>
            <Button 
              className="rounded-xl font-black h-12 px-6 gap-2 shadow-xl shadow-primary/20"
              onClick={() => toast.info("Configurações de regras disponíveis no painel principal.")}
            >
              <Filter className="h-5 w-5" /> Regras Ativas
            </Button>
          </div>
        </div>

        {/* Filtros Inteligentes */}
        <Card className="p-6 border-none bg-background/50 backdrop-blur-xl ring-1 ring-white/10 rounded-[2rem]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Fornecedor ou CNPJ..." 
                className="pl-10 h-12 bg-white/5 border-none rounded-xl"
                value={filters.fornecedor}
                onChange={(e) => setFilters(prev => ({ ...prev, fornecedor: e.target.value }))}
              />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nº Documento..." 
                className="pl-10 h-12 bg-white/5 border-none rounded-xl"
                value={filters.documento}
                onChange={(e) => setFilters(prev => ({ ...prev, documento: e.target.value }))}
              />
            </div>
            <div className="relative">
              <Badge className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] bg-primary/20 text-primary">R$</Badge>
              <Input 
                placeholder="Valor Exato..." 
                className="pl-10 h-12 bg-white/5 border-none rounded-xl"
                value={filters.valor}
                onChange={(e) => setFilters(prev => ({ ...prev, valor: e.target.value }))}
              />
            </div>
            <Button 
              variant="secondary" 
              className="h-12 rounded-xl font-bold"
              onClick={() => setFilters({ fornecedor: "", documento: "", valor: "" })}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-white/5 bg-white/[0.02]">
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Evento / Timestamp</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Agente Responsável</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Análise de Bloqueio</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Contexto do Conflito</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Ações</TableHead>
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
                             {(b.dados_tentativa as any)?.idempotency_key && (
                               <Badge className="bg-streak/20 text-streak text-[8px] border-none uppercase">
                                 Idempotency Triggered
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
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
                    <TableCell className="p-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-lg h-10 w-10 p-0 hover:bg-white/10 group-hover:text-primary transition-all"
                        onClick={() => toast.info("Detalhes técnicos: " + JSON.stringify(b.dados_tentativa))}
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

        {/* Notificações Inteligentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 border-none bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl ring-1 ring-white/10 rounded-[2rem] flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Alertas Inteligentes</h3>
              <p className="text-sm text-muted-foreground">Notificações automáticas em tempo real para cada tentativa de duplicidade bloqueada.</p>
              <Button variant="link" className="p-0 h-auto text-primary font-bold gap-1 text-sm">
                Configurar Canais <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-8 border-none bg-gradient-to-br from-destructive/10 to-transparent backdrop-blur-xl ring-1 ring-white/10 rounded-[2rem] flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-destructive/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Score de Risco</h3>
              <p className="text-sm text-muted-foreground">Análise de comportamento de fornecedores reincidentes em tentativas de duplicidade.</p>
              <Button variant="link" className="p-0 h-auto text-destructive font-bold gap-1 text-sm">
                Ver Ranking de Risco <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
