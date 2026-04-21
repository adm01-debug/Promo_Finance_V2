

## Plano — Finalizar SpedContabilTab: Wizard ECF + Cross-check com ECD

### Estado atual

- **ECD**: wizard completo (`SpedEcdWizard`) com 3 passos (período → checklist → download/hash/zip). Edge `gerar-sped-ecd` suporta `mode: 'validate' | 'generate'` e bloqueia geração com erros.
- **ECF**: ainda usa o botão simples direto. Edge `gerar-sped-ecf` faz cross-check (busca ECD do mesmo período) mas não expõe isso de forma estruturada e não suporta modo `validate`.
- **Build**: o "erro de build" reportado é o 500 de `external-data` (secrets `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_SERVICE_KEY`) — já tratado em mensagem anterior; basta o usuário preencher.
- **Histórico**: tabela `sped_contabil_arquivos` já tem campo `recibo_transmissao` e status `transmitido`, mas a UI não permite registrar transmissões manualmente.

### O que será implementado

**1. Edge `gerar-sped-ecf` — modo `validate` + checklist estruturado + bloqueio**

Espelhar o padrão da ECD:
- Aceitar `mode: 'validate' | 'generate'` (default `generate`).
- Construir array `checklist: ChecklistItem[]` com 7 itens:
  - ✓/✗ Dados da empresa (CNPJ + razão social)
  - ✓/✗ Pelo menos 1 lançamento contábil no período
  - ✓/✗ **ECD do mesmo período localizada** (cross-check) — detalhe mostra hash curto e recibo se houver
  - ⚠ Lucro líquido coerente (≠ 0 quando há receita/despesa)
  - ⚠ % de contas analíticas com `codigo_referencial` CFC (recomendado para J051)
  - ⚠ Cross-check K355 (saldos) vs L100 (balanço) — divergência tolerada até R$ 0,01
  - ✓/✗ Apuração IRPJ/CSLL com base ≥ 0
- Em `mode='validate'`: retorna `{ mode, empresa, periodo, total_lancamentos, checklist, validacoes, ecd_referencia, apuracao_preview }` — **sem** gerar TXT, sem upload, sem insert no histórico.
- Em `mode='generate'`: se `erros.length > 0`, retorna **422** com `{ error, checklist, validacoes }`. Caso contrário, segue fluxo atual + retorna `checklist`, `empresa` e `periodo` no payload (para o passo 3 do wizard).

**2. Novo `SpedEcfWizard.tsx`**

Dialog de 3 passos espelhando o ECD:
- **Passo 1 — Período & ECD vinculada**: card com empresa, CNPJ, ano, total de lançamentos. Card destacado mostrando ECD encontrada (hash curto, data de geração, status, recibo se houver) ou alerta vermelho se ausente.
- **Passo 2 — Checklist + Apuração preview**: usa `ChecklistRow` (extraído para arquivo próprio) + card "Apuração preliminar" com `lucro_liquido`, `base_irpj`, `irpj` (15% + adicional 10%), `csll` (9%) calculados pela edge.
- **Passo 3 — Geração & Download**: igual ao ECD (file_name, total_linhas, hash com botão copiar, botões `.txt` e `.zip`) + bloco **"Registrar transmissão"** (form inline com campo `recibo_transmissao` + botão "Marcar como transmitido").

**3. Refator: extrair `ChecklistRow`**

Mover de `SpedEcdWizard.tsx` para `src/components/contabilidade/SpedChecklistRow.tsx` e reusar nos dois wizards (DRY).

**4. Hooks novos em `useSpedContabil.ts`**

```ts
useSpedEcfValidacao()           // mutation para gerar-sped-ecf com mode:'validate'
useRegistrarTransmissaoSped()   // UPDATE em sped_contabil_arquivos: status='transmitido' + recibo_transmissao
```

`useGerarSpedContabil` já suporta flag `silent` — reusado para a ECF.

**5. Integração `SpedContabilTab`**

- `tipo='ECF'`: substituir botão direto por **"Abrir wizard de geração SPED ECF"** que abre `SpedEcfWizard`.
- Tabela de histórico ganha:
  - Coluna **Recibo** (badge verde com nº truncado quando preenchido).
  - Ação extra **"Registrar transmissão"** quando `status !== 'transmitido'` — abre pequeno dialog inline com input do recibo.

### Arquivos

- ✏️ `supabase/functions/gerar-sped-ecf/index.ts` — modo `validate` + checklist estruturado + bloqueio em erros + retorno de `ecd_referencia`/`apuracao_preview`/`checklist`/`empresa`/`periodo`
- ✏️ `src/hooks/useSpedContabil.ts` — `useSpedEcfValidacao` + `useRegistrarTransmissaoSped` + tipos `SpedEcfValidacaoResult`
- ✏️ `src/components/contabilidade/SpedContabilTab.tsx` — abre wizard ECF; coluna Recibo + ação "Registrar transmissão"
- ✏️ `src/components/contabilidade/SpedEcdWizard.tsx` — substituir `ChecklistRow` interno pelo import compartilhado
- ➕ `src/components/contabilidade/SpedEcfWizard.tsx` — wizard 3 passos
- ➕ `src/components/contabilidade/SpedChecklistRow.tsx` — componente reusável

### O que NÃO muda

- Sem migration — `sped_contabil_arquivos` já tem `recibo_transmissao` e status `transmitido`.
- Sem novo bucket — usa `relatorios-tributarios`.
- `sped-zip.ts` reusado como está.
- Geração TXT da ECF preservada.

### Critério de pronto

1. Em `/contabilidade` → aba "SPED ECF", o botão abre wizard de 3 passos.
2. Passo 1 mostra card destacado com a ECD vinculada (ou alerta vermelho se ausente).
3. Passo 2 exibe checklist ✓/⚠/✗ incluindo cross-check ECD + card de apuração preliminar (lucro líquido, base, IRPJ, CSLL).
4. Erros bloqueiam o passo 3; avisos não bloqueiam.
5. Passo 3 mostra hash SHA-256 com "Copiar", botões `.txt` e `.zip`, e formulário "Registrar transmissão" (grava recibo + status `transmitido`).
6. Histórico passa a mostrar coluna Recibo e badge "Transmitido" quando aplicável; ação extra "Registrar transmissão" disponível.
7. Edge ECF em `mode:'validate'` não cria arquivo nem grava em `sped_contabil_arquivos`.
8. Sem regressão no wizard ECD (apenas import do `ChecklistRow` movido).

