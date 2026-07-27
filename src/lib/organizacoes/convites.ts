/**
 * Motor puro de convites de organização.
 *
 * Toda a regra de negócio (validade, normalização, hierarquia de papéis) fica
 * aqui, sem dependência de rede ou de React, para ser testável de forma
 * determinística e reutilizável tanto no frontend quanto na Edge Function.
 */

export type OrgPapel = 'RESPONSAVEL' | 'ADMIN' | 'MEMBRO' | 'LEITOR';

export const ORG_PAPEIS: readonly OrgPapel[] = [
  'RESPONSAVEL',
  'ADMIN',
  'MEMBRO',
  'LEITOR',
] as const;

export const ROTULO_ORG_PAPEL: Record<OrgPapel, string> = {
  RESPONSAVEL: 'Responsável',
  ADMIN: 'Administrador',
  MEMBRO: 'Membro',
  LEITOR: 'Leitor',
};

/** Peso hierárquico: quanto maior, mais privilégios dentro da organização. */
const PESO_PAPEL: Record<OrgPapel, number> = {
  LEITOR: 1,
  MEMBRO: 2,
  ADMIN: 3,
  RESPONSAVEL: 4,
};

export function ehPapelOrg(valor: unknown): valor is OrgPapel {
  return typeof valor === 'string' && (ORG_PAPEIS as readonly string[]).includes(valor);
}

/**
 * Um convidante só pode conceder papéis estritamente abaixo do seu próprio,
 * ou igual ao seu quando ele é ADMIN (dois administradores são aceitáveis).
 * RESPONSAVEL nunca é concedível por convite — é definido pela titularidade.
 */
export function podeConcederPapel(papelConvidante: OrgPapel, papelProposto: OrgPapel): boolean {
  if (papelProposto === 'RESPONSAVEL') return false;
  if (papelConvidante === 'RESPONSAVEL') return true;
  if (papelConvidante === 'ADMIN') return PESO_PAPEL[papelProposto] <= PESO_PAPEL.ADMIN;
  return false;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailValido(email: string): boolean {
  const normalizado = normalizarEmail(email);
  return normalizado.length <= 255 && RE_EMAIL.test(normalizado);
}

/** Token opaco de 256 bits em hexadecimal (não adivinhável). */
function preencherAleatorio(bytes: Uint8Array): Uint8Array {
  const cripto = globalThis.crypto;
  if (cripto && typeof cripto.getRandomValues === 'function') {
    cripto.getRandomValues(new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength));
    return bytes;
  }
  // Fallback apenas para ambientes de teste sem WebCrypto (jsdom antigo).
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function gerarTokenConvite(
  aleatorio: (bytes: Uint8Array) => Uint8Array = preencherAleatorio,
): string {
  const bytes = aleatorio(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const DIAS_VALIDADE_CONVITE = 7;

export function calcularExpiracao(agora: Date, dias = DIAS_VALIDADE_CONVITE): Date {
  const expira = new Date(agora.getTime());
  expira.setUTCDate(expira.getUTCDate() + dias);
  return expira;
}

export interface ConviteAvaliavel {
  readonly email_convidado: string;
  readonly expira_em: string;
  readonly utilizado_em: string | null;
}

export type StatusConvite = 'PENDENTE' | 'UTILIZADO' | 'EXPIRADO';

export function statusConvite(convite: ConviteAvaliavel, agora: Date = new Date()): StatusConvite {
  if (convite.utilizado_em) return 'UTILIZADO';
  const expira = new Date(convite.expira_em).getTime();
  if (!Number.isFinite(expira) || expira <= agora.getTime()) return 'EXPIRADO';
  return 'PENDENTE';
}

export type MotivoRecusaConvite =
  | 'CONVITE_INEXISTENTE'
  | 'CONVITE_UTILIZADO'
  | 'CONVITE_EXPIRADO'
  | 'EMAIL_DIVERGENTE';

export type AvaliacaoConvite =
  | { readonly aceitavel: true }
  | { readonly aceitavel: false; readonly motivo: MotivoRecusaConvite };

/**
 * Decide se um convite pode ser aceito por um usuário autenticado.
 * O e-mail é comparado de forma normalizada para evitar recusas por caixa alta.
 */
export function avaliarAceiteConvite(
  convite: ConviteAvaliavel | null | undefined,
  emailUsuario: string | null | undefined,
  agora: Date = new Date(),
): AvaliacaoConvite {
  if (!convite) return { aceitavel: false, motivo: 'CONVITE_INEXISTENTE' };

  const status = statusConvite(convite, agora);
  if (status === 'UTILIZADO') return { aceitavel: false, motivo: 'CONVITE_UTILIZADO' };
  if (status === 'EXPIRADO') return { aceitavel: false, motivo: 'CONVITE_EXPIRADO' };

  if (!emailUsuario || normalizarEmail(emailUsuario) !== normalizarEmail(convite.email_convidado)) {
    return { aceitavel: false, motivo: 'EMAIL_DIVERGENTE' };
  }

  return { aceitavel: true };
}

export const MENSAGEM_RECUSA: Record<MotivoRecusaConvite, string> = {
  CONVITE_INEXISTENTE: 'Convite não encontrado. Verifique o link recebido.',
  CONVITE_UTILIZADO: 'Este convite já foi utilizado.',
  CONVITE_EXPIRADO: 'Este convite expirou. Solicite um novo ao responsável.',
  EMAIL_DIVERGENTE: 'Este convite foi emitido para outro e-mail. Entre com a conta convidada.',
};

export interface MembroResumo {
  readonly papel_na_org: OrgPapel;
  readonly ativo: boolean;
}

export interface ResumoOrganizacao {
  readonly total: number;
  readonly ativos: number;
  readonly inativos: number;
  readonly porPapel: Record<OrgPapel, number>;
}

export function resumirMembros(membros: readonly MembroResumo[]): ResumoOrganizacao {
  const porPapel: Record<OrgPapel, number> = {
    RESPONSAVEL: 0,
    ADMIN: 0,
    MEMBRO: 0,
    LEITOR: 0,
  };
  let ativos = 0;

  for (const membro of membros) {
    if (membro.ativo) {
      ativos += 1;
      porPapel[membro.papel_na_org] += 1;
    }
  }

  return {
    total: membros.length,
    ativos,
    inativos: membros.length - ativos,
    porPapel,
  };
}

/**
 * Guarda de segurança operacional: impedir que a organização fique sem
 * nenhum administrador/responsável ativo após uma remoção ou rebaixamento.
 */
export function permiteRebaixarOuRemover(
  membros: readonly MembroResumo[],
  alvo: MembroResumo,
  novoPapel: OrgPapel | null,
): boolean {
  const eraGestor = alvo.ativo && PESO_PAPEL[alvo.papel_na_org] >= PESO_PAPEL.ADMIN;
  if (!eraGestor) return true;

  const continuaGestor = novoPapel !== null && PESO_PAPEL[novoPapel] >= PESO_PAPEL.ADMIN;
  if (continuaGestor) return true;

  const gestoresAtivos = membros.filter(
    (m) => m.ativo && PESO_PAPEL[m.papel_na_org] >= PESO_PAPEL.ADMIN,
  ).length;

  return gestoresAtivos > 1;
}
