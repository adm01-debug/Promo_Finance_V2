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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { BellOff, X, Clock, MousePointerClick, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useAnomaliaPreferences,
  type Severidade,
  type ToastAcoes,
  type DrawerAcoes,
  TOAST_DURACAO_MIN,
  TOAST_DURACAO_MAX,
  TOAST_DURACAO_DEFAULT,
} from "@/hooks/useAnomaliaPreferences";

const TIPOS = [
  { value: "movimentacao_outlier", label: "Movimentação atípica" },
  { value: "pagamento_duplicado", label: "Pagamento duplicado" },
  { value: "conta_pagar_alta", label: "Conta a pagar alta" },
  { value: "conciliacao_atrasada", label: "Conciliação atrasada" },
  { value: "mudanca_regime_brusca", label: "Variação brusca de regime" },
];

const SEVERIDADES: Array<{ value: Severidade; label: string; hint: string }> = [
  { value: "critica", label: "Crítica", hint: "Risco financeiro imediato" },
  { value: "alta", label: "Alta", hint: "Requer atenção em horas" },
  { value: "media", label: "Média", hint: "Anomalias relevantes" },
  { value: "baixa", label: "Baixa", hint: "Apenas informativas" },
];

const TOAST_ACOES_OPTIONS: Array<{
  key: keyof ToastAcoes;
  label: string;
  hint: string;
}> = [
  { key: "drill_down", label: "Drill-down", hint: "Abre o drawer lateral" },
  { key: "abrir_pagina", label: "Abrir página", hint: "Vai para a página completa" },
  { key: "copiar_id", label: "Copiar ID", hint: "Copia o ID da anomalia" },
  { key: "marcar_lida", label: "Marcar lida", hint: "Move para investigando" },
];

