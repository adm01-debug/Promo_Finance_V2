import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TIPO_LABEL, tempoDecorrido, truncarDescricao } from "./helpers";
import type { Anomalia, ConflitoBanner } from "./types";

/**
 * Notificações de conflito/remoção da fila de revisão. Recebe o setter do
 * estado de conflito do modal — o estado permanece no dono (useReviewQueue).
 */
export function useConflitoNotifier(
  setConflito: React.Dispatch<React.SetStateAction<ConflitoBanner | null>>,
) {
  const resolverAutor = useCallback(async (userId: string | null) => {
    if (!userId) return { nome: "outro revisor", email: null as string | null };
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();
      const nome = (prof?.full_name as string | null)?.trim() || null;
      const email = (prof?.email as string | null)?.trim() || null;
      return { nome: nome || email || "outro revisor", email };
    } catch {
      return { nome: "outro revisor", email: null };
    }
  }, []);

  const notificarConflito = useCallback(
    async (original: Anomalia, fresca: Anomalia) => {
      const { nome, email } = await resolverAutor(fresca.resolvida_por);
      const acao =
        fresca.status === "confirmada"
          ? "confirmou como problema real"
          : "marcou como falso positivo";
      const quando = fresca.resolvida_em ? ` (${tempoDecorrido(fresca.resolvida_em)})` : "";
      const descCurta = truncarDescricao(original.descricao);
      const tipoLabel = TIPO_LABEL[original.tipo_anomalia];
      const titulo = `${nome} já revisou esta anomalia${quando}`;
      const linhaAnomalia = `[${original.severidade.toUpperCase()} · ${tipoLabel}] ${descCurta}`;
      const linhaAcao = `Ação: ${acao}.${email && nome !== email ? ` Contato: ${email}.` : ""} Avançando para a próxima.`;

      setConflito({
        anomaliaId: original.id,
        severidade: original.severidade,
        tipoLabel,
        descricao: descCurta,
        statusLabel: fresca.status === "confirmada" ? "Confirmada" : "Falso positivo",
        acaoLabel: acao,
        autorNome: nome,
        autorEmail: email,
        resolvidaEm: fresca.resolvida_em ?? null,
        motivo: "ja_resolvida",
      });

      toast.warning(titulo, {
        description: `${linhaAnomalia}\n${linhaAcao}`,
        duration: 8000,
        action: {
          label: "Ver no log",
          onClick: () => {
            window.open(
              `/audit-logs?table=anomalias_detectadas&record=${original.id}`,
              "_blank",
              "noopener,noreferrer",
            );
          },
        },
      });
    },
    [resolverAutor, setConflito],
  );

  const notificarRemovida = useCallback(
    (original: Anomalia) => {
      const tipoLabel = TIPO_LABEL[original.tipo_anomalia];
      setConflito({
        anomaliaId: original.id,
        severidade: original.severidade,
        tipoLabel,
        descricao: truncarDescricao(original.descricao),
        statusLabel: "Removida",
        acaoLabel: "removeu do sistema",
        autorNome: "outro revisor",
        autorEmail: null,
        resolvidaEm: null,
        motivo: "removida",
      });
    },
    [setConflito],
  );

  return { notificarConflito, notificarRemovida };
}
