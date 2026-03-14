# 🚀 Guia de Deploy - Promo Finance

## Ambientes

### Development
- **URL:** http://localhost:5173
- **Branch:** develop
- **Deploy:** Automático via Git hooks

### Staging
- **URL:** https://staging.promo-finance.app
- **Branch:** staging
- **Deploy:** Automático via GitHub Actions

### Production
- **URL:** https://promo-finance.app
- **Branch:** main
- **Deploy:** Automático via GitHub Actions

---

## Cloudflare Pages Deploy

### Setup Inicial

1. **Criar projeto Cloudflare Pages**
```bash
npx wrangler pages project create finance-hub
```

2. **Configurar variáveis de ambiente**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
VITE_GA_ID
VITE_SENTRY_DSN
```

3. **Deploy manual**
```bash
npm run build:prod
npx wrangler pages deploy dist --project-name=finance-hub
```

### Deploy Automático

Cada push em `main` dispara workflow:
1. Run tests
2. Build production
3. Deploy to Cloudflare
4. Create Sentry release
5. Notify Slack

---

## Checklist Pre-Deploy

### Code Quality
- [ ] Todos os testes passando
- [ ] Lint sem erros
- [ ] Type check sem erros
- [ ] Coverage ≥ 80%

### Build
- [ ] Build local bem-sucedido
- [ ] Bundle size dentro do limite
- [ ] No console errors

### Database
- [ ] Migrations aplicadas
- [ ] Seed data (se necessário)
- [ ] Backups recentes

### Monitoring
- [ ] Sentry configurado
- [ ] Analytics configurado
- [ ] Health checks funcionando

---

## Rollback

### Via Cloudflare Dashboard
1. Acessar Cloudflare Pages
2. Selecionar deployment anterior
3. Clicar em "Rollback to this deployment"

### Via CLI
```bash
npx wrangler pages deployment list
npx wrangler pages deployment rollback <deployment-id>
```

### Via Git
```bash
git revert <commit-hash>
git push origin main
```

---

## Monitoring Pós-Deploy

### Métricas a Observar (30 min)
- Error rate (Sentry)
- Response time (Cloudflare Analytics)
- User reports
- Server logs

### Health Check
```bash
curl https://finance-hub.app/health
```

Expected: `200 OK`

---

## Troubleshooting

### Build Falha
```bash
# Limpar cache
rm -rf node_modules dist
npm ci
npm run build:prod
```

### Deploy Falha
1. Verificar logs no GitHub Actions
2. Verificar variáveis de ambiente
3. Verificar permissões Cloudflare

### Rollback Emergencial
```bash
# Revert último commit
git revert HEAD
git push origin main

# Ou rollback via Cloudflare
npx wrangler pages deployment rollback
```

---

## Scripts Úteis

```bash
# Deploy staging
npm run deploy:staging

# Deploy production
npm run deploy:prod

# Rollback
npm run rollback

# Health check
npm run health:check
```

---

## Changelog

Sempre atualizar CHANGELOG.md:
```markdown
## [1.2.0] - 2025-01-15
### Added
- Nova funcionalidade X
### Fixed
- Bug Y corrigido
### Changed
- Melhoria Z
```

---

**Lembre-se:** Nunca faça deploy em sexta-feira! 😄
