---
name: Benchmark Setorial
description: View materializada por regime tributário com p25/mediana/p75, refresh semanal via pg_cron, edge comparar-benchmark-setorial expõe posição percentil
type: feature
---
`mv_benchmark_setorial` agregada por regime (sem CNAE — coluna inexistente em empresas).
Refresh: `0 3 * * 0` (domingo 03:00). Acesso público revogado — somente service_role.
Edge `comparar-benchmark-setorial` retorna posição (abaixo_p25/mediana/acima_p75) + percentil + insights.
Hook `useBenchmarkSetorial` + widget `BenchmarkSetorialCard` no DashboardTributario.
