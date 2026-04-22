import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EvidenciaPacote } from "./useEvidenciasPack";

export interface ProgressEvent {
  step: string;
  label: string;
  index: number;
  total: number;
  percent: number;
  detail?: string;
}

export interface GerarResult {
  ok: true;
  pacote: EvidenciaPacote;
  signed_url: string;
  manifest: Record<string, unknown>;
  audit_warning?: string | null;
}

export type GerarStatus = "idle" | "running" | "success" | "error";

export interface GerarInput {
  periodo_inicio: string;
  periodo_fim: string;
  escopos: string[];
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/gerar-pacote-evidencias?stream=1`;

export function useGerarEvidenciasStream() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<GerarStatus>("idle");
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [current, setCurrent] = useState<ProgressEvent | null>(null);
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState<GerarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastInputRef = useRef<GerarInput | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setEvents([]);
    setCurrent(null);
    setPercent(0);
    setResult(null);
    setError(null);
  }, []);

  const start = useCallback(
    async (input: GerarInput) => {
      lastInputRef.current = input;
      setStatus("running");
      setEvents([]);
      setCurrent(null);
      setPercent(0);
      setResult(null);
      setError(null);

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("Sessão expirada — refaça login.");

        const res = await fetch(FUNCTION_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          },
          body: JSON.stringify(input),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data:\s?/, "").trim();
            if (!line) continue;
            let payload: unknown;
            try {
              payload = JSON.parse(line);
            } catch {
              continue;
            }
            const obj = payload as Record<string, unknown>;
            if (obj.error) {
              throw new Error(String(obj.error));
            }
            if (obj.done) {
              const final = obj.payload as GerarResult;
              setResult(final);
              setPercent(100);
              setStatus("success");
              toast.success("Pacote de evidências pronto.");
              if (final.audit_warning) {
                toast.warning("Trilha de auditoria não registrada", {
                  description: final.audit_warning,
                  duration: 8000,
                });
              }
              qc.invalidateQueries({ queryKey: ["evidencias-pacotes"] });
              qc.invalidateQueries({ queryKey: ["compliance-kpis"] });
              return;
            }
            if (typeof obj.percent === "number") {
              const ev = obj as unknown as ProgressEvent;
              setEvents((prev) => [...prev, ev]);
              setCurrent(ev);
              setPercent(ev.percent);
            }
          }
        }
        throw new Error("Conexão encerrada sem resultado.");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        setError(msg);
        setStatus("error");
        toast.error(`Falha ao gerar pacote: ${msg}`);
      }
    },
    [qc],
  );

  const retry = useCallback(() => {
    if (lastInputRef.current) start(lastInputRef.current);
  }, [start]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return { status, events, current, percent, result, error, start, retry, cancel, reset };
}
