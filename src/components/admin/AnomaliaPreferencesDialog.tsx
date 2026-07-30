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
import { Separator } from "@/components/ui/separator";
import { BellOff } from "lucide-react";
import { toast } from "sonner";
import {
  type Severidade,
  type ToastAcoes,
  type DrawerAcoes,
  TOAST_DURACAO_DEFAULT,
} from "@/hooks/useAnomaliaPreferences";
import { PreviewAnomaliaToastDrawer } from "./PreviewAnomaliaToastDrawer";
import { AnomaliaPreferencePresetPicker } from "./AnomaliaPreferencePresetPicker";
import type { AnomaliaPreferencePreset } from "./anomaliaPreferencePresets";
import { AnomaliaToastHistorico } from "./AnomaliaToastHistorico";
import { TOAST_ACOES_OPTIONS, DRAWER_ACOES_OPTIONS } from "./anomalia-preferences/constants";
import { SeveridadesSection } from "./anomalia-preferences/SeveridadesSection";
import { AcoesSection } from "./anomalia-preferences/AcoesSection";
import { DuracaoSection } from "./anomalia-preferences/DuracaoSection";
import { SonecaSection } from "./anomalia-preferences/SonecaSection";
import { SilenciamentoSection } from "./anomalia-preferences/SilenciamentoSection";
import { useSaveAnomaliaPreferences } from "./anomalia-preferences/useSaveAnomaliaPreferences";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AnomaliaPreferencesDialog({ open, onOpenChange }: Props) {
  const { save, isSaving, preferences } = useSaveAnomaliaPreferences();
  const [enabled, setEnabled] = useState(true);
  const [severidadesAtivas, setSeveridadesAtivas] = useState<Severidade[]>(["critica", "alta"]);
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

  const toggleSeveridade = (sev: Severidade, on: boolean) => {
    setSeveridadesAtivas((prev) =>
      on ? Array.from(new Set([...prev, sev])) : prev.filter((s) => s !== sev),
    );
  };

  const handleSave = () =>
    save({
      enabled,
      severidadesAtivas,
      duracao,
      toastAcoes,
      drawerAcoes,
      silenciarAte,
      ccs,
      tipos,
      centrosCusto,
      onSuccess: () => onOpenChange(false),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            Preferências de alerta de anomalias
          </DialogTitle>
          <DialogDescription>
            Controle quais severidades disparam toast, por quanto tempo e quais ações aparecem no
            toast e no drawer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="toast-enabled" className="flex flex-col gap-0.5">
              <span>Receber toasts de novas anomalias</span>
              <span className="text-xs text-muted-foreground font-normal">
                Master switch — desativa todos os toasts realtime.
              </span>
            </Label>
            <Switch id="toast-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <AnomaliaPreferencePresetPicker
            current={{ severidades: severidadesAtivas, duracao, toastAcoes, drawerAcoes }}
            onApply={(preset: AnomaliaPreferencePreset) => {
              setSeveridadesAtivas(preset.severidades);
              setDuracao(preset.duracao);
              setToastAcoes(preset.toastAcoes);
              setDrawerAcoes(preset.drawerAcoes);
              if (!enabled) setEnabled(true);
              toast.success(`Preset "${preset.nome}" aplicado`, {
                description: "Revise e clique em Salvar para confirmar.",
              });
            }}
          />

          <PreviewAnomaliaToastDrawer
            enabled={enabled}
            severidadesAtivas={severidadesAtivas}
            duracao={duracao}
            toastAcoes={toastAcoes}
            drawerAcoes={drawerAcoes}
            silenciarAte={silenciarAte}
          />

          <Separator />

          <SeveridadesSection
            severidadesAtivas={severidadesAtivas}
            onToggle={toggleSeveridade}
          />

          <DuracaoSection duracao={duracao} onChange={setDuracao} />

          <Separator />

          <AcoesSection
            title="Ações no toast"
            options={TOAST_ACOES_OPTIONS}
            values={toastAcoes}
            onChange={setToastAcoes}
            footerHint="Sonner exibe até 2 ações por toast — extras aparecem em toasts secundários."
          />

          <AcoesSection
            title="Ações no drawer de drill-down"
            options={DRAWER_ACOES_OPTIONS}
            values={drawerAcoes}
            onChange={setDrawerAcoes}
          />

          <Separator />

          <SonecaSection silenciarAte={silenciarAte} onChange={setSilenciarAte} />

          <SilenciamentoSection
            centrosCusto={centrosCusto}
            ccs={ccs}
            tipos={tipos}
            onCcsChange={setCcs}
            onTiposChange={setTipos}
          />

          <AnomaliaToastHistorico />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || severidadesAtivas.length === 0}>
            Salvar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
