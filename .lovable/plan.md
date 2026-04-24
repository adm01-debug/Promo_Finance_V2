

## Links de âncora no cross-check ECF × ECD

Adicionar, em cada linha "Diverg." ou "Atenção" do painel **Cross-check ECF × ECD** (Step 3 do `SpedEcfWizard`), um botão de âncora que leva o usuário diretamente à seção do wizard relacionada — voltando ao Step correto e fazendo scroll até o elemento alvo.

### Mapeamento campo → destino

| Campo (cross-check)             | Destino                                        | Step | Ancor id              |
|--------------------------------|------------------------------------------------|------|------------------------|
| Período                        | Bloco de metadados (Step 1)                    | 1    | `wz-meta-periodo`      |
| CNPJ                           | Bloco de metadados (Step 1)                    | 1    | `wz-meta-cnpj`         |
| Hash SHA-256                   | Bloco "ECD vinculada localizada" (Step 1)      | 1    | `wz-ecd-hash`          |
| Status da ECD vinculada        | Bloco "ECD vinculada localizada" (Step 1)      | 1    | `wz-ecd-status`        |
| Pontos do checklist (item.id)  | Linha correspondente em `SpedChecklistRow`     | 2    | `wz-checklist-${id}`   |

### O que vai mudar

**`src/components/contabilidade/SpedEcfWizard.tsx`**

1. **Adicionar `id` nos elementos-alvo** já existentes:
   - `MetaField` Período → wrapper com `id="wz-meta-periodo"`.
   - `MetaField` CNPJ → wrapper com `id="wz-meta-cnpj"`.
   - Bloco "ECD vinculada localizada": Hash → `id="wz-ecd-hash"`; Status → `id="wz-ecd-status"`.
2. **Estender o tipo `DivergRow`** com um campo opcional `anchor?: { step: 1 | 2 | 3; targetId: string }` e popular para Período, CNPJ, Hash, Status da ECD.
3. **Botão "Ir para seção"** na coluna Status (ou ao lado do `detalhe`), exibido **apenas quando** `row.tone === 'destructive' || row.tone === 'warning'` e `row.anchor` existe. Ícone `ArrowUpRight` + texto "Ir para".
4. **Ações do checklist (Step 2)**: cada item em `checklistAlertas` ganha um botão "Ir para seção" com âncora `wz-checklist-${c.id}`. Em `SpedChecklistRow`, propagar `id` para o wrapper `<div>` do item.
5. **Helper `goToAnchor(step, targetId)`**:
   - Se `step !== currentStep` → `setStep(step)`.
   - Aguarda `requestAnimationFrame` (até a `AnimatePresence` montar) e então `document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
   - Aplica classe temporária `row-highlight-flash` (já existe no projeto, usada em `useHighlightFromUrl`) por 3s para destacar o alvo.
6. **Acessibilidade**: o botão é um `<button type="button">` com `aria-label="Ir para a seção {label} no passo {N}"`.

**`src/components/contabilidade/SpedChecklistRow.tsx`**

- Aceitar prop opcional `id?: string` e aplicá-la no wrapper externo do `Collapsible`, para servir de alvo das âncoras `wz-checklist-${item.id}`.

### Notas técnicas

- Nenhuma mudança de roteamento/URL. As âncoras são internas ao `Dialog` do wizard.
- O `setStep` reaproveita o mecanismo já existente de persistência de rascunho (`localStorage`) — não precisa tocá-lo.
- Reaproveita a classe utilitária `row-highlight-flash` já presente no projeto, mantendo consistência visual com o `useHighlightFromUrl`.
- Mudança restrita a 2 arquivos; sem impacto no `SpedEcdWizard` (que não tem painel de cross-check).

