import type { Rng } from "../rng";

/**
 * Evento de ciclo de vida de uma entrega Lalamove.
 * O runner consome esse stream simulando o webhook + tracking worker.
 */
export interface EntregaEvento {
  eventId: string;
  orderId: string;
  ts: number;
  tipo:
    | "ORDER_CREATED"
    | "DRIVER_ASSIGNED"
    | "PICKED_UP"
    | "IN_PROGRESS"
    | "GPS_PING"
    | "DELIVERED"
    | "CANCELED"
    | "FAILED";
  driverId?: string;
  hasPodPhoto?: boolean;
  gpsAccuracyM?: number;
  cancelReason?: string;
}

const STATUS_ORDER = [
  "ORDER_CREATED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "IN_PROGRESS",
  "DELIVERED",
] as const;

/**
 * Gera N entregas com ciclo de vida completo:
 * ORDER_CREATED → DRIVER_ASSIGNED → PICKED_UP → IN_PROGRESS → (n×GPS_PING) → DELIVERED
 * ~10% cancela em algum ponto, ~5% falha após pickup.
 */
export function makeEntregasStream(rng: Rng, size: number): EntregaEvento[] {
  const events: EntregaEvento[] = [];
  let ts = 1_700_000_000_000;

  for (let i = 0; i < size; i++) {
    const orderId = `ord-${i.toString().padStart(4, "0")}-${rng.int(1000, 9999)}`;
    const driverId = `drv-${rng.int(1, 50).toString().padStart(3, "0")}`;
    const cancels = rng.bool(0.1);
    const fails = !cancels && rng.bool(0.05);

    for (const tipo of STATUS_ORDER) {
      ts += rng.int(30_000, 120_000);
      if (cancels && rng.bool(0.4)) {
        events.push({
          eventId: `evt-${orderId}-cancel`,
          orderId,
          ts,
          tipo: "CANCELED",
          cancelReason: rng.pick(["driver_no_show", "customer_canceled", "out_of_area"]),
        });
        break;
      }
      if (fails && tipo === "IN_PROGRESS" && rng.bool(0.5)) {
        events.push({
          eventId: `evt-${orderId}-fail`,
          orderId,
          ts,
          tipo: "FAILED",
          cancelReason: "delivery_attempt_failed",
        });
        break;
      }

      events.push({
        eventId: `evt-${orderId}-${tipo}`,
        orderId,
        ts,
        tipo,
        driverId: tipo === "DRIVER_ASSIGNED" ? driverId : undefined,
        hasPodPhoto: tipo === "DELIVERED" ? rng.bool(0.95) : undefined,
      });

      if (tipo === "IN_PROGRESS") {
        const pings = rng.int(3, 8);
        for (let p = 0; p < pings; p++) {
          ts += rng.int(20_000, 60_000);
          events.push({
            eventId: `evt-${orderId}-gps-${p}`,
            orderId,
            ts,
            tipo: "GPS_PING",
            gpsAccuracyM: rng.int(5, 40),
          });
        }
      }
    }
  }
  return events;
}
