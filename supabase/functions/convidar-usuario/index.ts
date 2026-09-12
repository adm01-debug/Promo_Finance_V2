import { z } from '../_shared/zod.ts';
import {
  clientDeServico,
  exigirPapel,
  type ResultadoGuard,
  type UsuarioAutenticado,
} from '../_shared/auth-guard.ts';
import { corsHeaders, jsonComCors, respostaPreflight } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse, type RateLimitOptions, type RateLimitResult } from '../_shared/rate-limit.ts';

const PapelSchema = z.enum(['admin', 'financeiro', 'operacional', 'visualizador']);
const ConviteSchema = z.object({
  email: z.string().trim().email().max(255),
  role: PapelSchema,
}).strict();

type Papel = z.infer<typeof PapelSchema>;

interface Resultado<T> {
  data: T | null;
  error: { message?: string } | null;
}

interface ConsultaPerfil {
  select: (colunas: string) => ConsultaPerfil;
  eq: (coluna: string, valor: string) => ConsultaPerfil;
  maybeSingle: () => Promise<Resultado<{ id: string }>>;
}

interface OperacaoPapeis {
  eq: (coluna: string, valor: string) => Promise<Resultado<unknown>>;
  insert: (registro: Record<string, unknown>) => Promise<Resultado<{ id: string }>>;
  delete: () => OperacaoPapeis;
}

interface ClienteConvite {
  from(tabela: 'profiles'): ConsultaPerfil;
  from(tabela: 'user_roles'): OperacaoPapeis;
  auth: {
    admin: {
      inviteUserByEmail: (
        email: string,
        options: { data: Record<string, string>; redirectTo?: string },
      ) => Promise<Resultado<{ user: { id: string } }>>;
      deleteUser: (id: string) => Promise<Resultado<unknown>>;
    };
  };
}

export interface DependenciasConviteUsuario {
  exigirPapel: (
    req: Request,
    papeis: readonly string[],
  ) => Promise<ResultadoGuard<UsuarioAutenticado>>;
  clientDeServico: () => ClienteConvite;
  appBaseUrl: () => string | undefined;
  registrarErro: (mensagem: string, contexto?: Record<string, string>) => void;
  verificarRateLimit: (cliente: ClienteConvite, opcoes: RateLimitOptions) => Promise<RateLimitResult>;
}

function erro(status: number, codigo: string, mensagem: string): Response {
  return jsonComCors({ error: codigo, message: mensagem }, status);
}

function redirectSeguro(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' || url.hostname === 'localhost' ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

function extrairIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')?.trim()
    || '0.0.0.0';
}

async function removerConviteIncompleto(
  admin: ClienteConvite,
  userId: string,
  deps: DependenciasConviteUsuario,
): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) deps.registrarErro('convite_usuario_compensacao_falhou', { user_id: userId });
}

export function createHandler(
  deps: DependenciasConviteUsuario,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return respostaPreflight();
    if (req.method !== 'POST') return erro(405, 'method_not_allowed', 'Use POST neste endpoint.');

    const auth = await deps.exigirPapel(req, ['admin']);
    if (!auth.ok) return auth.resposta;

    const validacao = ConviteSchema.safeParse(await req.json().catch(() => null));
    if (!validacao.success) {
      return erro(400, 'payload_invalido', 'E-mail e perfil de acesso são obrigatórios e devem ser válidos.');
    }

    const { email, role } = validacao.data;
    const emailNormalizado = email.toLowerCase();
    const admin = deps.clientDeServico();

    // Convites disparam e-mail e criam identidades no Auth. Diferentemente de
    // webhooks, a indisponibilidade deste limitador deve falhar fechada para
    // evitar envio em massa por uma sessão administrativa comprometida.
    const limite = await deps.verificarRateLimit(admin, {
      endpoint: 'convidar-usuario',
      ip: extrairIp(req),
      limit: 5,
      windowSeconds: 60,
      userAgent: req.headers.get('user-agent'),
      failureMode: 'closed',
    });
    if (!limite.allowed) return rateLimitResponse(limite, corsHeaders);

    const { data: existente, error: erroConsulta } = await admin
      .from('profiles')
      .select('id')
      .eq('email', emailNormalizado)
      .maybeSingle();
    if (erroConsulta) return erro(500, 'erro_consulta', 'Não foi possível validar o e-mail informado.');
    if (existente) return erro(409, 'usuario_existente', 'Já existe um usuário com este e-mail.');

    const { data: convite, error: erroConvite } = await admin.auth.admin.inviteUserByEmail(emailNormalizado, {
      data: { invited_by: auth.dados.userId, requested_role: role },
      redirectTo: redirectSeguro(deps.appBaseUrl()),
    });
    const convidadoId = convite?.user?.id;
    if (erroConvite || !convidadoId) {
      return erro(502, 'falha_convite', 'Não foi possível criar o convite no serviço de autenticação.');
    }

    // O trigger de Auth pode criar o papel visualizador. Como esta conta acabou
    // de ser criada e a pré-validação eliminou usuários existentes, removemos
    // esse papel padrão antes de persistir exatamente o papel solicitado.
    const { error: erroRemocao } = await admin.from('user_roles').delete().eq('user_id', convidadoId);
    if (erroRemocao) {
      await removerConviteIncompleto(admin, convidadoId, deps);
      return erro(500, 'falha_perfil', 'Não foi possível atribuir o perfil de acesso ao convite.');
    }

    const { error: erroPapel } = await admin.from('user_roles').insert({
      user_id: convidadoId,
      role,
      assigned_by: auth.dados.userId,
      is_active: true,
      notes: 'Papel atribuído no convite administrativo.',
    });
    if (erroPapel) {
      await removerConviteIncompleto(admin, convidadoId, deps);
      return erro(500, 'falha_perfil', 'Não foi possível atribuir o perfil de acesso ao convite.');
    }

    return jsonComCors({
      invitation_id: convidadoId,
      email: emailNormalizado,
      role,
      email_status: 'solicitado_ao_auth',
    }, 201);
  };
}

export const handler = createHandler({
  exigirPapel,
  clientDeServico: clientDeServico as unknown as () => ClienteConvite,
  appBaseUrl: () => Deno.env.get('APP_BASE_URL'),
  registrarErro: (mensagem, contexto) => console.error(mensagem, contexto),
  verificarRateLimit: checkRateLimit,
});

Deno.serve(handler);
