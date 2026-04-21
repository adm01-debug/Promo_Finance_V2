

## Plano — Botão "Testar conexão" no setup do SCIM

### Diagnóstico

O guia em `src/components/admin/sso/ScimSetupGuide.tsx` mostra a Tenant URL e o header `Authorization: Bearer <SEU_TOKEN_SCIM>` mas o admin não tem como validar, dali mesmo, se o endpoint está acessível antes de ir até o painel do Azure AD ou Okta colar e clicar "Test Connection". O endpoint `/ServiceProviderConfig` do `scim-server` é GET público (sem `verify_jwt` e sem checagem de Bearer no servidor para esse path), o que o torna ideal para um health check do lado do cliente.

### Comportamento

Adicionar, no card "Endpoint do servidor SCIM", um botão **"Testar conexão"** que:

1. Faz `GET <SCIM_BASE>/ServiceProviderConfig` direto do navegador (sem token).
2. Mede a latência (`performance.now`) e inspeciona a resposta.
3. Mostra o resultado num bloco abaixo do botão com:
   - **OK (200, schema válido)** — badge verde, latência em ms, e duas linhas confirmando o status esperado por IdP:
     - "Azure AD: **Test Connection** retornará 200 OK"
     - "Okta: **Test Connector Configuration** ficará verde"
   - **Falha** — badge vermelho com o motivo (HTTP status, timeout, schema inesperado, CORS) e dica curta de troubleshooting (ex.: "se aparecer erro de CORS, o endpoint só está acessível pelo IdP em produção").
4. Estado de loading no botão (`Loader2` girando + texto "Testando…") e desabilita durante a chamada.
5. Timeout de 8s via `AbortController`.
6. Validação considera sucesso somente se `res.ok` **e** o JSON contiver `schemas` incluindo `urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig`.

Mensagens visíveis ao admin para os dois cenários esperados ficam sempre na tela como referência (bloco "Status esperado por IdP"), independentemente de já ter testado.

### Detalhes técnicos

- Edição única em `src/components/admin/sso/ScimSetupGuide.tsx`:
  - Novo `useState` para `result: { ok: boolean; status?: number; latencyMs?: number; message: string } | null` e `loading: boolean`.
  - Função `handleTest` async com `fetch(url, { signal, headers: { Accept: 'application/scim+json' } })`.
  - UI usa `Alert` (`variant="success"` quando ok, `variant="error"` quando falha — mesmas variants já usadas no projeto, ex.: `CorporateOnboarding`).
  - Reusa ícones já em escopo + `Loader2`, `CheckCircle2`, `XCircle` de `lucide-react`.
- Sem mudanças em edge function: `/ServiceProviderConfig` já responde GET público com CORS habilitado (`corsHeaders` da SDK) — confirmado em `supabase/functions/scim-server/index.ts`.
- Sem mudanças de DB nem secrets.

### Critério de pronto

1. Aba **SSO → SCIM → Como configurar** mostra botão "Testar conexão" no card do endpoint.
2. Click chama `GET .../scim/v2/ServiceProviderConfig` e retorna em até 8s.
3. Sucesso exibe badge verde, latência e bloco "Status esperado por IdP" com Azure AD e Okta.
4. Falha exibe badge vermelho, código/erro e dica.
5. Sem regressão visual no resto do guia (passos Azure, Okta, mapeamento de atributos).

### Arquivos

- ✏️ `src/components/admin/sso/ScimSetupGuide.tsx`

