import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegrasConciliacaoPanel } from "@/components/conciliacao/RegrasConciliacaoPanel";
import { Zap } from "lucide-react";

interface RegrasConciliacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegrasConciliacaoDialog({ open, onOpenChange }: RegrasConciliacaoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[2rem] border-primary/10 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-warning" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">Regras de Conciliação Inteligente</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Configure o mapeamento automático de descrições bancárias para seus registros financeiros.</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-8 pt-0">
          <RegrasConciliacaoPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
