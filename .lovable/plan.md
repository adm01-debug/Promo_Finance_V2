

## Plano — Cancelar redirecionamento durante todo o carregamento

### Diagnóstico

Em `src/pages/auth/CorporateOnboarding.tsx` (tela `if (redirecting && !ssoError)`):

- O botão "Cancelar redirecionamento" só renderiza quando `countdown > 0` (linha `{countdown > 0 && (…)}`).
- Quando o countdown chega a 0, a UI mostra "Conectando ao {provider}…" e **remove o botão de cancelar**. Nesse intervalo (entre `triggerSso` ser chamado e o `window.location.href` efetivar a navegação) o usuário não tem como abortar — pode levar segundos se o edge function estiver lento.
- `handleCancelRedirect` apenas limpa `redirecting` e reseta `countdown`, mas não sinaliza para `triggerSso` que ele deve abortar antes de fazer `window.location.href`.

Resultado: o botão existe mas não cumpre a promessa "cancelar a qualquer momento durante o carregamento".

### Mudanças

**Arquivo único:** `src/pages/auth/CorporateOnboarding.tsx`

1. **Sempre renderizar o botão "Cancelar redirecionamento"** dentro da tela de redirecting (remover a guarda `countdown > 0`). O label adapta:
   - `countdown > 0`: "Cancelar redirecionamento"
   - `countdown <= 0`: "Cancelar e voltar"
2. **`triggerSso` respeita `cancelRef`** antes de fazer a navegação:
   - Após o `await supabase.functions.invoke(...)` resolver com sucesso, checar `cancelRef.current` antes de gravar o PKCE no sessionStorage e executar `window.location.href`. Se cancelado, sair sem navegar.
   - Garante que mesmo se a chamada já estava em flight, o usuário consegue abortar enquanto a resposta volta.
3. **`handleCancelRedirect`** continua setando `cancelRef.current = true` (já faz) e limpando `redirecting`/`countdown`. Isso já libera o usuário de volta para a tela de escolha manual (que renderiza `providers` com `force_sso_for_domains`? não — vamos garantir o ponto 4).
4. **Tela de escolha manual** após cancelamento: o effect que dispara auto-redirect (`useEffect` em `autoRedirectProvider`) re-dispararia imediatamente, anulando o cancelamento. Adicionar um ref `cancelledOnceRef` (ou estado `userCancelled: boolean`) para suprimir o auto-redirect após cancelamento explícito do usuário, deixando a tela mostrar a lista de providers (incluindo o que falhou) com a opção "Continuar com senha".
   - Mostrar um pequeno `Alert` informativo: "Redirecionamento cancelado. Escolha um método manualmente."
5. **Resetar `userCancelled`** se o usuário trocar o e-mail (mudar `submittedEmail`), para que um novo domínio com force-SSO funcione normalmente.

### O que NÃO muda

- `useSsoDomainResolver`, `sso-initiate`, `LoginForm`, `SsoLoginButtons`, schema do banco, fluxo de erro SSO já implementado.
- A semântica do auto-redirect quando o usuário não cancela.

### Critério de pronto

1. Botão "Cancelar redirecionamento" visível em **todos os momentos** da tela de redirecionamento (countdown e "Conectando…").
2. Cancelar durante "Conectando…" interrompe a navegação ao IdP — mesmo se a Edge Function já tiver respondido com `redirect_url`, o `window.location.href` não é executado.
3. Após cancelar, o usuário volta para a tela de escolha manual (com providers listados, sem auto-redirect re-disparando).
4. Aviso visual informa que o redirecionamento foi cancelado.
5. Trocar o e-mail reativa o auto-redirect normalmente.
6. Sem regressão no fluxo de sucesso, no fallback de erro SSO ou na escolha manual.

### Arquivos

- ✏️ `src/pages/auth/CorporateOnboarding.tsx`

