/**
 * Mapeamento de códigos de erro do SSO logout para mensagens humanas em PT-BR.
 *
 * Cada código tem:
 *  - title: cabeçalho curto exibido no banner.
 *  - description: explicação do que aconteceu.
 *  - hint: dica de ação prática para o usuário resolver.
 *
 * Os códigos são derivados de:
 *  - retornos da edge function `sso-logout` (ex.: `provider_not_found`).
 *  - falhas de rede no `supabase.functions.invoke` (ex.: `network_error`).
 *  - validações locais (ex.: `missing_provider_id`).
 */

export type SsoErrorCode =
  | 'provider_not_found'
  | 'provider_disabled'
  | 'endpoint_missing'
  | 'invalid_provider_config'
  | 'network_error'
  | 'timeout'
  | 'unauthorized'
  | 'rate_limited'
  | 'missing_provider_id'
  | 'edge_function_error'
  | 'unknown';

export interface SsoErrorMessage {
  title: string;
  description: string;
  hint: string;
}

export const SSO_ERROR_MESSAGES: Record<SsoErrorCode, SsoErrorMessage> = {
  provider_not_found: {
    title: 'Provedor SSO não encontrado',
    description:
      'O provedor de identidade vinculado à sua sessão não existe mais ou foi removido pelo administrador.',
    hint: 'Reinicie a revogação local para garantir que sua sessão foi encerrada e contate o administrador para reconfigurar o SSO.',
  },
  provider_disabled: {
    title: 'Provedor SSO desativado',
    description:
      'O provedor de identidade está desativado no momento e não aceita solicitações de logout remoto.',
    hint: 'Use a opção "Reiniciar revogação local" para limpar sua sessão neste dispositivo. O administrador precisa reativar o provedor para o logout remoto voltar a funcionar.',
  },
  endpoint_missing: {
    title: 'Endpoint de logout não configurado',
    description:
      'O provedor SSO não publicou um end_session_endpoint, então não é possível encerrar a sessão remotamente no IdP.',
    hint: 'Sua sessão local foi limpa. Para encerrar também no IdP, faça logout manualmente no portal do provedor (ex.: Microsoft, Okta, Google).',
  },
  invalid_provider_config: {
    title: 'Configuração de SSO inválida',
    description:
      'A configuração do provedor está incompleta ou corrompida (faltam URLs ou client_id).',
    hint: 'Reinicie a revogação local para proteger este dispositivo e avise o administrador para revisar a configuração do SSO.',
  },
  network_error: {
    title: 'Falha de rede ao contatar o SSO',
    description:
      'Não foi possível alcançar a edge function de logout. Pode ser instabilidade temporária ou bloqueio de rede.',
    hint: 'Verifique sua conexão e clique em "Tentar logout no provedor" novamente em alguns segundos.',
  },
  timeout: {
    title: 'Tempo esgotado ao encerrar a sessão',
    description:
      'A solicitação de logout demorou demais e foi interrompida. O provedor pode estar lento.',
    hint: 'Tente novamente em alguns instantes. Se persistir, reinicie a revogação local para garantir a segurança deste dispositivo.',
  },
  unauthorized: {
    title: 'Sessão expirada ou inválida',
    description:
      'O servidor não conseguiu validar sua sessão para processar o logout no provedor.',
    hint: 'Reinicie a revogação local — sua sessão provavelmente já foi encerrada do lado do servidor.',
  },
  rate_limited: {
    title: 'Muitas tentativas em pouco tempo',
    description:
      'O endpoint de logout do provedor está limitando solicitações repetidas para evitar abuso.',
    hint: 'Aguarde 30 a 60 segundos e tente novamente. Enquanto isso, reinicie a revogação local para proteger este dispositivo.',
  },
  missing_provider_id: {
    title: 'Provedor SSO não identificado',
    description:
      'Sua sessão não tem um provider_id associado, então não é possível chamar o logout remoto.',
    hint: 'Use "Reiniciar revogação local" para limpar dados locais. Se você logou via SSO, contate o administrador.',
  },
  edge_function_error: {
    title: 'Erro interno ao processar o logout',
    description:
      'A edge function `sso-logout` retornou um erro inesperado ao processar a solicitação.',
    hint: 'Tente novamente. Se persistir, reinicie a revogação local e reporte o problema ao administrador com a mensagem técnica abaixo.',
  },
  unknown: {
    title: 'Erro desconhecido no logout SSO',
    description:
      'Não conseguimos identificar a causa exata da falha no logout do provedor de identidade.',
    hint: 'Reinicie a revogação local para garantir que este dispositivo está protegido e tente o logout no provedor novamente.',
  },
};

/**
 * Tenta inferir um código a partir de uma mensagem de erro bruta vinda da edge ou da rede.
 * Retorna 'unknown' como fallback seguro.
 */
export function inferSsoErrorCode(rawMessage: string | null | undefined): SsoErrorCode {
  if (!rawMessage) return 'unknown';
  const m = rawMessage.toLowerCase();

  if (m.includes('provider_not_found') || m.includes('provedor não encontrado') || m.includes('not found')) {
    return 'provider_not_found';
  }
  if (m.includes('disabled') || m.includes('desativado') || m.includes('inactive')) {
    return 'provider_disabled';
  }
  if (m.includes('end_session_endpoint') || m.includes('endpoint_missing') || m.includes('sem end_session')) {
    return 'endpoint_missing';
  }
  if (m.includes('invalid_provider_config') || m.includes('client_id') || m.includes('invalid config')) {
    return 'invalid_provider_config';
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('econnrefused') || m.includes('rede')) {
    return 'network_error';
  }
  if (m.includes('timeout') || m.includes('timed out') || m.includes('tempo esgotado')) {
    return 'timeout';
  }
  if (m.includes('401') || m.includes('unauthorized') || m.includes('não autorizado')) {
    return 'unauthorized';
  }
  if (m.includes('429') || m.includes('rate') || m.includes('too many')) {
    return 'rate_limited';
  }
  if (m.includes('missing_provider_id') || m.includes('provider_id')) {
    return 'missing_provider_id';
  }
  if (m.includes('edge') || m.includes('functioninvoke') || m.includes('500')) {
    return 'edge_function_error';
  }
  return 'unknown';
}
