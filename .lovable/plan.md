

## Plano — Fallback automático para falha de auto-redirect SSO

### Diagnóstico

`src/pages/auth/CorporateOnboarding.tsx` faz auto-redirect SSO via `useSsoDomainResolver` quando o domínio do e-mail tem `force_sso_for_domains=true`. Hoje, em `triggerSso` (linhas 45–59), quando `supabase.functions.invoke('sso-initiate')` falha:
- Mostra um `toast.error`
- Volta `redirecting` para `null`
- O usuário cai de volta no formulário inicial **sem nenhuma pista do que aconteceu** e **sem caminho alternativo evidente** — o auto-redirect dispara de novo no próximo render porque `autoRedirectProvider` ainda está presente, criando loop.

Falta um estado de erro persistente que:
1. Pare o loop de auto-redirect.
2. Mostre o que falhou.
3. Ofereça retry, providers SSO alternativos do mesmo domínio e o caminho de senha pré-preenchido.

### Mudanças

**Arquivo único:** `src/pages/auth/CorporateOnboarding.tsx`

1. **Novo estado** `ssoError: { provider, message } | null`.
2. **`triggerSso`**:
   - Validar `data?.redirect_url` antes de redirecionar (catch para resposta malformada).
   - No `catch`, além de limpar `redirecting`, gravar `setSsoError({ provider, message })`.
3. **Effect de auto-redirect**: incluir `ssoError` na guarda — se houver erro, **não** re-disparar auto-redirect (quebra o loop).
4. **`handleManualSso`**: limpar `ssoError` antes de tentar de novo.
5. **Tela de fallback** (renderizada quando `ssoError` está setado, antes do formulário principal):
   - Card com ícone de alerta + título "Não foi possível iniciar o login SSO".
   - `Alert` mostrando provedor que falhou + mensagem de erro.
   - Botão **"Tentar novamente"** (retry no mesmo provedor) com ícone `RotateCw`.
   - Lista de **outros providers SSO** disponíveis para o domínio (`providers.filter(p => p.id !== ssoError.provider.id)`), cada um com botão estilo do flow normal.
   - Botão primário **"Continuar com senha"** que navega para `/auth?email=<email>` (já existe `handleUsePassword`).
   - Link secundário "Voltar e usar outro e-mail" que limpa `ssoError` e `submittedEmail`.
6. **Tela "redirecionando"**: trocar `if (redirecting)` para `if (redirecting && !ssoError)` para garantir que o erro tem prioridade visual.

### O que NÃO muda

- `useSsoDomainResolver`, `sso-initiate` edge function, `LoginForm`, `SsoLoginButtons`, schema do banco.
- Comportamento do auto-redirect quando tudo dá certo (ainda dispara após countdown de 3s).
- Rota `/auth` já aceita `?email=` (verificado no `handleUsePassword` existente).

### Critério de pronto

1. Quando `sso-initiate` retornar erro (rede, provedor inativo, configuração inválida), o usuário vê tela de fallback em vez de loop.
2. O auto-redirect **não** dispara novamente enquanto `ssoError` estiver setado.
3. Botão "Tentar novamente" reabre o fluxo SSO no mesmo provedor.
4. Se houver outros providers no domínio, eles aparecem como botões alternativos.
5. Botão "Continuar com senha" navega para `/auth?email=<email>` com o e-mail já preenchido.
6. Sem regressão no fluxo normal (auto-redirect com sucesso, escolha manual, domínio sem SSO).

### Arquivos

- ✏️ `src/pages/auth/CorporateOnboarding.tsx`

