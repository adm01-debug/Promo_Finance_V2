# Banco Inter — levantamento da API e plano de integração

> Levantado em 2026-11-17 direto da documentação oficial (`developers.inter.co`, páginas
> renderizadas com Playwright porque o portal é SPA e `curl` devolve só o shell).
> **Hoje não existe nenhuma integração com o Inter no sistema** — 0 ocorrência de `inter`
> em `supabase/functions/`, nenhuma tabela, nenhum secret.

## 1. Escopo

As três planilhas enviadas pelo dono (`01 - API - Banco Inter`, `02 - Requisitos`,
`03 - Campos`) estão **vazias**: só cabeçalho. A única informação concreta são os links da
planilha 01, que apontam para exatamente duas APIs:

- `nossas-apis#api-pix`
- `nossas-apis#api-cobrança-boleto-com-pix`

Para um módulo financeiro com `contas_receber`, o que entrega valor primeiro é
**emitir cobrança (boleto com Pix) a partir de uma conta a receber e dar baixa automática
pelo webhook**. É esse o escopo deste levantamento. Extrato (`extrato.read`) e pagamento
ficam fora — a planilha não os cita.

## 2. Autenticação

| item | valor |
|---|---|
| Token | `POST https://cdpj.partners.bancointer.com.br/oauth/v2/token` (sandbox: `https://cdpj-sandbox.partners.uatinter.co/oauth/v2/token`) |
| Corpo | `application/x-www-form-urlencoded`: `client_id`, `client_secret`, `grant_type=client_credentials`, `scope` |
| Escopos desta integração | `boleto-cobranca.write boleto-cobranca.read` (múltiplos separados por espaço) |
| Resposta | `{ access_token, token_type, expires_in, scope }` |
| Validade | **1 hora** — o token tem de ser reaproveitado, não pedido por requisição |
| Rate limit | 5 chamadas/min no endpoint de token |
| Pré-requisito | ser cliente **Inter PJ**; a aplicação e os escopos são criados no Internet Banking |

**mTLS é obrigatório.** O portal tem página dedicada (`docs/introducao/autenticacao-mtls`):
toda chamada exige certificado de cliente (chave pública + privada), além do
`client_id`/`client_secret`.

Isso **não** exige arquitetura nova: o projeto já faz mTLS em Edge Function —
`supabase/functions/_shared/sefaz/pfx.ts` converte o A1 PFX em PEM e
`supabase/functions/sefaz-dfe-puxar/index.ts:189` monta
`Deno.createHttpClient({ cert, key })`. O mesmo padrão serve para o Inter.
**NÃO VERIFICADO:** esse caminho nunca rodou de verdade em produção —
`empresas_certificados` tem **0 linhas**. Então a primeira coisa a fazer, antes de
escrever a emissão, é provar `Deno.createHttpClient` contra o sandbox do Inter.

## 3. Emitir cobrança

`POST /cobranca/v3/cobrancas` — escopo `boleto-cobranca.write`, 120 chamadas/min.
Header opcional `x-conta-corrente` (só números, com dígito, sem zeros à esquerda).

Obrigatórios:

| campo | tipo | observação |
|---|---|---|
| `seuNumero` | string ≤ **15** chars | nosso identificador; é a amarra com `contas_receber` |
| `valorNominal` | number | **mínimo 2,50**, máximo 99.999.999,99 |
| `dataVencimento` | `YYYY-MM-DD` | vencimento no mesmo dia só até **19h59** |
| `numDiasAgenda` | int 0–60 | dias após o vencimento para cancelamento automático |
| `pagador` | objeto | `cpfCnpj`, `tipoPessoa` (`FISICA`/`JURIDICA`), `nome`, `endereco`, `bairro`, `cidade`, `uf`, `cep`; opcionais `email`, `ddd`, `telefone`, `numero`, `complemento` |

Opcionais relevantes: `desconto`, `multa`, `mora`, `mensagem` (5 linhas),
`beneficiarioFinal`, `notaFiscal` e `formasRecebimento` (default `["BOLETO","PIX"]`;
`SEM_FORMA_PAGAMENTO` desliga a baixa automática; **só PIX não é aceito** aqui — para Pix
com vencimento puro é a API Pix).

A emissão é **assíncrona**: devolve `codigoSolicitacao` e o resultado chega pelo webhook
(ou por consulta ativa com esse código).

**Idempotência do próprio Inter:** `seuNumero` + `valorNominal` + `dataVencimento` +
`cpfCnpj` do pagador formam a chave, válida por **30 minutos** — reenvio idêntico nesse
intervalo é recusado. Isso casa com os índices anti-duplicata de `contas_receber`.

## 4. Webhook

| item | valor |
|---|---|
| Cadastro | `PUT /cobranca/v3/cobrancas/webhook`, corpo `{ "webhookUrl": "https://..." }` (só HTTPS), resposta 204 |
| Escopo | `boleto-cobranca.write` (cadastro), `boleto-cobranca.read` (consulta) |
| Rate limit | 5 chamadas/min |
| Reentrega | até **4 tentativas** em 20, 30, 60 e 120 minutos se o endpoint falhar |

