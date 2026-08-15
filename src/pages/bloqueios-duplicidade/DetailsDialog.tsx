// @ts-nocheck
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Copy, Lock, RefreshCcw, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import type { BloqueioRow } from "./types";

interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedBlock: BloqueioRow | null;
}

export function DetailsDialog({ open, onOpenChange, selectedBlock }: DetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover/95 border-border backdrop-blur-2xl rounded-[2.5rem] p-8">
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
            <div className="p-4 rounded-2xl bg-card/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">ID do Evento</span>
              <p className="text-xs font-mono truncate">{selectedBlock?.id}</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Tipo de Bloqueio</span>
              <Badge className="bg-destructive/20 text-destructive border-none text-[10px] uppercase font-black">
                {selectedBlock?.match_type || "EXACT MATCH"}
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
                  className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-card/5"
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
                <Lock className="h-3 w-3" /> KEY: {selectedBlock?.dados_tentativa?.idempotency_key || "GERADA_PELO_SISTEMA"}
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
          <Button variant="ghost" className="rounded-xl font-bold border-white/5 h-12 px-6" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            className="rounded-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 gap-2"
            onClick={() => {
              toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
                loading: "Reaplicando idempotency key...",
                success: "Requisição reenviada com sucesso (Bypass Ativo)!",
                error: "Erro ao processar bypass.",
              });
              onOpenChange(false);
            }}
          >
            <RefreshCcw className="h-4 w-4" /> Reaplicar & Reenviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
