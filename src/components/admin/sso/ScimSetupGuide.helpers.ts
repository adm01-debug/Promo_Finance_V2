import { env } from '@/config/env';

export const SCIM_BASE = `${env.SUPABASE_URL}/functions/v1/scim-server/scim/v2`;

export const ATTR_MAPPINGS = [
  { scim: 'userName', source: 'user.userPrincipalName / user.email', required: true },
  { scim: 'name.formatted', source: 'user.displayName', required: false },
  { scim: 'emails[type eq "work"].value', source: 'user.mail', required: false },
  { scim: 'externalId', source: 'objectId / user.id', required: true },
  { scim: 'active', source: 'Not([Suspended]) ou user.accountEnabled', required: true },
];

export const SCIM_SP_CONFIG_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig';

export const CHECKLIST_ITEMS: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'token_generated',
    label: 'Token SCIM gerado e copiado',
    description:
      'Gerei um token na aba "Tokens" e armazenei em local seguro (exibido uma única vez).',
  },
  {
    key: 'tenant_url_configured',
    label: 'Tenant URL configurada no IdP',
    description: 'Colei a URL base SCIM no painel do provedor (Azure AD / Okta).',
  },
  {
    key: 'auth_header_configured',
    label: 'Authorization header configurado',
    description: 'Configurei o header Bearer com o token SCIM.',
  },
  {
    key: 'test_connection_passed',
    label: 'Test Connection retornou 200 OK',
    description: 'O teste de conexão do IdP passou sem erros.',
  },
  {
    key: 'attr_userName',
    label: 'Mapeamento userName confirmado',
    description: 'userName apontando para userPrincipalName / email.',
  },
  {
    key: 'attr_externalId',
    label: 'Mapeamento externalId confirmado',
    description: 'externalId apontando para objectId / user.id (estável).',
  },
  {
    key: 'attr_active',
    label: 'Mapeamento active confirmado',
    description: 'Atributo active refletindo o status da conta no IdP.',
  },
  {
    key: 'scope_assigned',
    label: 'Scope restrito a usuários atribuídos',
    description: 'Provisionamento limitado a usuários/grupos atribuídos.',
  },
  {
    key: 'sync_enabled',
    label: 'Provisionamento ativado',
    description: 'Sync ativo no IdP e primeira execução validada.',
  },
];
