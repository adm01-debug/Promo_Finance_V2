import type { Page, Route } from '@playwright/test';

/**
 * Sessão offline para o gate E2E financeiro (Etapa 31).
 *
 * O gate crítico de hoje (`playwright.critical.config.ts`) roda sem sessão
 * nenhuma — por isso é confiável. Nenhuma tela de dinheiro cabia ali: todas
 * exigem login, e o login exige `E2E_USER_EMAIL`/`E2E_USER_PASSWORD`. Um gate
 * bloqueante amarrado a segredo é um gate que abre sozinho quando o segredo
 * falta: `auth.setup.ts` grava storageState vazio e as specs passam a verde
 * pelo redirect para `/auth`, sem ter exercitado nada.
 *
 * Aqui a sessão é sintética. O app é servido com um projeto Supabase que não
 * existe (`AMBIENTE_OFFLINE`), a sessão é semeada direto no localStorage e
 * toda chamada a `supabase.co` é interceptada. Resultado: zero segredos, zero
 * escrita em banco real, mesmo veredito em qualquer máquina — inclusive em PR
 * de fork, onde secrets não são expostos.
 *
 * ORDEM DE REGISTRO: irrelevante. Cada helper registra um baseline primeiro e
 * devolve `route.fallback()` no que não reconhece, então os handlers se
 * encadeiam em qualquer ordem em vez de um engolir a rota do outro.
 */

/**
 * Projeto sintético usado pelo gate financeiro. Os valores passam no schema Zod
 * de `src/config/env.ts` (URL `supabase.co`, ref de 20 chars, chave
 * `sb_publishable_`) sem apontar para nenhum projeto real — nada aqui é segredo
 * e nada aqui resolve em DNS.
 */
export const AMBIENTE_OFFLINE = {
  VITE_SUPABASE_URL: 'https://e2eoffline0000000000.supabase.co',
  VITE_SUPABASE_PROJECT_ID: 'e2eoffline0000000000',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_offline_sem_segredo',
} as const;

export const USUARIO_OFFLINE = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e-offline@promo-finance.test',
  full_name: 'Usuária E2E Offline',
} as const;

export const EMPRESA_OFFLINE = {
  id: '00000000-0000-4000-8000-0000000000e1',
  razao_social: 'Promo Brindes E2E LTDA',
  nome_fantasia: 'Promo E2E',
  cnpj: '12345678000199',
} as const;

function base64url(valor: unknown): string {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

/**
 * JWT com estrutura válida e assinatura deliberadamente falsa. Serve porque
 * nada o verifica: o `auth-js` só decodifica `exp`, e o PostgREST/Edge nunca é
 * alcançado. Se um dia escapar para a rede, a assinatura inválida garante que
 * é rejeitado em vez de valer como credencial.
 */
function jwtSintetico(expiraEm: number): string {
  const agora = Math.floor(Date.now() / 1000);
  return [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({
      sub: USUARIO_OFFLINE.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: USUARIO_OFFLINE.email,
      iat: agora,
      exp: expiraEm,
      session_id: '00000000-0000-4000-8000-0000000000a1',
    }),
    'assinatura-sintetica-sem-valor',
  ].join('.');
}

function usuarioGoTrue() {
  return {
    id: USUARIO_OFFLINE.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: USUARIO_OFFLINE.email,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: USUARIO_OFFLINE.full_name },
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    is_anonymous: false,
  };
}

function sessaoGoTrue() {
  // Uma hora à frente do relógio da máquina: acima da margem de expiração do
  // auth-js (~30s), então `getSession()` devolve direto do storage sem tentar
  // refresh — que é o único caminho que precisaria da rede.
  const expiraEm = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: jwtSintetico(expiraEm),
    refresh_token: 'refresh-sintetico-e2e',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiraEm,
    user: usuarioGoTrue(),
  };
}

export type PapelOffline = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

