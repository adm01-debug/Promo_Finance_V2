import type { Rng } from "../rng";

export type NfeEventoTipo =
  | "novo"
  | "duplicado"
  | "gzip_corrompido"
  | "certificado_expirado"
  | "timeout_sefaz"
  | "nsu_gap"
  | "manifestacao";

export type ManifestacaoTipo =
  | "ciencia"
  | "confirmada"
  | "desconhecida"
  | "nao_realizada";

export interface NfeDfeEvento {
  eventId: string;
  nsu: number;
  chaveAcesso: string;
  tipo: NfeEventoTipo;
  ts: number;
  xmlOk: boolean;
  manifestacao?: ManifestacaoTipo;
}

function chave(seed: number, i: number): string {
  return `3526${String(seed).padStart(6, "0")}${String(i).padStart(34, "0")}`.slice(0, 44);
}

export function makeNfeStream(rng: Rng, size: number): NfeDfeEvento[] {
  const out: NfeDfeEvento[] = [];
  let nsu = 1000;
  for (let i = 0; i < size; i++) {
    const ch = chave(rng.seed, i);
    const roll = rng.next();
    let tipo: NfeEventoTipo = "novo";
    let xmlOk = true;
    if (roll < 0.1) {
      tipo = "duplicado";
    } else if (roll < 0.15) {
      tipo = "gzip_corrompido";
      xmlOk = false;
    } else if (roll < 0.18) {
      tipo = "certificado_expirado";
      xmlOk = false;
    } else if (roll < 0.22) {
      tipo = "timeout_sefaz";
      xmlOk = false;
    } else if (roll < 0.28) {
      tipo = "nsu_gap";
    }

    nsu += tipo === "nsu_gap" ? rng.int(2, 5) : 1;

    out.push({
      eventId: `dfe-${rng.seed}-${i}`,
      nsu,
      chaveAcesso: ch,
      tipo,
      ts: 1_700_000_000 + i * 10,
      xmlOk,
    });

    if (tipo === "duplicado") {
      out.push({
        eventId: `dfe-${rng.seed}-${i}-dup`,
        nsu,
        chaveAcesso: ch,
        tipo: "duplicado",
        ts: 1_700_000_000 + i * 10 + 1,
        xmlOk: true,
      });
    }

    // Ocasional evento de manifestação após um novo
    if (tipo === "novo" && rng.bool(0.3)) {
      const manif = rng.pick<ManifestacaoTipo>([
        "ciencia",
        "confirmada",
        "desconhecida",
        "nao_realizada",
      ]);
      out.push({
        eventId: `dfe-${rng.seed}-${i}-m`,
        nsu: nsu + 1,
        chaveAcesso: ch,
        tipo: "manifestacao",
        manifestacao: manif,
        ts: 1_700_000_000 + i * 10 + 5,
        xmlOk: true,
      });
    }
  }
  return out;
}
