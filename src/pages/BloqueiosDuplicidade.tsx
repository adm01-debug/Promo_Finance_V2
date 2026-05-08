import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, User, Calendar, FileText, Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BloqueiosDuplicidade() {
  const { data: bloqueios, isLoading } = useQuery({
    queryKey: ["bloqueios-duplicidade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bloqueios_duplicidade")
        .select(`
          *,
          perfil:usuario_id (
            display_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">
            Trilha de <span className="text-primary">Auditoria Anti-Duplicidade</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento em tempo real de tentativas de pagamentos duplicados e bloqueios preventivos.
          </p>
        </div>

        <Card className="border-none bg-background/50 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-white/5">
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Data/Hora</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Usuário/Origem</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Motivo do Bloqueio</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Campos Conflitantes</TableHead>
                <TableHead className="p-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Detalhes da Tentativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">Carregando auditoria...</TableCell>
                </TableRow>
              ) : bloqueios?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <ShieldAlert className="h-12 w-12" />
                      <p className="font-black uppercase text-[10px]">Nenhuma tentativa de duplicidade detectada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bloqueios?.map((b) => (
                  <TableRow key={b.id} className="hover:bg-white/[0.02] border-b border-white/5 transition-colors">
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{format(new Date(b.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(b.created_at), "eeee", { locale: ptBR })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{(b as any).perfil?.display_name || "Sistema / API"}</span>
                          <Badge variant="outline" className="text-[8px] h-4 w-fit px-1 uppercase tracking-tighter">
                            {b.tabela === 'contas_pagar' ? 'Contas a Pagar' : 'Fretes'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-start gap-2 max-w-[300px]">
                        <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-sm font-medium leading-relaxed">{b.motivo_bloqueio}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(b.campos_conflitantes as Record<string, any>).map(([key, val]) => (
                          <Badge key={key} variant="secondary" className="bg-white/5 hover:bg-white/10 text-[10px] border-none">
                            <span className="opacity-50 mr-1 uppercase">{key}:</span>
                            {typeof val === 'number' ? formatCurrency(val) : String(val)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>Doc: {b.dados_tentativa?.numero_documento || 'N/D'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{b.dados_tentativa?.descricao || 'Sem descrição'}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </MainLayout>
  );
}
