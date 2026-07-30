-- checkpoint.sql — schema _migration criado APENAS no staging.
-- Idempotente: pode rodar múltiplas vezes.
CREATE SCHEMA IF NOT EXISTS _migration;

-- Restringir acesso: só service_role lê/escreve bookkeeping e snapshots.
REVOKE ALL ON SCHEMA _migration FROM PUBLIC;
GRANT USAGE ON SCHEMA _migration TO service_role;

CREATE TABLE IF NOT EXISTS _migration.runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at     timestamptz NOT NULL DEFAULT now(),
  ended_at       timestamptz,
  status         text NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running','done','failed','rolled_back')),
  manifest_hash  text,
  dry_run        boolean NOT NULL DEFAULT false,
  notes          text
);

CREATE TABLE IF NOT EXISTS _migration.checkpoints (
  run_id            uuid NOT NULL REFERENCES _migration.runs(id) ON DELETE CASCADE,
  table_name        text NOT NULL,
  group_name        text NOT NULL,
  rows_source       bigint,
  rows_copied       bigint NOT NULL DEFAULT 0,
  started_at        timestamptz,
  ended_at          timestamptz,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','running','done','failed','rolled_back','skipped')),
  batch_last_offset text,               -- último id/pk processado (texto p/ UUID e int)
  snapshot_table    text,               -- ex.: _migration.snap_<t>_<runid_short>
  error             text,
  PRIMARY KEY (run_id, table_name)
);

GRANT ALL ON ALL TABLES IN SCHEMA _migration TO service_role;

-- Garbage collector: drop snapshots de runs finalizados há > N dias
CREATE OR REPLACE FUNCTION _migration.gc(retention_days int DEFAULT 7)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = _migration, public, pg_temp
AS $$
DECLARE
  r record;
  dropped int := 0;
BEGIN
  FOR r IN
    SELECT c.snapshot_table
      FROM _migration.checkpoints c
      JOIN _migration.runs        u ON u.id = c.run_id
     WHERE c.snapshot_table IS NOT NULL
       AND u.ended_at IS NOT NULL
       AND u.ended_at < now() - make_interval(days => retention_days)
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %s', r.snapshot_table);
    dropped := dropped + 1;
  END LOOP;
  RETURN dropped;
END;
$$;

REVOKE ALL ON FUNCTION _migration.gc(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _migration.gc(int) TO service_role;
