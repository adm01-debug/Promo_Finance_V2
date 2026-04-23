import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSearch,
  X,
} from "lucide-react";
import type {
  Severidade,
  ToastAcoes,
  DrawerAcoes,
} from "@/hooks/useAnomaliaPreferences";

const SEVERIDADE_ORDEM: Severidade[] = ["critica", "alta", "media", "baixa"];

const SEVERIDADE_META: Record<
  Severidade,
  { label: string; badge: "destructive" | "secondary" | "outline"; tone: string }
> = {
  critica: {
    label: "Crítica",
    badge: "destructive",
    tone: "border-destructive/40 bg-destructive/10",
  },
  alta: {
    label: "Alta",
    badge: "destructive",
    tone: "border-warning/40 bg-warning/10",
  },
  media: {
    label: "Média",
    badge: "secondary",
    tone: "border-secondary/40 bg-secondary/30",
  },
  baixa: {
    label: "Baixa",
    badge: "outline",
    tone: "border-muted bg-muted/40",
  },
};

const EXEMPLOS: Record<Severidade, { titulo: string; mensagem: string }> = {
  critica: {
    titulo: "Pagamento duplicado detectado",
    mensagem:
      "NF 1234 do fornecedor Acme paga 2x no dia 03/04 — divergência de R$ 12.450,00.",
  },
  alta: {
    titulo: "Conta a pagar acima do esperado",
    mensagem:
      "Energia elétrica 38% acima da média trimestral — variação atípica para o centro de custo.",
  },
  media: {
    titulo: "Movimentação atípica na conta corrente",
    mensagem:
      "Saída de R$ 8.200,00 sem categoria definida — fora do padrão histórico.",
  },
  baixa: {
    titulo: "Conciliação atrasada",
    mensagem:
      "8 transações pendentes de conciliação há mais de 7 dias na conta Itaú.",
  },
};

interface ToastAcoesItem {
  key: keyof ToastAcoes;
  label: string;
  icon: typeof Bell;
}

const TOAST_ACOES_LABEL: ToastAcoesItem[] = [
  { key: "drill_down", label: "Drill-down", icon: FileSearch },
  { key: "abrir_pagina", label: "Abrir página", icon: ExternalLink },
  { key: "copiar_id", label: "Copiar ID", icon: Copy },
  { key: "marcar_lida", label: "Marcar lida", icon: CheckCircle2 },
];

interface DrawerAcoesItem {
  key: keyof DrawerAcoes;
  label: string;
  icon: typeof Bell;
}

const DRAWER_ACOES_LABEL: DrawerAcoesItem[] = [
  { key: "abrir_entidade", label: "Abrir transação completa", icon: ExternalLink },
  { key: "pagina_completa", label: "Página completa", icon: FileSearch },
  { key: "copiar_id", label: "Copiar ID", icon: Copy },
  { key: "marcar_lida", label: "Marcar lida", icon: CheckCircle2 },
];

interface Props {
  enabled: boolean;
  severidadesAtivas: Severidade[];
  duracao: number;
  toastAcoes: ToastAcoes;
  drawerAcoes: DrawerAcoes;
  silenciarAte: string | null;
}

/**
 * Prévia em tempo real de como ficarão os toasts e o drawer com as
 * configurações selecionadas. Render puro — não dispara toasts reais.
 */
