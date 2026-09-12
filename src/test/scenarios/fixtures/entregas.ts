import type { Rng } from '../rng';

export type EntregaEventoTipo =
  | 'ORDER_CREATED'
  | 'DRIVER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CANCELED'
  | 'FAILED'
  | 'GPS_PING';

export interface EntregaEvento {
  eventId: string;
  orderId: string;
  tipo: EntregaEventoTipo;
  ts: number;
  driverId?: string;
  hasPodPhoto?: boolean;
  cancelReason?: string;
}

/** Fluxo mínimo de entrega com motorista, rastreio e prova de entrega. */
export function makeEntregasStream(rng: Rng, size: number): EntregaEvento[] {
  const eventos: EntregaEvento[] = [];
  const baseTimestamp = 1_700_000_000;

  for (let index = 0; index < size; index++) {
    const orderId = `pedido-${rng.seed}-${index}`;
    const driverId = `motorista-${rng.seed}-${index}`;
    const timestamp = baseTimestamp + index * 100;
    const criar = (tipo: EntregaEventoTipo, offset: number, extras: Partial<EntregaEvento> = {}) =>
      eventos.push({
        eventId: `entrega-${rng.seed}-${index}-${tipo.toLowerCase()}`,
        orderId,
        tipo,
        ts: timestamp + offset,
        ...extras,
      });

    criar('ORDER_CREATED', 0);
    criar('DRIVER_ASSIGNED', 10, { driverId });
    criar('PICKED_UP', 20);
    criar('GPS_PING', 30);
    criar('IN_PROGRESS', 40);
    criar('DELIVERED', 50, { hasPodPhoto: true });
  }

  return eventos;
}
