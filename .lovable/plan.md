

## Plano — Wizard de Geração SPED ECD com Checklist e Validações

### Estado atual

A aba `SpedContabilTab` (compartilhada por ECD/ECF) gera o arquivo direto em um clique, abre a URL assinada no navegador e apenas mostra um toast de sucesso/erro. A edge `gerar-sped-ecd` **já retorna** `validacoes.erros`, `validacoes.avisos`, `hash_sha256`, `total_linhas` e `total_lancamentos` — mas a UI não exibe nada disso de forma estruturada antes do download. Falta também um **modo "preview"** (validar sem gerar arquivo) e um checklist visual das pré-condições.

### O que será implementado

**1. Modo `validate` na edge `gerar-sped-ecd`**

Adicionar parâmetro opcional `mode: 'validate' | 'generate'` (default `generate`). Quando `validate`:
- Roda todas as validações atuais + checklist estendido (ver item 3).
- **Não monta o TXT** nem faz upload nem grava em `sped_contabil_arquivos`.
- Retorna `{ checklist, validacoes, total_lancamentos, periodo, empresa }` em poucos segundos.

Quando `generate`: comportamento atual + **bloqueia se houver erros** (retorna 422 com `validacoes`, sem fazer upload).

**2. Novo componente `SpedEcdWizard.tsx`**

Wizard de 3 passos dentro de um `Dialog` grande (substitui o botão atual de "Gerar e baixar SPED ECD"):

- **Passo 1 — Período & Empresa**: confirmação do ano-calendário, CNPJ, razão social. Mostra contagem de lançamentos encontrados (chamada leve à edge em modo `validate`).
- **Passo 2 — Checklist de validações**: lista verificável com ícones (✓ verde / ⚠ âmbar / ✗ vermelho):
  - CNPJ e razão social preenchidos
  - Plano de contas com pelo menos 1 conta analítica
  - Cada lançamento com débitos = créditos (mostra contagem de violações)
  - Lançamentos dentro do período
  - Numeração sequencial (gap = aviso)
  - % de contas analíticas com `codigo_referencial` CFC (aviso se < 100%)
  - Pelo menos 1 lançamento no período
  - Balancetes consistentes (débitos totais = créditos totais)
  
  Cada item expansível mostra a lista de itens problemáticos. Botão "Re-validar" recarrega.

- **Passo 3 — Geração & Download**:
  - Botão "Gerar arquivo" **disabled** se houver qualquer **erro** (avisos não bloqueiam, mas ficam destacados).
  - Após geração: card mostrando `file_name`, `total_linhas`, `total_lancamentos`, `hash_sha256` (com botão "Copiar hash"), badge de status.
  - Dois botões: **Download .txt** e **Download .zip** (zip gerado client-side com `JSZip` empacotando o TXT + um `README.txt` com hash e instruções de validação no PVA-ECD).
  - Alerta padrão "arquivo preliminar".

**3. Hook `useSpedEcdValidacao`**

Novo hook em `src/hooks/useSpedContabil.ts`:

```ts
useSpedEcdValidacao() // mutation que invoca gerar-sped-ecd com mode:'validate'
```

Reusar `useGerarSpedContabil` existente para o passo 3 (modo generate), apenas ajustando para **não abrir a URL automaticamente** quando chamado pelo wizard (passar flag `silent: true`). O botão de download fica explícito no UI do wizard.

**4. Geração do ZIP client-side**

- Adicionar dependência `jszip` (já comum no stack).
- Função `baixarZip(url, fileName, hash)`:
  1. Faz `fetch(url)` no TXT já assinado.
  2. Cria um ZIP com:
     - `<file_name>.txt`
     - `README.txt` contendo: nome empresa, CNPJ, período, hash SHA-256, instrução para validar no PVA-ECD.
  3. Dispara o download via `URL.createObjectURL(blob)`.

**5. Integração na aba**

`SpedContabilTab.tsx` (quando `tipo='ECD'`): substitui o botão atual de geração por **"Abrir wizard de geração"** que abre o `SpedEcdWizard`. O histórico abaixo (tabela `sped_contabil_arquivos`) permanece igual, ganhando 1 botão extra por linha: "Baixar como ZIP" (reutiliza a função do item 4).

Para `tipo='ECF'`: mantém o fluxo atual sem wizard (escopo do pedido é só ECD).

### Arquivos

- ✏️ `supabase/functions/gerar-sped-ecd/index.ts` (modo `validate` + bloqueio em `generate` quando erros)
- ✏️ `src/hooks/useSpedContabil.ts` (novo `useSpedEcdValidacao` + flag `silent` em `useGerarSpedContabil`)
- ✏️ `src/components/contabilidade/SpedContabilTab.tsx` (abre wizard quando tipo=ECD; novo botão ZIP no histórico)
- ➕ `src/components/contabilidade/SpedEcdWizard.tsx` (wizard 3 passos)
- ➕ `src/lib/sped-zip.ts` (helper para empacotar TXT+README em ZIP)
- 📦 Adicionar `jszip` ao `package.json`

### O que NÃO muda

- Sem migration (tabela `sped_contabil_arquivos` já guarda hash, validações, status).
- Sem novo bucket — usa `relatorios-tributarios`.
- ECF segue inalterado (escopo é ECD).
- Geração TXT atual é preservada — apenas envelopada pelo wizard.

### Critério de pronto

1. Em `/contabilidade` → aba "SPED ECD", o botão abre um wizard de 3 passos.
2. Passo 2 mostra checklist com ✓/⚠/✗ para cada validação, expansível com detalhes.
3. Avisos (ex.: contas sem código CFC) **não bloqueiam**, erros (ex.: lançamento desbalanceado) **bloqueiam** o passo 3.
4. Após geração, hash SHA-256 fica visível com botão "Copiar".
5. Botões "Baixar .txt" e "Baixar .zip" funcionam; ZIP inclui README com hash e instruções PVA.
6. Edge em `mode:'validate'` não cria arquivo nem grava em `sped_contabil_arquivos`.
7. Tabela de histórico ganha botão extra para baixar como ZIP em uma execução anterior.