export function PreviewAnomaliaToastDrawer({
  enabled,
  severidadesAtivas,
  duracao,
  toastAcoes,
  drawerAcoes,
  silenciarAte,
}: Props) {
  const silenciado = useMemo(
    () => !!silenciarAte && new Date(silenciarAte) > new Date(),
    [silenciarAte],
  );

  // Severidade representativa para a prévia: a mais alta ativa, ou crítica se nenhuma.
  const severidadeFoco: Severidade = useMemo(() => {
    for (const sev of SEVERIDADE_ORDEM) {
      if (severidadesAtivas.includes(sev)) return sev;
    }
    return "critica";
  }, [severidadesAtivas]);

  const exemplo = EXEMPLOS[severidadeFoco];
  const meta = SEVERIDADE_META[severidadeFoco];

  const toastAcoesAtivas = TOAST_ACOES_LABEL.filter((a) => toastAcoes[a.key]);
  const drawerAcoesAtivas = DRAWER_ACOES_LABEL.filter((a) => drawerAcoes[a.key]);

  // Sonner mostra no máximo 1 ação principal + 1 cancel; aqui ilustramos
  // até 2 botões inline e indicamos extras como "+N" tooltip.
  const toastAcoesPrimarias = toastAcoesAtivas.slice(0, 2);
  const toastAcoesExtras = Math.max(0, toastAcoesAtivas.length - 2);

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled && !silenciado ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Prévia ao vivo</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Reflete suas escolhas em tempo real — não dispara toasts reais.
        </span>
      </div>

      {!enabled ? (
        <p
          className="text-xs text-muted-foreground italic rounded-md border border-dashed p-3 text-center"
          role="status"
        >
          Toasts desativados — você não receberá notificações realtime de novas
          anomalias.
        </p>
      ) : silenciado ? (
        <p
          className="text-xs text-warning rounded-md border border-warning/40 bg-warning/10 p-3 text-center"
          role="status"
        >
          Soneca ativa até{" "}
          {new Date(silenciarAte!).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          — toasts permanecerão suprimidos.
        </p>
      ) : severidadesAtivas.length === 0 ? (
        <p
          className="text-xs text-destructive rounded-md border border-destructive/40 bg-destructive/10 p-3 text-center"
          role="status"
        >
          Nenhuma severidade selecionada — nenhum toast será disparado.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {/* TOAST PREVIEW */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Toast (canto superior direito)
            </p>
            <div
              className={`relative rounded-md border ${meta.tone} p-3 shadow-sm`}
              role="status"
              aria-label="Prévia do toast de anomalia"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={meta.badge} className="text-[10px] capitalize">
                      {meta.label}
                    </Badge>
                    <span className="text-xs font-semibold truncate">
                      {exemplo.titulo}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {exemplo.mensagem}
                  </p>
                  {toastAcoesPrimarias.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1.5">
                      {toastAcoesPrimarias.map((a) => {
                        const Icon = a.icon;
                        return (
                          <Button
                            key={a.key}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] gap-1 pointer-events-none"
                            tabIndex={-1}
                          >
                            <Icon className="h-3 w-3" />
                            {a.label}
                          </Button>
                        );
                      })}
                      {toastAcoesExtras > 0 && (
                        <span
                          className="text-[10px] text-muted-foreground"
                          title={`${toastAcoesExtras} ação(ões) extra(s) caem em toasts secundários`}
                        >
                          +{toastAcoesExtras}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground pointer-events-none"
                  tabIndex={-1}
                  aria-label="Fechar prévia"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div
                className="absolute bottom-0 left-0 h-0.5 bg-primary/60 rounded-b"
                style={{ width: "60%" }}
                aria-hidden
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Permanece visível por <span className="font-mono">{duracao}s</span>{" "}
              · severidade exibida: <span className="capitalize">{meta.label}</span>{" "}
              · {toastAcoesAtivas.length} ação(ões) configurada(s)
            </p>
          </div>

          {/* DRAWER PREVIEW */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Drawer de drill-down
            </p>
            <div
              className="rounded-md border bg-card p-3 shadow-sm"
              role="region"
              aria-label="Prévia do drawer de drill-down"
            >
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <Badge variant={meta.badge} className="text-[10px] capitalize">
                  {meta.label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {severidadeFoco === "critica" ? "Pagamento duplicado" : "Anomalia"}
                </Badge>
              </div>
              <p className="text-xs font-semibold mb-1">{exemplo.titulo}</p>
              <p className="text-[11px] text-muted-foreground mb-2 line-clamp-3">
                {exemplo.mensagem}
              </p>
              {drawerAcoesAtivas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                  {drawerAcoesAtivas.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Button
                        key={a.key}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] gap-1 pointer-events-none mt-1.5"
                        tabIndex={-1}
                      >
                        <Icon className="h-3 w-3" />
                        {a.label}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic pt-1 border-t mt-1.5">
                  Sem ações — apenas leitura.
                </p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {drawerAcoesAtivas.length} ação(ões) habilitada(s) no drawer
            </p>
          </div>
        </div>
      )}

      {/* Resumo de severidades ativas */}
      <div className="flex flex-wrap items-center gap-1 pt-1 border-t">
        <span className="text-[10px] text-muted-foreground mr-1">
          Severidades que disparam toast:
        </span>
        {SEVERIDADE_ORDEM.map((sev) => {
          const ativo = severidadesAtivas.includes(sev);
          return (
            <Badge
              key={sev}
              variant={ativo ? SEVERIDADE_META[sev].badge : "outline"}
              className={`text-[10px] capitalize ${
                ativo ? "" : "opacity-40 line-through"
              }`}
            >
              {SEVERIDADE_META[sev].label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
