/**
 * body-size-guard.ts — Mitigação GHSA-mrhx-c7xc-m3w5 (zod v3 DoS por array)
 *
 * O zod v3 percorre TODOS os elementos de um array antes de aplicar `.max()`,
 * permitindo que um atacante esgote memória/CPU com arrays gigantes mesmo
 * quando o schema tem `.max()`. O fix upstream está apenas no zod v4.
 *
 * Mitigação correta para zod v3: rejeitar bodies grandes ANTES de deserializar
 * JSON (i.e., antes de chamar zod). Usamos `Content-Length` como gate rápido;
 * para uploads sem Content-Length lemos até MAX_BYTES+1 e abortamos se exceder.
 *
 * Uso:
 *   const guard = await bodySizeGuard(req, { maxBytes: 256 * 1024 });
 *   if (!guard.ok) return guard.response;
 *   const body = JSON.parse(guard.text);
 *
 * Alternativa quando já se tem o Response de CORS:
 *   const guard = await bodySizeGuard(req, { maxBytes: 256 * 1024, corsHeaders });
 */

const DEFAULT_MAX_BYTES = 256 * 1024; // 256 KB — adequado para payloads de IA

export interface BodySizeGuardOptions {
  /** Tamanho máximo do body em bytes. Padrão: 256 KB. */
  maxBytes?: number;
  /** Headers CORS a incluir na resposta de erro. */
  corsHeaders?: Record<string, string>;
}

type GuardOk = { ok: true; text: string };
type GuardFail = { ok: false; response: Response };

/**
 * Verifica tamanho do body via Content-Length (rápido) e, se ausente,
 * lê até maxBytes+1 bytes para detectar excesso sem consumir o body inteiro.
 * Retorna { ok: true, text } com o body já lido, ou { ok: false, response }
 * com HTTP 413 se o body for muito grande.
 */
export async function bodySizeGuard(
  req: Request,
  opts: BodySizeGuardOptions = {}
): Promise<GuardOk | GuardFail> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const extra: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.corsHeaders ?? {}),
  };

  // Gate rápido: Content-Length declarado
  const clHeader = req.headers.get('content-length');
  if (clHeader !== null) {
    const cl = parseInt(clHeader, 10);
    if (!Number.isNaN(cl) && cl > maxBytes) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({
            error: 'payload_too_large',
            message: `Body excede o limite de ${maxBytes} bytes.`,
          }),
          { status: 413, headers: extra }
        ),
      };
    }
  }

  // Leitura do body: lê até maxBytes + 1 para detectar excesso
  try {
    const reader = req.body?.getReader();
    if (!reader) {
      return { ok: true, text: '' };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          // Cancela o stream e retorna 413
          reader.cancel().catch(() => {});
          return {
            ok: false,
            response: new Response(
              JSON.stringify({
                error: 'payload_too_large',
                message: `Body excede o limite de ${maxBytes} bytes.`,
              }),
              { status: 413, headers: extra }
            ),
          };
        }
        chunks.push(value);
      }
    }

    const decoder = new TextDecoder();
    const text = chunks.map((c) => decoder.decode(c, { stream: true })).join('') +
      decoder.decode();
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'bad_request', message: 'Erro ao ler body da requisição.' }),
        { status: 400, headers: extra }
      ),
    };
  }
}
