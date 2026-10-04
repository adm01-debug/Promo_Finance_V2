# Diagrama ER — núcleo financeiro

> Visão das relações do núcleo multi-empresa. Fonte: `supabase/migrations/`
> (200+ foreign keys apontam para `empresas` — é o hub do modelo).
> Mostra só as entidades centrais; tabelas de apoio/IA/tributário seguem o
> mesmo padrão `*_id → tabela(id)` + `empresa_id` obrigatório.

```mermaid
erDiagram
    empresas ||--o{ user_empresas : "membros"
    empresas ||--o{ contas_pagar : "tem"
    empresas ||--o{ contas_receber : "tem"
    empresas ||--o{ clientes : "tem"
    empresas ||--o{ fornecedores : "tem"
    empresas ||--o{ contas_bancarias : "tem"
    empresas ||--o{ centros_custo : "tem"
    empresas ||--o{ categorias : "tem"
    empresas ||--o{ asaas_payments : "tem"
    empresas ||--o{ asaas_customers : "tem"
    empresas ||--o{ notas_fiscais : "tem"
    empresas ||--o{ sso_providers : "tem"

    user_empresas }o--|| auth_users : "user_id"

    clientes ||--o{ contas_receber : "recebe de"
    fornecedores ||--o{ contas_pagar : "paga a"
    categorias ||--o{ contas_pagar : "classifica"
    categorias ||--o{ contas_receber : "classifica"
    centros_custo ||--o{ contas_pagar : "rateia"
    centros_custo ||--o{ contas_receber : "rateia"
    centros_custo ||--o{ centros_custo : "hierarquia (parent_id)"
    contas_bancarias ||--o{ transacoes_bancarias : "movimenta"
    contas_bancarias ||--o{ contas_pagar : "conta de pagamento"
    contas_bancarias ||--o{ contas_receber : "conta de recebimento"

    transacoes_bancarias }o--o| contas_pagar : "concilia (conta_pagar_id)"
    transacoes_bancarias }o--o| contas_receber : "concilia (conta_receber_id)"

    clientes ||--o{ asaas_customers : "espelha no Asaas"
    contas_receber ||--o{ asaas_payments : "cobra via"
    asaas_customers ||--o{ asaas_payments : "paga"
    asaas_payments ||--o{ asaas_transfers : "liquida via"

    notas_fiscais ||--o{ nfe_recebidas : "df-e SEFAZ"
    contas_pagar ||--o{ notas_fiscais : "origina de"

    contas_receber ||--o{ conciliacoes_parciais : "baixa parcial"
    contas_pagar ||--o{ conciliacoes_parciais : "baixa parcial"
    transacoes_bancarias ||--o{ conciliacoes_parciais : "compõe baixa"

    sso_providers ||--o{ scim_tokens : "provisiona com"

    empresas {
        uuid id PK
        string cnpj
        string razao_social
        boolean ativo
    }
    user_empresas {
        uuid id PK
        uuid user_id FK
        uuid empresa_id FK
        string role "admin|financeiro|contador|visualizador"
        boolean is_default
        string provisioned_via "manual|scim|convite"
    }
    contas_pagar {
        uuid id PK
        uuid empresa_id FK
        uuid fornecedor_id FK
        uuid categoria_id FK
        uuid centro_custo_id FK
        uuid conta_bancaria_id FK
        numeric valor
        date data_vencimento
        date data_pagamento
        string status "pendente|pago|cancelado|aprovacao"
        timestamptz updated_at "lock otimista"
    }
    contas_receber {
        uuid id PK
        uuid empresa_id FK
        uuid cliente_id FK
        uuid categoria_id FK
        uuid centro_custo_id FK
        uuid conta_bancaria_id FK
        numeric valor
        date data_vencimento
        date data_recebimento
        string status "pendente|recebido|cancelado"
        string etapa_cobranca
        timestamptz updated_at "lock otimista"
    }
    transacoes_bancarias {
        uuid id PK
        uuid conta_bancaria_id FK
        uuid conta_pagar_id FK "nullable"
        uuid conta_receber_id FK "nullable"
        date data
        numeric valor
        boolean conciliada
    }
    asaas_payments {
        uuid id PK
        uuid empresa_id FK
        string asaas_id
        uuid asaas_customer_id FK
        uuid conta_receber_id FK
        numeric valor
        string status
    }
```

## Invariantes de modelo (o que o diagrama garante)

- **Toda tabela de negócio tem `empresa_id`** — isolamento multi-tenant; a RLS
  nega cross-empresa (ver `RLS_MATRIZ_NEGATIVA.md`).
- **Baixa de conta é sempre via `transacoes_bancarias`** — conta paga/recebida
  sem transação conciliada é exceção manual, não o fluxo.
- **`contas_pagar.updated_at` / `contas_receber.updated_at`** são a versão do
  lock otimista — trigger `update_updated_at_column` os mantém.
- **Espelhos de provedor** (`asaas_*`, `bling_*`) guardam o id externo
  (`asaas_id`) + o vínculo interno (`conta_receber_id`) — reconciliação por
  webhook casa os dois.
- **`user_empresas` é a fronteira de autorização** — RLS e edge fns resolvem
  "usuário X pode acessar empresa Y" exclusivamente por ela.
