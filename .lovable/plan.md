`.

<lov-plan>

## Plano — Seleção de empresa pós-login (SSO dinâmico já está pronto)

### Diagnóstico

**SSO dinâmico por domínio — já implementado.** Não precisa mexer.

`src/pages/Auth.tsx` → `LoginForm` → renderiza `<SsoLoginButtons email={email} />`, que:
- Observa o email digitado, extrai o domínio
- Consulta `sso_providers` ativos com `allowed_domains` contendo aquele domínio
- Renderiza um botão "Entrar com {provider}" para cada match, com logo do `IDP_PRESETS`
- Ao clicar, chama a edge function `sso-initiate` e redireciona para o IdP

Já existe também o hook `useSsoDomainResolver` com auto-redirect quando `force_sso_for_domains=true` (refinamento futuro, fora do escopo).

**Seleção de empresa — parcialmente implementada.** `useUserEmpresas` lê de `user_empresas` (vínculos N:N usuário↔empresa com role/is_default). `EmpresaSwitcher` no header permite trocar entre vínculos. Hoje:
- 1 empresa: switcher oculto, default automática. ✅
- N empresas: a `is_default` é selecionada **silenciosamente** — o usuário só descobre o switcher explorando o header.
- 0 empresas: cai no app sem empresa, telas ficam vazias sem explicação.

### O que falta

Uma **etapa pós-login bloqueante** que aparece **apenas** quando faz sentido — usuário com 2+ empresas sem escolha persistida nesta sessão.

### Mudanças

**1. ➕ `src/components/auth/EmpresaSelectionGate.tsx`**

Card centralizado com cards-radio dos vínculos:

```text
┌─────────────────────────────────────┐
│  Escolha a empresa para acessar     │
│  Você está vinculado a 3 empresas   │
│                                     │
│  ◉ ACME Eventos LTDA                │
│    CNPJ 12.345.678/0001-90          │
│    Role: financeiro · Padrão        │
│  ○ Beta Promoções LTDA              │
│    CNPJ 98.765.432/0001-10 · admin  │
│                                     │
│  [ ] Definir como padrão            │
│  [Sair]            [Continuar →]   │
└─────────────────────────────────────┘
```

- Lê `useUserEmpresas()`.
- Cards clicáveis; destaca o selecionado.
- Checkbox "Definir como padrão" — ao Continuar, executa mutation `useDefinirEmpresaPadrao` (zera `is_default` dos demais vínculos do usuário e marca o selecionado).
- "Continuar" chama `setCurrentEmpresaId(empresa_id)` e libera o `children`.
- "Sair" chama `signOut()`.
- Se `vinculos.length === 0`: mensagem "Você ainda não está vinculado a nenhuma empresa. Solicite acesso ao administrador." + botão Sair.

**2. ➕ `src/components/auth/EmpresaGuard.tsx`**

Wrapper aplicado dentro de `ProtectedRoute`:
- `isLoading` → spinner.
- `vinculos.length === 1` → `setCurrentEmpresaId` automaticamente, renderiza `children`.
- `vinculos.length === 0` → renderiza `<EmpresaSelectionGate>` em modo "sem vínculos".
- `vinculos.length > 1`:
  - Já existe `getCurrentEmpresaId()` apontando para um vínculo válido → renderiza `children`.
  - Caso contrário → renderiza `<EmpresaSelectionGate>`.

**3. ✏️ `src/components/auth/ProtectedRoute.tsx`**

Após a checagem de role, envolver children:
```tsx
return <EmpresaGuard>{children}</EmpresaGuard>;
```
Toda rota protegida passa pelo gate sem mexer em `App.tsx`.

**4. ✏️ `src/hooks/useUserEmpresas.ts`**

Adicionar `useDefinirEmpresaPadrao(linkId)` — mutation com dois UPDATEs (zera `is_default` para o user, marca o link escolhido) + invalida `['user-empresas']`.

### O que NÃO muda

- `src/pages/Auth.tsx`, `LoginForm.tsx`, `SsoLoginButtons.tsx`, `useSsoDomainResolver.ts` — SSO dinâmico já está conforme pedido.
- `EmpresaSwitcher.tsx` (header) — segue para troca rápida no dia a dia.
- `App.tsx` — sem rota nova.
- Tabelas `user_empresas` e `sso_providers` — sem migration.

### Critério de pronto

1. Usuário com 1 empresa: login → vai direto para `/`, sem tela extra.
2. Usuário com 2+ empresas sem escolha persistida: vê tela de seleção bloqueante.
3. "Definir como padrão" + Continuar atualiza `is_default` no banco; sessões futuras pré-selecionam.
4. Logins seguintes no mesmo navegador (com `current-empresa-id` salvo) pulam o gate.
5. Usuário sem vínculos vê mensagem clara + botão Sair.
6. SSO dinâmico continua: digitar `usuario@empresa.com` mostra botões "Entrar com {provider}" para domínios cadastrados.
7. `EmpresaSwitcher` no header segue funcionando para troca pós-login.
8. Sem regressão em rotas públicas (`/auth`, `/auth/corporate`, `/reset-password`, `/contador/:token`).

### Arquivos

- ➕ `src/components/auth/EmpresaSelectionGate.tsx`
- ➕ `src/components/auth/EmpresaGuard.tsx`
- ✏️ `src/components/auth/ProtectedRoute.tsx`
- ✏️ `src/hooks/useUserEmpresas.ts`

