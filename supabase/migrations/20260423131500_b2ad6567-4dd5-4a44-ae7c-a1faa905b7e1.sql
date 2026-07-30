CREATE OR REPLACE VIEW public.vw_notification_history_duplicates
WITH (security_invoker = true)
AS
WITH ranked AS (
  SELECT
    nh.id,
    nh.user_id,
    nh.source,
    nh.source_ref,
    nh.channel,
    nh.title,
    nh.created_at,
    LAG(nh.created_at) OVER (
      PARTITION BY nh.user_id, nh.source, nh.source_ref, nh.channel
      ORDER BY nh.created_at
    ) AS prev_created_at
  FROM public.notification_history nh
  WHERE nh.source_ref IS NOT NULL
)
SELECT
  id,
  user_id,
  source,
  source_ref,
  channel,
  title,
  created_at,
  prev_created_at,
  EXTRACT(EPOCH FROM (created_at - prev_created_at))::int AS seconds_since_prev
FROM ranked
WHERE prev_created_at IS NOT NULL
  AND created_at - prev_created_at < INTERVAL '60 seconds';

COMMENT ON VIEW public.vw_notification_history_duplicates IS
'Auditoria: pares de notificações entregues no mesmo (user, source_ref, channel) em janela < 60s. Indica falha de dedup (ex.: realtime re-entregue após refresh sem honrar last_seen_at). RLS via security_invoker — usuário só vê o que já enxerga em notification_history.';