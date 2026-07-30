import { useCallback, useEffect, useRef, useState } from "react";
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

const STORAGE_KEY = "compliance:last-evidence-pack";
const STORAGE_VERSION = 1;
// TTL alinhado com a URL assinada do pacote (7 dias)
const STORAGE_TTL_MS = 7 * 24 * 3600 * 1000;

interface PersistedSnapshot {
  v: number;
  savedAt: number;
  status: "success" | "error";
  input: GerarInput | null;
  events: ProgressEvent[];
  current: ProgressEvent | null;
  percent: number;
  result: GerarResult | null;
  error: string | null;
}

function loadSnapshot(): PersistedSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSnapshot;
    if (parsed.v !== STORAGE_VERSION) return null;
    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSnapshot(snap: Omit<PersistedSnapshot, "v" | "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedSnapshot = { v: STORAGE_VERSION, savedAt: Date.now(), ...snap };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota/serialização: ignore silenciosamente
  }
}

function clearSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useGerarEvidenciasStream() {
  const qc = useQueryClient();
  const initial = loadSnapshot();
  const [status, setStatus] = useState<GerarStatus>(initial?.status ?? "idle");
  const [events, setEvents] = useState<ProgressEvent[]>(initial?.events ?? []);
  const [current, setCurrent] = useState<ProgressEvent | null>(initial?.current ?? null);
  const [percent, setPercent] = useState(initial?.percent ?? 0);
  const [result, setResult] = useState<GerarResult | null>(initial?.result ?? null);
  const [error, setError] = useState<string | null>(initial?.error ?? null);
  const lastInputRef = useRef<GerarInput | null>(initial?.input ?? null);
  const abortRef = useRef<AbortController | null>(null);

  // Sincroniza com mudanças vindas de outras abas do navegador
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const snap = loadSnapshot();
      if (!snap) return;
      setStatus(snap.status);
      setEvents(snap.events);
      setCurrent(snap.current);
      setPercent(snap.percent);
      setResult(snap.result);
      setError(snap.error);
      lastInputRef.current = snap.input;
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setEvents([]);
    setCurrent(null);
    setPercent(0);
    setResult(null);
    setError(null);
    clearSnapshot();
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

      // Mantém um snapshot local dos eventos para persistir no fim do stream
      // (evita depender do estado React assíncrono ao salvar).
      const localEvents: ProgressEvent[] = [];
      let localCurrent: ProgressEvent | null = null;

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
              // Persiste manifest + parâmetros para sobreviver a refresh
              saveSnapshot({
                status: "success",
                input,
                events: localEvents,
                current: localCurrent,
                percent: 100,
                result: final,
                error: null,
              });
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
              localEvents.push(ev);
              localCurrent = ev;
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
        saveSnapshot({
          status: "error",
          input,
          events: localEvents,
          current: localCurrent,
          percent: localCurrent?.percent ?? 0,
          result: null,
          error: msg,
        });
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
