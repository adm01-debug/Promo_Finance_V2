import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, User, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { itemVariants } from "./types";

interface BloqueiosTableProps {
  bloqueios: any[] | undefined;
  isLoading: boolean;
  onOpenDetails: (b: any) => void;
}

export function BloqueiosTable({ bloqueios, isLoading, onOpenDetails }: BloqueiosTableProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-border bg-card/[0.01] backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-white/5 bg-card/[0.02]">
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
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-primary/20 rounded-full" />
                    <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando logs de segurança...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : bloqueios?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <ShieldAlert className="h-12 w-12" />
                    <p className="font-black uppercase text-[10px]">Cofre de integridade limpo: Nenhuma violação</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              bloqueios?.map((b) => (
                <TableRow key={b.id} className="hover:bg-card/[0.03] transition-colors group">
                  <TableCell className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground/90">
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
                        <span className="font-bold text-sm">{b.perfil?.display_name || "Sistema Externo"}</span>
                        <Badge variant="outline" className="text-[8px] h-4 w-fit px-1 uppercase tracking-tighter bg-card/5 border-none">
                          Origin: {b.tabela.replace("_", " ")}
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
                        <p className="text-sm font-bold text-foreground/80 leading-snug">{b.motivo_bloqueio}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-primary">{formatCurrency(b.valor_bloqueado)}</span>
                          {b.match_type === "fuzzy" && (
                            <Badge className="bg-amber-500/20 text-amber-500 text-[8px] border-none uppercase">Fuzzy Match</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase tracking-tighter border-none ${
                        b.match_type === "fuzzy" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {b.match_type || "exact"}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-6">
                    <div className="flex flex-wrap gap-2 max-w-[300px]">
                      {Object.entries((b.campos_conflitantes as Record<string, any>) || {}).map(([key, val]) => (
                        <div key={key} className="flex flex-col p-2 bg-card/5 rounded-lg min-w-[80px]">
                          <span className="text-[9px] uppercase font-black text-muted-foreground/60">{key}</span>
                          <span className="text-[11px] font-bold truncate">
                            {typeof val === "number" ? formatCurrency(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="p-6 text-center">
                    {b.dados_tentativa?.idempotency_key ? (
                      <div
                        className="flex flex-col items-center gap-1 group/key cursor-help"
                        onClick={() => {
                          navigator.clipboard.writeText(b.dados_tentativa.idempotency_key);
                          toast.success("Chave copiada para o clipboard!");
                        }}
                      >
                        <Badge className="bg-streak/20 text-streak text-[9px] border-none font-mono">
                          {b.dados_tentativa.idempotency_key.substring(0, 12)}...
                        </Badge>
                        <span className="text-[8px] text-muted-foreground uppercase opacity-0 group-hover/key:opacity-100 transition-opacity">
                          Copy Key
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/20 text-[10px]">--</span>
                    )}
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-10 w-10 p-0 hover:bg-card/10 group-hover:text-primary transition-all"
                      onClick={() => onOpenDetails(b)}
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
  );
}
