# Matriz RLS negativa — o que o banco DEVE negar

> Matriz de expectativa negativa: cada linha é um acesso que **tem que
> falhar** em produção. Serve como contrato para testes de segurança e para
> revisão de novas migrations — uma tabela nova com `empresa_id` entra aqui.
>
> Fatos verificados em `supabase/migrations/` (out/2026):
>
> - **Toda tabela que declara `empresa_id` tem `ENABLE ROW LEVEL SECURITY`**
>   (grep sobre as 600+ migrations — zero exceção encontrada).
> - ~250 tabelas com RLS habilitado; ~160 famílias de policies.
> - Tabelas sem `empresa_id` são de sistema/referência/autenticação
>   (catálogos fiscais, locks, logs de edge, integrações) — seção 3.

## 1. Núcleo financeiro multi-tenant

Todas as tabelas abaixo carregam `empresa_id` e são acessadas pelo PostgREST
com o JWT do usuário. A negação esperada é a mesma família a família:

| Família de tabelas                                                   | Cross-empresa SELECT | Cross-empresa INSERT/UPDATE/DELETE | Anônimo (sem JWT) | Outro papel na MESMA empresa                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | -------------------- | ---------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contas_pagar`, `contas_receber`                                     | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `transacoes_bancarias` (escopo via `conta_bancaria_id`→empresa)      | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `contas_bancarias`                                                   | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `clientes`, `fornecedores`, `contatos_financeiros`                   | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `notas_fiscais`, `nfe_recebidas`, `nfe_eventos`, `notas_fiscais_ocr` | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `conciliacoes*`, `regras_conciliacao`, `conciliacao_sugestoes`       | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `categorias`, `centros_custo`, `plano_contas`                        | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `apuracoes_*`, `simulacoes`, `gerar_*` fiscais, `auditoria_*`        | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `asaas_*`, `bling_*`, `bitrix24_*` (espelhos de provedor)            | negado               | negado                             | negado            | `visualizador`: só leitura                                                                                                                                                                                                               |
| `anexos_financeiros`                                                 | negado               | negado                             | negado            | linha escopada por **proprietário** (`auth.uid() = user_id`) — sem `empresa_id`; colega da mesma empresa NÃO lê                                                                                                                          |
| `storage.objects` bucket `financeiro`                                | **GAP (P1)**         | negado                             | negado            | **SELECT/DELETE abertos a qualquer `authenticated`** — policies `anexos_financeiro_{leitura,remocao}_autenticada` usam só `bucket_id='financeiro'`; INSERT bloqueado (só edge fn)                                                        |
| `user_empresas`, `convites`, `empresas`                              | negado               | negado (só admin)                  | negado            | `admin` gerencia; outros leem a própria linha                                                                                                                                                                                            |
| `alertas*`, `acoes_recomendadas`, `insights*`                        | negado               | negado                             | negado            | leitura por vínculo                                                                                                                                                                                                                      |
| `empresas_certificados` (cert. A1)                                   | negado               | negado                             | negado            | **GAP (P2)**: `cert_empresa_read` (SELECT p/ membros do tenant, sem proteção de coluna) expõe o **ciphertext** `password_encrypted` — metadado ok, mas o material cifrado sai pelo PostgREST; sigilo real = só a master key das edge fns |

Notas da família:

- A política base repete o padrão `empresa_id IN (SELECT empresa_id FROM
user_empresas WHERE user_id = auth.uid() AND ativo)` — se uma migration
  nova criar policy com `USING (true)`, ela viola esta matriz.
- `transacoes_bancarias` é a exceção ao padrão: o escopo é
  `conta_bancaria_id IN (SELECT id FROM contas_bancarias WHERE empresa_id IN
user_empresas do usuário)`, somado à policy de papel financeiro/admin.
- **Gap P1 registrado:** no bucket `financeiro` o SELECT/DELETE de
  `storage.objects` vale para qualquer `authenticated` (policy por
  `bucket_id` apenas, sem prefixo `empresa_id/`). Um usuário logado da
  empresa A pode ler/apagar anexos da empresa B — correção de policy
  pendente (restringir por prefixo de path).
- `visualizador` lendo não pode escrever: policies `FOR ALL` de escrita
  exigem `role IN ('admin','financeiro','contador')`.
- Secrets (`integration_secrets`, `empresas_certificados`)
  têm policy de negação total para `authenticated` — acesso só via
  `service_role` dentro de edge fn. Exceção: `scim_tokens` é
  gerenciável por quem tem papel global `admin` autenticado
  (`Admins manage scim_tokens`, FOR ALL) — não-admin autenticado nega.

## 2. Tabelas de autenticação/conta (escopo por usuário)

| Tabela                                                                                          | Expectativa negativa                                                                                                       |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `login_attempts`, `known_devices`, `account_lockouts`, `new_device_alerts`, `acessos_suspeitos` | usuário não lê o rastro de OUTRO usuário; anônimo nega                                                                     |
| `password_reset_requests`, `convites`                                                           | token não cruzável: validar o convite de outra empresa/expirado nega                                                       |
| `sso_providers`, `scim_tokens`                                                                  | não-admin nega; `scim_tokens` acessível só a `authenticated` com papel global `admin` (não é invisível a todo autenticado) |
| `audit_log`, `auth_logs`, `audit_logs*`                                                         | leitura só do próprio tenant; sem escrita pelo cliente                                                                     |

## 3. Tabelas de sistema/referência (sem `empresa_id`)

Não são multi-tenant — a negação aqui é de **escrita**, não de escopo:

| Grupo               | Tabelas (exemplos)                                                             | Expectativa                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogos fiscais   | `aliquotas_*`, `faixas_simples_nacional`, `cnaes`, `ncm`, `ibpt`, `municipios` | leitura liberada a autenticado; **INSERT/UPDATE/DELETE negado** ao cliente                                                                                                   |
| Infra/logs internos | `edge_function_logs`, `bloat_snapshots`, `integrity_alerts`                    | escrita só via service_role; leitura restrita a admin                                                                                                                        |
| Telemetria do app   | `frontend_error_logs`, `frontend_performance_logs`                             | INSERT liberado a `authenticated`: error_logs com `auth.uid()=user_id` ou `user_id` nulo; performance_logs com `auth.uid()` não nulo. SELECT só admin; UPDATE/DELETE negados |
| Rate-limit/controle | `cnpja_rate_limit`, `blocked_ips`, `allowed_ips`, `ci_security_gate_events`    | acesso só service_role; cliente nega leitura e escrita                                                                                                                       |
| Organizações        | `organizacoes`, `organizacao_membros`                                          | escopo por `organizacao_id` — membro de outra org nega                                                                                                                       |

## 4. Views `security_invoker`

`vw_edge_health`, `vw_*` fiscais/relatório: criadas com
`security_invoker = true` — a RLS da tabela-base vale para o chamador.
Expectativa negativa idêntica à da tabela subjacente.

## 5. Como testar cada linha

```sql
-- Cross-empresa (usuário A lendo empresa B): autentica como A e executa
SELECT count(*) FROM contas_pagar WHERE empresa_id = '<empresa-B>';  -- esperado: 0
-- Anônimo: role anon + sem JWT
SET LOCAL ROLE anon;  SELECT * FROM contas_receber LIMIT 1;         -- esperado: 0 linhas
-- Escrita de visualizador:
-- JWT de user com role='visualizador' na empresa X:
UPDATE contas_pagar SET status='pago' WHERE id='<id>';              -- esperado: 0 rows / RLS violation
```

Cobertura existente: os gates atuais validam policies em nivel de lint
(`Supabase DB Linter` no CI) e testes de autorização nas edge fns
(`auth-guard_test.ts`, `asaas-proxy/index.test.ts`). Um E2E que execute a
matriz acima contra staging segue como melhoria pendente — esta matriz é o
contrato que ele deve verificar.
