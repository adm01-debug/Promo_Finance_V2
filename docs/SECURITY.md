# Segurança

## Autenticação

- JWT tokens
- MFA disponível
- Session timeout: 24h

## Autorização

- Row Level Security (RLS)
- Permissões granulares
- Audit logs completo

## Proteção de Dados

- LGPD compliance
- Encryption at rest (AES-256)
- HTTPS obrigatório
- Backups diários automáticos (via Supabase)

## Backup e Recuperação

**Provedor:** Supabase Cloud (projeto `bwwbeyolnnzppeuhgkcd`)

**Política padrão:**
- Backups diários automáticos gerenciados pelo Supabase
- Retenção: **a confirmar no painel** — Supabase Free: 7 dias; Supabase Pro: 30 dias (com PITR opcional)
- PITR (Point-in-Time Recovery): **a verificar se habilitado** — requer plano Pro ou superior

**Status atual:**
- Restore testado: **NÃO** — pendente execução e documentação formal
- Procedimento de restore documentado: **NÃO** — pendente

**Ação pendente para o admin:**
1. Acessar [Settings > Backups](https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd/settings/backups) no painel Supabase
2. Confirmar retenção real e verificar se PITR está habilitado
3. Executar restore de teste em projeto de staging e documentar o procedimento aqui
4. Atualizar este arquivo com: retenção confirmada, data do último teste e responsável

> **Nota:** Sem restore testado, o backup não é garantia de recuperação. O teste deve ser realizado ao menos uma vez por trimestre.

**Regras completas de segurança:** ver [`SECURITY_RULES.md`](../SECURITY_RULES.md)

## Vulnerabilidades

Reportar: security@promo-finance.com
PGP Key: [link]

> Para regras detalhadas de RLS, Auth, API Keys, Edge Functions e checklist de merge, consulte [`SECURITY_RULES.md`](../SECURITY_RULES.md).

## Boas Práticas

- Use senhas fortes
- Ative MFA
- Não compartilhe credenciais
- Revise acessos regularmente
