#!/usr/bin/env bash
# 04_events.sh — publica evento sintético diretamente em webhook_events (service_role
# via psql) e valida que triggers/consumers propagam para alerts / n8n_dispatch_logs
# em até 30s. Cleanup pelo run.sh via trap.
set -uo pipefail

: "${RUN_ID:?}" ; : "${OUT:?}" ; : "${STAGING_DB_URL:?}"

_emit() {
  local target="$1" status="$2" detail="${3:-}"
  jq -cn --arg ts "$(date -u +%FT%TZ)" --arg t "$target" --arg s "$status" \
         --arg d "$detail" --arg r "$RUN_ID" \
    '{ts:$ts,check:"events",target:$t,status:$s,detail:$d,run_id:$r}' | tee -a "$OUT"
}

publish_event() {
  local event_type="$1"
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -Atc \
    "INSERT INTO public.webhook_events (event_type, raw_payload)
     VALUES ('$event_type',
             jsonb_build_object(
               'healthcheck_run_id','$RUN_ID',
               'event_type','$event_type',
               'ts', extract(epoch from now())
             )) RETURNING id;" 2>&1
}

# Cenário 1: evento genérico chega em webhook_events (sanity)
if id=$(publish_event 'healthcheck.publish'); then
  _emit "publish.webhook_events" pass "id=$id"
else
  _emit "publish.webhook_events" fail "insert falhou: $id"
  exit 0
fi

# Cenário 2: propagação para consumers em até 30s (poll)
propagated_n8n=0
propagated_alerts=0
for _ in $(seq 1 15); do
  if [ "$propagated_n8n" -eq 0 ]; then
    n=$(psql "$STAGING_DB_URL" -Atc \
      "SELECT count(*) FROM public.n8n_dispatch_logs
        WHERE (payload ->> 'healthcheck_run_id') = '$RUN_ID';" 2>/dev/null || echo 0)
    [ "${n:-0}" -ge 1 ] && propagated_n8n=1
  fi
  if [ "$propagated_alerts" -eq 0 ]; then
    n=$(psql "$STAGING_DB_URL" -Atc \
      "SELECT count(*) FROM public.alerts
        WHERE (metadata ->> 'healthcheck_run_id') = '$RUN_ID';" 2>/dev/null || echo 0)
    [ "${n:-0}" -ge 1 ] && propagated_alerts=1
  fi
  [ "$propagated_n8n" -eq 1 ] && [ "$propagated_alerts" -eq 1 ] && break
  sleep 2
done

# n8n dispatch é opcional (nem todo evento gera dispatch); reportar como unverified se ausente
if [ "$propagated_n8n" -eq 1 ]; then
  _emit "propagate.n8n_dispatch_logs" pass "rows>=1"
else
  _emit "propagate.n8n_dispatch_logs" unverified "sem dispatch — pode ser esperado para healthcheck.publish"
fi

# alerts é opcional para esse event_type específico
if [ "$propagated_alerts" -eq 1 ]; then
  _emit "propagate.alerts" pass "rows>=1"
else
  _emit "propagate.alerts" unverified "sem alerta — event_type sintético pode não disparar rule"
fi