export interface SessaoOfflineOptions {
  /** Papel gravado em `user_roles` e `user_empresas`. Default: `admin`. */
  papel?: PapelOffline;
  /**
   * `false` derruba o vínculo de empresa para exercitar o EmpresaGuard.
   * Default: `true`.
   */
  comEmpresa?: boolean;
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const paginasComBaseline = new WeakSet<Page>();

/**
 * Rede de segurança: responde vazio a tudo que nenhum handler mais específico
 * reclamar, para que nenhuma requisição escape para `supabase.co`.
 *
 * Registra uma única vez por página, e por isso sempre na PRIMEIRA chamada de
 * fixture. Isso importa: o Playwright executa os handlers na ordem inversa do
 * registro, então o baseline precisa ser o mais antigo — se cada fixture
 * registrasse o seu, o baseline do último a ser chamado passaria à frente dos
 * handlers do primeiro e engoliria `user_empresas`, derrubando a tela no
 * EmpresaGuard.
 */
export async function garantirBaselineOffline(page: Page) {
  if (paginasComBaseline.has(page)) return;
  paginasComBaseline.add(page);

  await page.route('**/rest/v1/**', (route) => json(route, []));
  await page.route('**/functions/v1/**', (route) => json(route, { ok: true }));
  await page.route('**/storage/v1/**', (route) => json(route, {}));
}

/**
 * Semeia sessão e vínculo de empresa e isola o browser da rede Supabase.
 *
 * Cobre o que o boot autenticado consulta: `auth/v1` (health, token, user),
 * `profiles`, `user_roles` e `user_empresas` — este último é o que o
 * `EmpresaGuard` usa para decidir se libera a tela. Qualquer outra tabela cai
 * para o handler do domínio via `route.fallback()`, ou para o baseline vazio.
 */
export async function autenticarOffline(page: Page, opts: SessaoOfflineOptions = {}) {
  const { papel = 'admin', comEmpresa = true } = opts;
  const projectId =
    process.env.VITE_SUPABASE_PROJECT_ID || AMBIENTE_OFFLINE.VITE_SUPABASE_PROJECT_ID;

  const sessao = sessaoGoTrue();
  const vinculos = comEmpresa
    ? [
        {
          id: '00000000-0000-4000-8000-0000000000b1',
          user_id: USUARIO_OFFLINE.id,
          empresa_id: EMPRESA_OFFLINE.id,
          role: papel,
          is_default: true,
          provisioned_via: 'manual',
          ativo: true,
          empresa: { ...EMPRESA_OFFLINE },
        },
      ]
    : [];

  await page.addInitScript(
    ({ chaveSessao, sessaoSerializada, empresaId }) => {
      try {
        window.localStorage.setItem(chaveSessao, sessaoSerializada);
        if (empresaId) {
          window.localStorage.setItem('pf:current-empresa-id', empresaId);
          window.localStorage.setItem(
            'pf:empresa-scope-v1',
            JSON.stringify({ mode: 'focused', selectedIds: [empresaId], focusedId: empresaId })
          );
        }
      } catch {
        /* storage indisponível — o teste falha na asserção, não aqui */
      }
    },
    {
      chaveSessao: `sb-${projectId}-auth-token`,
      sessaoSerializada: JSON.stringify(sessao),
      empresaId: comEmpresa ? EMPRESA_OFFLINE.id : null,
    }
  );

  await garantirBaselineOffline(page);

  await page.route('**/auth/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/health')) return json(route, { name: 'GoTrue', version: 'e2e' });
    if (url.includes('/auth/v1/logout')) return route.fulfill({ status: 204, body: '' });
    if (url.includes('/auth/v1/user')) return json(route, usuarioGoTrue());
    if (url.includes('/auth/v1/token')) return json(route, sessaoGoTrue());
    return json(route, {});
  });

  // Registrado por último: roda primeiro e devolve `fallback()` no que não é
  // dele, então os mocks de domínio continuam valendo em qualquer ordem.
  await page.route('**/rest/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/user_empresas')) return json(route, vinculos);
    if (url.includes('/user_roles')) return json(route, [{ role: papel }]);
    if (url.includes('/user_onboarding_progress')) {
      // Sem esta linha o tour de onboarding auto-inicia (`progress === null`)
      // e o overlay do Joyride cobre a tela, roubando o clique de qualquer
      // asserção logo depois do `goto`.
      return json(route, [
        {
          user_id: USUARIO_OFFLINE.id,
          steps_completed: [],
          is_completed: true,
          last_step: null,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    }
    if (url.includes('/profiles')) {
      return json(route, [
        {
          id: USUARIO_OFFLINE.id,
          email: USUARIO_OFFLINE.email,
          full_name: USUARIO_OFFLINE.full_name,
          avatar_url: null,
        },
      ]);
    }
    return route.fallback();
  });
}
