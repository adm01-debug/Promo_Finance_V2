

## Plano — Adicionar `/contabilidade` ao menu lateral

### Contexto

A rota `/contabilidade` já existe em `src/App.tsx` (protegida com roles `admin`/`financeiro`) e a página `Contabilidade.tsx` já contém as abas internas (Plano, Lançamentos, Razão & Diário, DRE & Balanço, **SPED ECD**, **SPED ECF**). Falta apenas o link de navegação na sidebar — hoje só `/demonstrativos` aparece no grupo Fiscal.

A pergunta sobre "alternar para o módulo de SPED quando aplicável" já é resolvida pela própria página: ao clicar no link e abrir `/contabilidade`, o usuário vê todas as abas, incluindo SPED ECD e SPED ECF. Não precisa de rota separada.

### Mudança

**`src/components/layout/sidebar/SidebarNavGroups.tsx`** — duas pequenas edições:

1. **Importar o ícone** `BookOpen` no bloco de imports do `lucide-react` (mesmo ícone usado no header da página `Contabilidade`).

2. **Adicionar o item de menu** dentro do grupo `'fiscal'` (id `Fiscal & Documentos`), logo após `Demonstrativos`:

   ```ts
   { label: 'Contabilidade & SPED', icon: BookOpen, href: '/contabilidade' },
   ```

### Por que neste grupo e nesta posição

- **Grupo Fiscal & Documentos** já agrega Notas Fiscais, Demonstrativos, Tributário — Contabilidade/SPED é continuação natural.
- **Após Demonstrativos** porque DRE/Balanço da página Demonstrativos espelham os dados contábeis; quem está em Demonstrativos provavelmente quer o livro contábil completo a seguir.

### Comportamento herdado (sem código extra)

- O item já fica **destacado quando ativo** (`bg-primary/10 text-primary` via lógica `isActive` existente).
- O grupo Fiscal **abre automaticamente** quando o usuário entra em `/contabilidade` (graças ao `hasActiveItem` no `useState` inicial dos grupos).
- Em modo **collapsed**, aparece tooltip "Contabilidade & SPED" no hover do ícone.
- Usuários sem role `admin`/`financeiro` veem o link, mas ao clicar caem na tela "Acesso Negado" do `ProtectedRoute` (consistente com o resto do app — não filtramos itens por role na sidebar hoje).
- A subnavegação SPED ECD/ECF é feita via **Tabs internas** da página, não via rota dedicada (alinhado ao padrão atual).

### Critério de pronto

1. Sidebar mostra "Contabilidade & SPED" em **Fiscal & Documentos**, com ícone livro.
2. Clicar leva a `/contabilidade` e a aba "Plano" abre por padrão.
3. As abas internas permitem alternar para SPED ECD e SPED ECF sem sair da rota.
4. Em rota ativa, o item fica destacado e o grupo Fiscal aparece expandido.
5. No modo collapsed da sidebar, tooltip exibe o nome correto.
6. `NavigationTracker` já registra "Contabilidade & SPED" em Recentes (entrada adicionada no turno anterior).
7. Sem regressão em outros grupos do menu.

### Arquivos

- ✏️ `src/components/layout/sidebar/SidebarNavGroups.tsx` — adiciona import `BookOpen` e o item de menu

