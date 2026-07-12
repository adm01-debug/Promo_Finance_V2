-- Índice para deduplicação eficiente por (type, order_id, created_at)
CREATE INDEX IF NOT EXISTS idx_alerts_dedup
  ON public.alerts (type, order_id, created_at DESC);

-- Seed de configurações padrão (canal inapp sempre ativo)
INSERT INTO public.alert_configurations (
  alert_type, channel, is_enabled, name, message_template,
  min_interval_seconds, config
) VALUES
  (
    'DRIVER_STOPPED', 'inapp', true,
    'Motorista parado',
    'Motorista {driver_name} parado há {stopped_minutes} min no pedido {order_ref}.',
    900,
    jsonb_build_object('stopped_minutes_threshold', 15, 'severity', 'WARNING')
  ),
  (
    'ROUTE_DEVIATION', 'inapp', true,
    'Desvio de rota',
    'Pedido {order_ref}: motorista {driver_name} fora da rota planejada.',
    600,
    jsonb_build_object('deviation_meters_threshold', 500, 'severity', 'WARNING')
  ),
  (
    'LATE_DELIVERY', 'inapp', true,
    'Entrega atrasada',
    'Pedido {order_ref} atrasado em {delay_minutes} min. Cliente: {customer_name}.',
    1800,
    jsonb_build_object('delay_minutes_threshold', 10, 'severity', 'CRITICAL')
  )
ON CONFLICT (alert_type, channel) DO NOTHING;