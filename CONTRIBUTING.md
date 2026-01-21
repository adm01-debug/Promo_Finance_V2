# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o **Finance-Hub**! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Reportando Bugs](#reportando-bugs)
- [Solicitando Features](#solicitando-features)

## 📜 Código de Conduta

Este projeto adota um código de conduta que esperamos que todos os participantes sigam. Por favor, leia o [Código de Conduta](CODE_OF_CONDUCT.md) antes de contribuir.

## 🚀 Como Contribuir

### 1. Fork o Repositório

Clique no botão "Fork" no GitHub para criar sua cópia do repositório.

### 2. Clone seu Fork

```bash
git clone https://github.com/seu-usuario/finance-hub.git
cd finance-hub
```

### 3. Configure o Upstream

```bash
git remote add upstream https://github.com/original/finance-hub.git
```

### 4. Crie uma Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 5. Faça suas Alterações

Desenvolva sua feature ou correção seguindo os padrões do projeto.

### 6. Commit suas Alterações

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
```

### 7. Push e Crie o PR

```bash
git push origin feature/minha-feature
```

Então, crie um Pull Request no GitHub.

## 🔧 Configuração do Ambiente

### Requisitos

- Node.js 20+
- npm 10+
- Git

### Instalação

```bash
# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Úteis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run test         # Rodar testes
npm run test:e2e     # Testes E2E
npm run lint         # Verificar linting
npm run type-check   # Verificar tipos TypeScript
```

## 📝 Padrões de Código

### TypeScript

- Use TypeScript estrito
- Evite `any`, prefira `unknown` quando necessário
- Defina interfaces para props de componentes
- Use types explícitos

### React

- Use componentes funcionais com hooks
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados
- Use `forwardRef` quando necessário

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `MyComponent.tsx` |
| Hooks | camelCase com `use` | `useMyHook.ts` |
| Utils | kebab-case | `my-util.ts` |
| Types | PascalCase | `MyType` |
| Constants | UPPER_SNAKE_CASE | `MY_CONSTANT` |

### Estrutura de Componentes

```tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  children: ReactNode;
  className?: string;
}

export function MyComponent({ children, className }: MyComponentProps) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
}
```

### CSS/Tailwind

- Use Tailwind CSS
- Prefira utility classes
- Use `cn()` para classes condicionais
- Suporte dark mode: `dark:` prefix

## 📦 Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

### Tipos

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não afeta código)
- `refactor:` Refatoração
- `test:` Adição/modificação de testes
- `chore:` Tarefas de manutenção

### Exemplos

```bash
feat: adiciona filtro por data em contas a pagar
fix: corrige validação de CPF
docs: atualiza README com novos endpoints
refactor: extrai lógica de formatação para utils
test: adiciona testes para useAuth hook
```

### Escopo (opcional)

```bash
feat(auth): implementa login com Google
fix(dashboard): corrige gráfico de receitas
```

## 🔄 Pull Requests

### Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Não há erros de lint ou type-check
- [ ] PR tem descrição clara

### Template de PR

```markdown
## Descrição

Breve descrição das mudanças.

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar

1. Passo 1
2. Passo 2
3. ...

## Screenshots (se aplicável)

## Checklist

- [ ] Testei localmente
- [ ] Adicionei/atualizei testes
- [ ] Atualizei documentação
```

## 🐛 Reportando Bugs

Use o template de issue para bugs:

```markdown
## Descrição do Bug

Descrição clara do problema.

## Como Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## Comportamento Esperado

O que deveria acontecer.

## Screenshots

Se aplicável.

## Ambiente

- OS: [ex: Windows 10]
- Browser: [ex: Chrome 120]
- Node: [ex: 20.10.0]
```

## 💡 Solicitando Features

Use o template de feature request:

```markdown
## Descrição da Feature

Descrição clara da funcionalidade desejada.

## Problema que Resolve

Qual problema esta feature resolve?

## Solução Proposta

Como você imagina a implementação?

## Alternativas Consideradas

Outras abordagens consideradas.

## Contexto Adicional

Qualquer informação adicional.
```

## 📚 Recursos

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest)

---

**Obrigado por contribuir! 🎉**

Se tiver dúvidas, abra uma issue ou entre em contato com os mantenedores.
