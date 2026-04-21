import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { maskIp } from "@/lib/ip-mask";
import { useIpMaskPreference } from "@/hooks/useIpMaskPreference";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  registro: Record<string, unknown> | null;
}

function pretty(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

export function AuditDetailDialog({ open, onOpenChange, registro }: Props) {
  if (!registro) return null;
  const antes = (registro.payload_anterior ?? registro.dados_antigos ?? registro.dados_anteriores ?? registro.old_data) as Record<string, unknown> | null;
  const depois = (registro.payload_novo ?? registro.dados_novos ?? registro.new_data) as Record<string, unknown> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do registro</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Metadados</p>
              <dl className="grid grid-cols-2 gap-2">
                {Object.entries(registro)
                  .filter(([k]) => !["payload_anterior", "payload_novo", "dados_antigos", "dados_novos", "dados_anteriores", "old_data", "new_data"].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="border rounded px-2 py-1">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="font-mono text-xs truncate">{pretty(v)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
            {antes && (
              <div>
                <p className="font-semibold mb-1">Antes</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(antes, null, 2)}
                </pre>
              </div>
            )}
            {depois && (
              <div>
                <p className="font-semibold mb-1">Depois</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(depois, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