const DRAWER_ACOES_OPTIONS: Array<{
  key: keyof DrawerAcoes;
  label: string;
  hint: string;
}> = [
  {
    key: "abrir_entidade",
    label: "Abrir transação completa",
    hint: "Link para a entidade origem",
  },
  {
    key: "pagina_completa",
    label: "Página completa",
    hint: "Sai do drawer e abre /anomalia/:id",
  },
  { key: "copiar_id", label: "Copiar ID", hint: "Copia o ID da anomalia" },
  { key: "marcar_lida", label: "Marcar lida", hint: "Move para investigando" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AnomaliaPreferencesDialog({ open, onOpenChange }: Props) {
  const { preferences, update } = useAnomaliaPreferences();
  const [enabled, setEnabled] = useState(true);
  const [severidadesAtivas, setSeveridadesAtivas] = useState<Severidade[]>([
    "critica",
    "alta",
  ]);
  const [duracao, setDuracao] = useState<number>(TOAST_DURACAO_DEFAULT);
  const [toastAcoes, setToastAcoes] = useState<ToastAcoes>({
    drill_down: true,
    abrir_pagina: true,
    copiar_id: false,
    marcar_lida: false,
  });
  const [drawerAcoes, setDrawerAcoes] = useState<DrawerAcoes>({
    abrir_entidade: true,
    pagina_completa: true,
    copiar_id: false,
    marcar_lida: false,
  });
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
      setSeveridadesAtivas(
        preferences.toast_severidades_ativas?.length
          ? preferences.toast_severidades_ativas
          : ["critica", "alta"],
      );
      setDuracao(preferences.toast_duracao_segundos ?? TOAST_DURACAO_DEFAULT);
      setToastAcoes(preferences.toast_acoes);
      setDrawerAcoes(preferences.drawer_acoes);
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

  const toggleSeveridade = (sev: Severidade, on: boolean) => {
    setSeveridadesAtivas((prev) =>
      on ? Array.from(new Set([...prev, sev])) : prev.filter((s) => s !== sev),
    );
  };

  const handleSave = async () => {
    if (severidadesAtivas.length === 0) {
      toast.error("Selecione ao menos 1 severidade ou desative os toasts");
      return;
    }
    try {
      await update.mutateAsync({
        toast_enabled: enabled,
        toast_severidades_ativas: severidadesAtivas,
        toast_duracao_segundos: duracao,
        toast_acoes: toastAcoes,
        drawer_acoes: drawerAcoes,
        silenciar_ate: silenciarAte,
        centros_custo_silenciados: ccs,
        tipos_silenciados: tipos,
      });
      toast.success("Preferências salvas");
      onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao salvar preferências",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            Preferências de alerta de anomalias
          </DialogTitle>
          <DialogDescription>
            Controle quais severidades disparam toast, por quanto tempo e quais
            ações aparecem no toast e no drawer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Master switch */}
          <div className="flex items-center justify-between">
            <Label htmlFor="toast-enabled" className="flex flex-col gap-0.5">
              <span>Receber toasts de novas anomalias</span>
              <span className="text-xs text-muted-foreground font-normal">
                Master switch — desativa todos os toasts realtime.
              </span>
            </Label>
            <Switch
              id="toast-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <Separator />

          {/* Severidades que disparam toast */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Severidades que disparam toast
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERIDADES.map((sev) => {
                const checked = severidadesAtivas.includes(sev.value);
                return (
                  <label
                    key={sev.value}
                    className={`flex items-start gap-2 rounded-md border p-2.5 cursor-pointer transition-colors ${
                      checked ? "bg-primary/5 border-primary/40" : ""
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggleSeveridade(sev.value, !!v)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{sev.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {sev.hint}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {severidadesAtivas.length === 0 && (
              <p className="text-xs text-destructive">
                Selecione ao menos 1 severidade.
              </p>
            )}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duração do toast
              </Label>
              <Badge variant="secondary" className="font-mono">
                {duracao}s
              </Badge>
            </div>
            <Slider
              value={[duracao]}
              min={TOAST_DURACAO_MIN}
              max={TOAST_DURACAO_MAX}
              step={1}
              onValueChange={(v) => setDuracao(v[0] ?? TOAST_DURACAO_DEFAULT)}
            />
            <p className="text-xs text-muted-foreground">
              Entre {TOAST_DURACAO_MIN}s e {TOAST_DURACAO_MAX}s. Padrão:{" "}
              {TOAST_DURACAO_DEFAULT}s.
            </p>
          </div>

          <Separator />

          {/* Ações do toast */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Ações no toast
            </Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {TOAST_ACOES_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-start gap-2 rounded-md border p-2.5 cursor-pointer"
                >
                  <Checkbox
                    checked={toastAcoes[opt.key]}
                    onCheckedChange={(v) =>
                      setToastAcoes({ ...toastAcoes, [opt.key]: !!v })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {opt.hint}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Sonner exibe até 2 ações por toast — extras aparecem em toasts
              secundários.
            </p>
          </div>

          {/* Ações do drawer */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Ações no drawer de drill-down
            </Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {DRAWER_ACOES_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-start gap-2 rounded-md border p-2.5 cursor-pointer"
                >
                  <Checkbox
                    checked={drawerAcoes[opt.key]}
                    onCheckedChange={(v) =>
                      setDrawerAcoes({ ...drawerAcoes, [opt.key]: !!v })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {opt.hint}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Soneca temporária */}
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
              <Button size="sm" variant="outline" onClick={() => silenciarPor(1)}>
                Silenciar 1h
              </Button>
              <Button size="sm" variant="outline" onClick={() => silenciarPor(8)}>
                Silenciar 8h
              </Button>
              <Button size="sm" variant="outline" onClick={() => silenciarPor(24)}>
                Silenciar 24h
              </Button>
            </div>
          </div>

          {/* Centros de custo silenciados */}
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
                      onCheckedChange={(v) =>
                        setCcs(
                          v ? [...ccs, cc.id] : ccs.filter((x) => x !== cc.id),
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

          {/* Tipos silenciados */}
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
                    onCheckedChange={(v) =>
                      setTipos(
                        v
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
          <Button
            onClick={handleSave}
            disabled={update.isPending || severidadesAtivas.length === 0}
          >
            Salvar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
