import type { Rng } from "../rng";

export type WebhookEventTipo = "PAYMENT_CREATED" | "PAYMENT_CONFIRMED" | "PAYMENT_FAILED";

export interface WebhookEvent {
  eventId: string;
  paymentId: string;
  tipo: WebhookEventTipo;
  provider: "asaas" | "bitrix" | "bling" | "whatsapp";
  ts: number;
  payload: Record<string, unknown>;
}

export function makeWebhookStream(rng: Rng, size: number): WebhookEvent[] {
  const out: WebhookEvent[] = [];
  const nPayments = Math.max(1, Math.floor(size / 2));
  const providers = ["asaas", "bitrix", "bling", "whatsapp"] as const;

  for (let p = 0; p < nPayments; p++) {
    const paymentId = `pay-${rng.seed}-${p}`;
    const provider = rng.pick(providers);
    const ts = 1_700_000_000 + p * 60;

    out.push({
      eventId: `evt-${rng.seed}-${p}-c`,
      paymentId,
      tipo: "PAYMENT_CREATED",
      provider,
      ts,
      payload: { id: paymentId, status: "PENDING" },
    });

    const finalTipo: WebhookEventTipo = rng.bool(0.85) ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED";
    out.push({
      eventId: `evt-${rng.seed}-${p}-f`,
      paymentId,
      tipo: finalTipo,
      provider,
      ts: ts + 30,
      payload: { id: paymentId, status: finalTipo },
    });
  }
  return out;
}
