

## Plano — Filtros padronizados + exportação CSV/PDF nas abas de Compliance

### Estado atual

- `AuditFiltersBar` já é usado pelas 3 abas que dependem de `TrilhaTable` (Financeira, Tributária, Sistema) — bom.
- `ConformidadeFiscalTab` e `EvidenciasTab` têm filtros próprios (não padronizados).
- `TrilhaTable` exporta CSV mas **não PDF**, e a exportação ignora paginação (só exporta a página atual de 50).
- Falta filtro de **usuário** dedicado em todas as abas.

### Mudanças

**1. `AuditFiltersBar` — incluir filtro de usuário**
- Adicionar campo "Usuário" (Select assíncrono populado de `profiles.email` distintos vindos das tabelas de auditoria) — opcional, controlado por prop `mostrarUsuario`.
- Estender `FiltrosState` com `usuario?: string`.
- Manter retrocompat com chamadas atuais.

**2. `useTrilhaAuditoria` — aplicar filtro de usuário + suportar fetch completo para export**
- Adicionar `usuario` aos filtros: mapeia para `user_email.eq` (sistema/tributária) ou `user_id` (financeira via join — usar `user_email` quando disponível).
- Novo helper `fetchTrilhaAuditoriaCompleto(tipo, filtros)` (sem paginação, cap 5000 linhas) reutilizado pela exportação.

**3. `TrilhaTable` — exportação CSV + PDF do resultado filtrado completo**
- Substituir botão único "Exportar CSV" por componente `<ExportMenu>` (CSV + PDF) já existente em `src/components/ui/export-menu.tsx`.
- Onclick: chama `fetchTrilhaAuditoriaCompleto` (com mesmos filtros), monta linhas, dispara `exportToCSV`/`exportToPDF` de `@/lib/export-utils`.
- Nome do arquivo inclui `tipo + período` (ex.: `trilha-sistema-2026-04-01_2026-04-21.csv`).
- Loading state no botão durante o fetch completo.
- Título do PDF: "Trilha de Auditoria — {Tipo} ({inicio} a {fim})".

**4. `ConformidadeFiscalTab` — adotar `AuditFiltersBar`**
- Reescrever o cabeçalho de filtros para usar `AuditFiltersBar` (mostrarUsuario=false; ação opcional = status conformidade).
- Adicionar `<ExportMenu>` que exporta os checks visíveis (CSV + PDF).

**5. `EvidenciasTab` — adotar `AuditFiltersBar` (somente período + busca)**
- Filtra a lista de pacotes gerados por período de geração e usuário.
- `<ExportMenu>` para histórico de pacotes.

**6. Header da página `ComplianceAuditoria` — botão global "Exportar tudo"**
- Dropdown que dispara export CSV/PDF da aba ativa, repassando filtros atuais via context leve (`AuditFiltersContext`) ou via ref para a tab ativa.
- Implementação simples: cada aba expõe `exportRef` via `useImperativeHandle`; o header chama `exportRef.current.export('csv'|'pdf')`.

### Detalhes técnicos

- **Sem mudança de schema** — tudo client-side sobre as queries existentes.
- **Cap de export**: 5000 linhas; se total > cap, toast informa truncamento e sugere refinar período.
- **Respeito a escopo/RLS**: o fetch completo usa o mesmo client autenticado; RLS já restringe por papel — nada novo.
- **Performance**: fetch completo só dispara no clique de export (não em toda mudança de filtro).
- **Reutiliza `exportToCSV`/`exportToPDF`** de `@/lib/export-utils` (BOM UTF-8 já garantido para PT-BR).

### Arquivos tocados

- `src/components/compliance/AuditFiltersBar.tsx` — novo campo usuário + tipo `FiltrosState`.
- `src/hooks/useTrilhaAuditoria.ts` — filtro `usuario` + helper `fetchTrilhaAuditoriaCompleto`.
- `src/components/compliance/TrilhaTable.tsx` — `ExportMenu`, fetch completo, ref imperativa.
- `src/components/compliance/ConformidadeFiscalTab.tsx` — adotar `AuditFiltersBar` + `ExportMenu`.
- `src/components/compliance/EvidenciasTab.tsx` — adotar `AuditFiltersBar` + `ExportMenu`.
- `src/pages/admin/ComplianceAuditoria.tsx` — botão "Exportar" no header (opcional, fase 2).

### Critério de pronto

1. Todas as 5 abas exibem a mesma barra de filtros (período + busca + usuário + ação quando aplicável + presets 7/30/90d).
2. Em cada aba, dropdown "Exportar" gera CSV e PDF com **todos os registros filtrados** (não só a página visível), respeitando data, usuário e escopo.
3. Arquivo nomeado com tipo + período; PDF tem título informativo.
4. Filtro por usuário funciona nas 3 trilhas (Financeira, Tributária, Sistema).

