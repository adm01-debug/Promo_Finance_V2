# NF-e com grupo IBS/CBS no Bling — o que a aplicação envia (etapa 51)

**Objetivo:** registrar os campos de tributação que o payload `criar_nfe` aceita/carrega hoje e responder se o grupo IBS/CBS sai do nosso payload ou do cadastro de produto do Bling.

**Lido em:** `main@0ff86af84` (28/11/2026).

## 1. Caminho do envio

> `criarNFe` não tem chamador em `src/` hoje: a tabela abaixo descreve o payload que o hook aceita e o passthrough do proxy, não um envio ativo (ver seção 5).

| Camada | Arquivo                                           | O que faz                                                                                                                       |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| UI     | `src/components/nfe/NovaNFeForm.tsx`              | Monta os itens, escolhe CST + cClassTrib por item e calcula o grupo IBS/CBS **localmente** (`calcularGrupoIbscbs`, `:19`)       |
| Hook   | `src/hooks/useBlingNFe.ts:311-323`                | `criarNFe(nfeData)` → `callBlingProxy('criar_nfe', { data: nfeData })`                                                          |
| Edge   | `supabase/functions/bling-proxy/index.ts:564-565` | `case 'criar_nfe': return await blingPost(accessToken, '/nfe', params.data, ...)` — **passthrough puro**, não reescreve o corpo |
| Bling  | `POST /nfe`                                       | Emissão da NF-e                                                                                                                 |

## 2. Campos por item do payload (`BlingNFeCreatePayload`, `useBlingNFe.ts:54-91`)

`produto.id`, `quantidade`, `valor`, `codigo`, `descricao`, `unidade`, `tipo`, `origem`, `informacoesAdicionais`.

No cabeçalho: `tipo`, `naturezaOperacao.id`, `contato.id`, `loja.id`, `parcelas[]`, `transporte`, `informacoesComplementares`, `observacoesInternas`, `dataOperacao`, `numeroDocumento`.

**Não existe** campo de `cst`, `cClassTrib`, `vBC`, `pCBS/vCBS`, `pIBSUF/vIBSUF`, `pIBSMun/vIBSMun` no tipo, e o `bling-proxy` não injeta nada.

## 3. Resposta à etapa 51: de onde vem o IBS/CBS

- A aplicação **calcula e exibe** o grupo por item (base = valor do item menos reduções; `src/lib/nfe/grupo-ibscbs-item.ts`), mas **não o transmite** ao Bling.
- Portanto, se a NF-e sair com o grupo IBSCBS, ele vem do **cadastro de produto / motor fiscal do próprio Bling** para aquele produto, não do nosso payload.
- Consequência prática: a decisão fiscal (CST + cClassTrib) marcada na nossa tela **não** chega ao Bling pelo `criar_nfe`. Para a nota sair conforme a NT 2025.002 (grupo obrigatório a partir de 03/08/2026, rejeição 1115), o produto precisa estar enquadrado no Bling ou o payload precisa passar a enviar o grupo.

**Status da evidência:** a leitura de código acima é verificada; o _request real de homologação_ que o plano pede (`doc + request real de teste`) **não foi executado** — depende de empresa Bling com CRT 3 em ambiente de teste e não há credencial de homologação configurada nesta sessão.

## 4. Como fechar a evidência (quando houver homologação)

1. Criar uma NF-e em homologação com produto sem enquadramento IBS/CBS e conferir se o Bling rejeita com 1115.
2. Enquadrar o produto no Bling e repetir: se a nota autorizar com grupo, confirma que a origem é o cadastro do produto.
3. Se o Bling não enquadrar sozinho, estender `BlingNFeCreatePayload.itens` com os campos do grupo e enviá-los no `criar_nfe` (o proxy é passthrough, não precisa mudar).

## 5. Onde a validação do grupo entra (e onde não entra)

São **dois caminhos distintos**, sem ligação entre si:

| Caminho                              | Como o grupo é tratado                                                                                                                                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulário local (`NovaNFeForm.tsx`) | Chama `preValidarIbscbs` (`NovaNFeForm.tsx:21,240`) e lista os achados na tela. A validação lê os itens da tela; o formulário **não transmite** (`handleSubmit` só avisa que a SEFAZ não está homologada).                                                            |
| XML autorizado do Bling              | `useBlingNFe.ts:244` → `guardar-xml-nfe-autorizada/index.ts` (sobe no bucket `nfe-xml`, extrai itens/grupo por `_shared/nfe/ibscbs.ts` e grava pela RPC `salvar_nfe_autorizada`, `:291`). **Não** chama a pré-validação — o XML já está autorizado quando chega aqui. |

- `criarNFe` não tem consumidor em `src/` hoje: `useBlingNFe.ts:311` e `useNFe.ts:25` declaram o mutation e o devolvem (`:418`, `:83`), mas nenhuma tela o chama.
- Consequência: a pré-validação protege o rascunho da nossa tela, **não** a emissão pelo Bling. O crédito (`origem='xml_destacado'` + `efeito_tributario`) só existe se o XML autorizado voltar com o grupo — o que mantém o item 3 acima como risco fiscal, não de UI.