O callback chega como **array** de objetos:

```json
[{ "codigoSolicitacao": "...", "seuNumero": "...", "situacao": "RECEBIDO",
   "dataHoraSituacao": "2019-08-24T14:15:22Z", "valorTotalRecebido": "...",
   "origemRecebimento": "BOLETO", "nossoNumero": "...", "codigoBarras": "...",
   "linhaDigitavel": "...", "txid": "...", "pixCopiaECola": "..." }]
```

`situacao` ∈ `RECEBIDO`, `A_RECEBER`, `MARCADO_RECEBIDO`, `ATRASADO`, `CANCELADO`,
`EXPIRADO`, `FALHA_EMISSAO`, `EM_PROCESSAMENTO`, `PROTESTO`.

Consulta de coleção: `GET /cobranca/v3/cobrancas` com `dataInicial`/`dataFinal`
obrigatórios, `filtrarDataPor` (`VENCIMENTO`|`EMISSAO`|`PAGAMENTO`), `situacao`,
`seuNumero`, paginação (`paginacao.itensPorPagina` ≤ 1000, `paginacao.paginaAtual`).

## 5. Como encaixa neste sistema

1. **Secrets** (nunca em código): `INTER_CLIENT_ID`, `INTER_CLIENT_SECRET`,
   `INTER_CONTA_CORRENTE`, `INTER_AMBIENTE` (`sandbox`|`producao`) e o certificado
   (mesmo caminho do A1: Storage privado + chave de descriptografia em secret, como
   `_shared/sefaz/pfx.ts` já faz).
2. **Tabela** `inter_cobrancas`: `empresa_id` (RLS por `empresa_acessivel`),
   `conta_receber_id` FK, `seu_numero` (único por empresa), `codigo_solicitacao`,
   `situacao`, `valor_nominal`, `data_vencimento`, `nosso_numero`, `linha_digitavel`,
   `codigo_barras`, `pix_copia_e_cola`, `txid`, `valor_total_recebido`,
   `data_hora_situacao`, `payload_ultimo_callback jsonb`, timestamps.
3. **Edge function `inter-cobranca-emitir`**: `validatePayload` com Zod (gate do CI),
   `verify_jwt` ligado, token em cache de 1h, `Deno.createHttpClient` com o certificado,
   grava a linha e devolve `codigoSolicitacao`.
4. **Edge function `inter-cobranca-webhook`**: `verify_jwt` **desligado** (o Inter chama sem
   JWT) — e por isso precisa de **guarda própria**, como manda `SECURITY_RULES.md:58-66`.
   Zod valida formato, não origem.

   A doc do Inter **não prevê HMAC nem header de assinatura** no callback: o único
   parâmetro do cadastro é `webhookUrl` e o Inter não envia header customizado (conferido
   na seção "Validar webhook" da referência). Logo o padrão do Asaas (`asaas-access-token`
   em header, `asaas-webhook/index.ts:40`) não se aplica aqui. A guarda tem de viajar
   **na própria URL registrada**:

   - secret `INTER_WEBHOOK_TOKEN` de alta entropia, gerado por nós, nunca em código;
   - cadastro com `webhookUrl = https://<projeto>.supabase.co/functions/v1/inter-cobranca-webhook?t=<INTER_WEBHOOK_TOKEN>`;
   - a função compara o `t` recebido com o secret em **tempo constante** e devolve 401 sem
     corpo quando não casa — antes de ler payload, antes de qualquer escrita;
   - rate limit defensivo, como o `asaas-webhook/index.ts:74`, em defesa em profundidade;
   - idempotência por `codigoSolicitacao` + `dataHoraSituacao`, para as 4 reentregas do
     Inter não baixarem a mesma conta duas vezes;
   - só então, em `RECEBIDO`, baixa a `contas_receber`.

   Antes do merge, a função entra na tabela de `verify_jwt = false` documentadas do
   `SECURITY_RULES.md`, com a justificativa "validação por token na URL registrada no
   Inter (a API não assina o callback)". Sem essa guarda seria endpoint público capaz de
   dar baixa em conta a receber — não vai assim.
5. **UI**: botão "Emitir boleto" na conta a receber + coluna com a situação e o
   `linhaDigitavel`/`pixCopiaECola` para copiar.

## 6. O que falta para sair do papel

Tudo abaixo só o dono consegue — nada disso é obtível por MCP:

1. Confirmar que a conta é **Inter PJ** e criar a aplicação no Internet Banking com os
   escopos `boleto-cobranca.write` e `boleto-cobranca.read`.
2. `client_id` e `client_secret` da aplicação (entram por secret, nunca em código).
3. O **certificado mTLS** emitido junto da aplicação (`.crt`/`.key` ou `.pfx` + senha).
4. Dizer se começamos no **sandbox** (`cdpj-sandbox.partners.uatinter.co`) ou direto em
   produção.

Com isso, a ordem de execução é: provar `Deno.createHttpClient` contra o sandbox →
migration da tabela → `inter-cobranca-emitir` → `inter-cobranca-webhook` → botão na UI.
