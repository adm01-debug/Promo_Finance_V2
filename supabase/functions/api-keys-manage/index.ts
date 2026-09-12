import { z } from '../_shared/zod.ts';
import {
  clientDeServico,
  exigirPapel,
  type ResultadoGuard,
  type UsuarioAutenticado,
} from '../_shared/auth-guard.ts';
import { jsonComCors, respostaPreflight } from '../_shared/cors.ts';

const ESCOPOS_PERMITIDOS = ['read', 'write', 'admin', 'finance', 'tax'] as const;

const CriarChaveSchema = z
  .object({
    action: z.literal('create'),
    empresa_id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    scopes: z.array(z.enum(ESCOPOS_PERMITIDOS)).min(1).max(ESCOPOS_PERMITIDOS.length),
    expires_at: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (payload.expires_at && Date.parse(payload.expires_at) <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expires_at'],
        message: 'A expiração deve estar no futuro.',
      });
    }
  });

type CriarChavePayload = z.infer<typeof CriarChaveSchema>;

interface ResultadoSupabase<T> {
  data: T | null;
  error: { code?: string; message?: string } | null;
}

interface ConsultaEmpresa {
  select: (columns: string) => ConsultaEmpresa;
  eq: (column: string, value: string | boolean) => ConsultaEmpresa;
  maybeSingle: () => Promise<ResultadoSupabase<{ id: string }>>;
}

interface InsercaoChave {
  insert: (payload: Record<string, unknown>) => InsercaoChave;
  select: (columns: string) => InsercaoChave;
  single: () => Promise<ResultadoSupabase<{ id: string }>>;
}

interface ClienteAdmin {
  from(table: 'user_empresas'): ConsultaEmpresa;
  from(table: 'api_keys'): InsercaoChave;
}

export interface DependenciasApiKeys {
  exigirPapel: (
    req: Request,
    papeis: readonly string[]
  ) => Promise<ResultadoGuard<UsuarioAutenticado>>;
  clientDeServico: () => ClienteAdmin;
  gerarChave: () => string;
  gerarHash: (chave: string) => Promise<string>;
}

function bytesParaBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Gera uma credencial opaca de 256 bits; ela é devolvida apenas nesta resposta. */
export function gerarChaveApi(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `pfv2_${bytesParaBase64Url(bytes)}`;
}

/** SHA-256 da credencial, armazenado no banco; a chave bruta nunca é persistida. */
export async function hashChaveApi(chave: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chave));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function erro(status: number, error: string, message: string): Response {
  return jsonComCors({ error, message }, status);
}

export function createHandler(deps: DependenciasApiKeys): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return respostaPreflight();
    if (req.method !== 'POST') return erro(405, 'method_not_allowed', 'Use POST neste endpoint.');

    const auth = await deps.exigirPapel(req, ['admin']);
    if (!auth.ok) return auth.resposta;

    const corpo = await req.json().catch(() => null);
    const validacao = CriarChaveSchema.safeParse(corpo);
    if (!validacao.success) {
      return erro(400, 'payload_invalido', 'Dados inválidos para criar a chave de API.');
    }

    const payload: CriarChavePayload = validacao.data;
    const admin = deps.clientDeServico();
    const { data: vinculo, error: erroVinculo } = await admin
      .from('user_empresas')
      .select('id')
      .eq('user_id', auth.dados.userId)
      .eq('empresa_id', payload.empresa_id)
      .eq('ativo', true)
      .maybeSingle();

    if (erroVinculo)
      return erro(500, 'erro_autorizacao', 'Não foi possível validar o vínculo com a empresa.');
    if (!vinculo) return erro(403, 'sem_permissao', 'Você não possui acesso a esta empresa.');

    const chave = deps.gerarChave();
    const key_hash = await deps.gerarHash(chave);
    const scopes = [...new Set(payload.scopes)];
    const { data: criada, error: erroInsercao } = await admin
      .from('api_keys')
      .insert({
        empresa_id: payload.empresa_id,
        // Compatibilidade transitória com as colunas legadas não nulas. A
        // credencial bruta jamais é persistida: chave recebe o mesmo SHA-256.
        nome: payload.name,
        chave: key_hash,
        name: payload.name,
        key_hash,
        key_prefix: 'pfv2',
        scopes,
        expires_at: payload.expires_at ?? null,
        created_by: auth.dados.userId,
      })
      .select('id')
      .single();

    if (erroInsercao?.code === '23505') {
      return erro(409, 'chave_duplicada', 'Já existe uma chave com este nome para a empresa.');
    }
    if (erroInsercao || !criada) {
      return erro(500, 'erro_criacao', 'Não foi possível criar a chave de API.');
    }

    return jsonComCors({ id: criada.id, key: chave }, 201);
  };
}

export const handler = createHandler({
  exigirPapel,
  clientDeServico: clientDeServico as unknown as () => ClienteAdmin,
  gerarChave: gerarChaveApi,
  gerarHash: hashChaveApi,
});

Deno.serve(handler);
