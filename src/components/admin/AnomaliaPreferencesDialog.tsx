import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BellOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  useAnomaliaPreferences,
  type Severidade,
} from "@/hooks/useAnomaliaPreferences";

const TIPOS = [
  { value: "movimentacao_outlier", label: "Movimentação atípica" },
  { value: "pagamento_duplicado", label: "Pagamento duplicado" },
  { value: "conta_pagar_alta", label: "Conta a pagar alta" },
  { value: "conciliacao_atrasada", label: "Conciliação atrasada" },
  { value: "mudanca_regime_brusca", label: "Variação brusca de regime" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AnomaliaPreferencesDialog({ open, onOpenChange }: Props) {
  const { preferences, update } = useAnomaliaPreferences();
  const [enabled, setEnabled] = useState(true);
  const [minSev, setMinSev] = useState<Severidade>("critica");
  const [silenciarAte, setSilenciarAte] = useState<string | null>(null);
  const [ccs, setCcs] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ["centros-custo-min"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centros_custo")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; nome: string }>;
    },
  });

  useEffect(() => {
    if (preferences && open) {
      setEnabled(preferences.toast_enabled);
      setMinSev(preferences.toast_min_severidade);
      setSilenciarAte(preferences.silenciar_ate);
      setCcs(preferences.centros_custo_silenciados ?? []);
      setTipos(preferences.tipos_silenciados ?? []);
    }
  }, [preferences, open]);

  const silenciarPor = (horas: number) => {
    const ate = new Date(Date.now() + horas * 3600 * 1000).toISOString();
    setSilenciarAte(ate);
  };

  const ativo =
    silenciarAte && new Date(silenciarAte) > new Date()
      ? new Date(silenciarAte)
      : null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        toast_enabled: enabled,
        toast_min_severidade: minSev,
        silenciar_ate: silenciarAte,
        centros_custo_silenciados: ccs,
        tipos_silenciados: tipos,
      });
      toast.success("Preferências salvas");
      onOpenChange(false);
    } catch (e) {
      toast.error("Erro ao salvar preferências");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            Preferências de alerta de anomalias
          </DialogTitle>
          <DialogDescription>
            Controle quando você recebe toasts de novas anomalias detectadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="toast-enabled" className="flex flex-col gap-0.5">
              <span>Receber toasts de novas anomalias</span>
              <span className="text-xs text-muted-foreground font-normal">
                Aplica a todas as severidades acima do limiar.
              </span>
            </Label>
            <Switch
              id="toast-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Severidade mínima</Label>
            <Select
              value={minSev}
              onValueChange={(v) => setMinSev(v as Severidade)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critica">Apenas crítica</SelectItem>
                <SelectItem value="alta">Alta e crítica</SelectItem>
                <SelectItem value="media">Média ou superior</SelectItem>
                <SelectItem value="baixa">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label className="flex flex-col gap-0.5">
                <span>Soneca temporária</span>
                {ativo ? (
                  <span className="text-xs text-warning font-normal">
                    Silenciado até{" "}
                    {ativo.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-normal">
                    Sem soneca ativa
                  </span>
                )}
              </Label>
              {ativo && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSilenciarAte(null)}
                >
                  Reativar agora
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => silenciarPor(1)}
              >
                Silenciar 1h
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => silenciarPor(8)}
              >
                Silenciar 8h
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => silenciarPor(24)}
              >
                Silenciar 24h
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Centros de custo silenciados</Label>
            {ccs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ccs.map((id) => {
                  const cc = centrosCusto.find((c) => c.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {cc?.nome ?? id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() => setCcs(ccs.filter((x) => x !== id))}
                        className="hover:text-destructive"
                        aria-label="Remover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <ScrollArea className="h-32 rounded-md border p-2">
              <div className="space-y-1.5">
                {centrosCusto.map((cc) => (
                  <label
                    key={cc.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={ccs.includes(cc.id)}
                      onChange={(e) =>
                        setCcs(
                          e.target.checked
                            ? [...ccs, cc.id]
                            : ccs.filter((x) => x !== cc.id),
                        )
                      }
                    />
                    {cc.nome}
                  </label>
                ))}
                {centrosCusto.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum centro de custo ativo.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-1.5">
            <Label>Tipos de anomalia silenciados</Label>
            <div className="space-y-1.5 rounded-md border p-2">
              {TIPOS.map((t) => (
                <label
                  key={t.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={tipos.includes(t.value)}
                    onChange={(e) =>
                      setTipos(
                        e.target.checked
                          ? [...tipos, t.value]
                          : tipos.filter((x) => x !== t.value),
                      )
                    }
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            Salvar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
