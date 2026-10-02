-- Renomeia user_sessions.last_active → last_activity para casar com o frontend
ALTER TABLE public.user_sessions
  RENAME COLUMN last_active TO last_activity;

CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity
  ON public.user_sessions(last_activity DESC);

NOTIFY pgrst, 'reload schema';
