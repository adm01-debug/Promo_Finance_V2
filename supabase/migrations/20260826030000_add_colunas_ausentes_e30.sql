-- AVISO: arquivo histórico recuperado da fonte 489e7fc3732a2c5babc302f584e087f3969bef2d.
-- AVISO: esta migration não contém a DDL original de ADD COLUMN; ela preserva apenas o registro/ledger.
-- AVISO: portanto é um marcador não-replayável e incompleto, mantido aqui por rastreabilidade histórica.
-- E30: ADD 365 colunas ausentes em 76 tabelas BASE TABLE
-- Zero DROPs — todas colunas DST-only preservadas (verificado: têm código referenciando)
-- Somente BASE TABLE — views excluídas
-- Gerado: 2026-08-25T23:17:33Z
-- Fase 2: SET NOT NULL aplicado em 28 tabelas vazias
-- Fase 2 pulada em: elisao_alertas (5), elisao_regras_creditos (5), oportunidades_elisao (4)

-- APLICADO em bwwbey: 2026-08-25 23:18 UTC
-- Resultado: 3430 → 3795 colunas totais no DST

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260826030000','add_colunas_ausentes_e30')
ON CONFLICT (version) DO NOTHING;
