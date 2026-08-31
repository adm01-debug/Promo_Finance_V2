-- Protótipo legado supersedido.
--
-- `mv_dashboard_metrics` nunca integrou o contrato canônico, não existe no
-- projeto bwwbeyolnnzppeuhgkcd e não possui consumidor no código. Mantê-la no
-- replay criaria drift em relação ao canônico. O arquivo permanece como marco
-- histórico, deliberadamente sem DDL.
DO $legacy_dashboard_matview$
BEGIN
  NULL;
END
$legacy_dashboard_matview$;
