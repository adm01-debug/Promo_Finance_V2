export interface IdpPreset {
  id: string;
  nome: string;
  tipo: 'oidc' | 'saml';
  logo: string;
  cor: string;
  discovery_url_template?: string;
  docs_url: string;
  instrucoes: string[];
  scopes?: string[];
  claim_mapping?: { email: string; full_name: string; groups: string };
}

export const IDP_PRESETS: IdpPreset[] = [
  {
    id: 'azure',
    nome: 'Microsoft Azure AD / Entra ID',
    tipo: 'oidc',
    logo: '🔷',
    cor: 'hsl(210 100% 50%)',
    discovery_url_template: 'https://login.microsoftonline.com/{TENANT_ID}/v2.0/.well-known/openid-configuration',
    docs_url: 'https://learn.microsoft.com/azure/active-directory/develop/v2-protocols-oidc',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    claim_mapping: { email: 'preferred_username', full_name: 'name', groups: 'groups' },
    instrucoes: [
      'Acesse o portal do Azure AD → App registrations → New registration',
      'Configure o Redirect URI com o callback exibido na próxima etapa',
      'Em Certificates & secrets, gere um Client Secret',
      'Em Token configuration, adicione "groups" como optional claim',
      'Copie o Tenant ID, Client ID e Client Secret',
    ],
  },
  {
    id: 'okta',
    nome: 'Okta',
    tipo: 'oidc',
    logo: '🔵',
    cor: 'hsl(210 100% 40%)',
    discovery_url_template: 'https://{OKTA_DOMAIN}/.well-known/openid-configuration',
    docs_url: 'https://developer.okta.com/docs/reference/api/oidc/',
    scopes: ['openid', 'profile', 'email', 'groups'],
    claim_mapping: { email: 'email', full_name: 'name', groups: 'groups' },
    instrucoes: [
      'No painel Okta → Applications → Create App Integration → OIDC Web App',
      'Adicione o Sign-in redirect URI (callback exibido a seguir)',
      'Em Sign On → OpenID Connect ID Token, adicione claim "groups"',
      'Copie Client ID e Client Secret',
    ],
  },
  {
    id: 'google',
    nome: 'Google Workspace',
    tipo: 'oidc',
    logo: '🟡',
    cor: 'hsl(45 100% 50%)',
    discovery_url_template: 'https://accounts.google.com/.well-known/openid-configuration',
    docs_url: 'https://developers.google.com/identity/protocols/oauth2/openid-connect',
    scopes: ['openid', 'profile', 'email'],
    claim_mapping: { email: 'email', full_name: 'name', groups: 'hd' },
    instrucoes: [
      'Acesse Google Cloud Console → APIs & Services → Credentials',
      'Crie OAuth 2.0 Client ID do tipo Web application',
      'Adicione o callback URI nas Authorized redirect URIs',
      'Restrinja por domínio Workspace na opção HD',
    ],
  },
  {
    id: 'onelogin',
    nome: 'OneLogin',
    tipo: 'saml',
    logo: '🔶',
    cor: 'hsl(20 100% 50%)',
    docs_url: 'https://developers.onelogin.com/saml',
    instrucoes: [
      'Em Apps → Add App → busque por "SAML Custom Connector"',
      'Configure ACS URL e Entity ID com os valores exibidos a seguir',
      'Baixe a metadata XML e cole na próxima etapa',
    ],
  },
  {
    id: 'jumpcloud',
    nome: 'JumpCloud',
    tipo: 'saml',
    logo: '☁️',
    cor: 'hsl(180 60% 45%)',
    docs_url: 'https://jumpcloud.com/support/sso-with-saml',
    instrucoes: [
      'No console JumpCloud → SSO → Add Application → Custom SAML App',
      'IdP Entity ID e ACS URL conforme exibido a seguir',
      'Exporte a metadata e cole na próxima etapa',
    ],
  },
  {
    id: 'adfs',
    nome: 'Microsoft ADFS',
    tipo: 'saml',
    logo: '🪟',
    cor: 'hsl(220 80% 45%)',
    docs_url: 'https://learn.microsoft.com/windows-server/identity/ad-fs/',
    instrucoes: [
      'Abra o ADFS Management Console → Relying Party Trusts → Add',
      'Importe a metadata SP gerada nesta tela',
      'Configure Claim Rules para emitir email, name e group',
    ],
  },
  {
    id: 'custom',
    nome: 'Personalizado',
    tipo: 'oidc',
    logo: '⚙️',
    cor: 'hsl(var(--muted-foreground))',
    docs_url: '',
    instrucoes: ['Configure manualmente os endpoints e certificados do seu provedor'],
  },
];
