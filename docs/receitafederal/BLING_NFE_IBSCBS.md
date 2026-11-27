# NF-e com grupo IBS/CBS no Bling — o que a aplicação envia (etapa 51)

**Objetivo:** registrar os campos de tributação que o payload `criar_nfe` aceita/carrega hoje e responder se o grupo IBS/CBS sai do nosso payload ou do cadastro de produto do Bling.

**Lido em:** `main@0ff86af84` (28/11/2026).

## 1. Caminho do envio

| Camada | Arquivo | O que faz |
|---|---|---|
| UI | `src/components/nfe/NovaNFeForm.tsx` | Monta os itens, escolhe CST + cClassTrib por item e calcula o grupo IBS/CBS **localmente** (`calcularGrupoIbscbs`, `:19`) |
| Hook | `src/hooks/useBlingNFe.ts:311-323` | `criarNFe(nfeData)` → `callBlingProxy('criar_nfe', { data: nfeData })` |
| Edge | `supabase/functions/bling-proxy/index.ts:564-565` | `case 'criar_nfe': return await blingPost(accessToken, '/nfe', params.data, ...)` — **passthrough puro**, não reescreve o corpo |
| Bling | `POST /nfe` | Emissão da NF-e |

## 2. Campos por item do payload (`BlingNFeCreatePayload`, `useBlingNFe.ts:54-91`)

`produto.id`, `quantidade`, `valor`, `codigo`, `descricao`, `unidade`, `tipo`, `origem`, `informacoesAdicionais`.

No cabeçalho: `tipo`, `naturezaOperacao.id`, `contato.id`, `loja.id`, `parcelas[]`, `transporte`, `informacoesComplementares`, `observacoesInternas`, `dataOperacao`, `numeroDocumento`.

**Não existe** campo de `cst`, `cClassTrib`, `vBC`, `pCBS/vCBS`, `pIBSUF/vIBSUF`, `pIBSMun/vIBSMun` no tipo, e o `bling-proxy` não injeta nada.

## 3. Resposta à etapa 51: de onde vem o IBS/CBS

- A aplicação **calcula e exibe** o grupo por item (base = valor do item menos reduções; `src/lib/nfe/grupo-ibscbs-item.ts`), mas **não o transmite** ao Bling.
- Portanto, se a NF-e sair com o grupo IBSCBS, ele vem do **cadastro de produto / motor fiscal do próprio Bling** para aquele produto, não do nosso payload.
- Consequência prática: a decisão fiscal (CST + cClassTrib) marcada na nossa tela **não** chega ao Bling pelo `criar_nfe`. Para a nota sair conforme a NT 2025.002 (grupo obrigatório a partir de 03/08/2026, rejeição 1115), o produto precisa estar enquadrado no Bling ou o payload precisa passar a enviar o grupo.

**Status da evidência:** a leitura de código acima é verificada; o *request real de homologação* que o plano pede (`doc + request real de teste`) **não foi executado** — depende de empresa Bling com CRT 3 em ambiente de teste e não há credencial de homologação configurada nesta sessão.

## 4. Como fechar a evidência (quando houver homologação)

1. Criar uma NF-e em homologação com produto sem enquadramento IBS/CBS e conferir se o Bling rejeita com 1115.
2. Enquadrar o produto no Bling e repetir: se a nota autorizar com grupo, confirma que a origem é o cadastro do produto.
3. Se o Bling não enquadrar sozinho, estender `BlingNFeCreatePayload.itens` com os campos do grupo e enviá-los no `criar_nfe` (o proxy é passthrough, não precisa mudar).

## 5. Alternativa sem depender do Bling

`src/lib/nfe/pre-validar-ibscbs.ts` e `parse-ibscbs.ts` já validam/leem o grupo quando o XML autorizado volta (`useBlingNFe` → `xml-storage` → `registrar_nfe`), então o crédito (`origem='xml_destacado'`, `efeito_tributario`) só existe se o XML realmente trouxer o grupo — o que torna o item 3 acima um risco fiscal, não só de UI.