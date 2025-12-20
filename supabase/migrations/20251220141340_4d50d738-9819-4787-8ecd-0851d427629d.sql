-- Table to store Bitrix24 webhook events
CREATE TABLE public.bitrix_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy for admin access
CREATE POLICY "Admins can manage webhook events"
  ON public.bitrix_webhook_events
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Table to store Open Finance consents
CREATE TABLE public.open_finance_consents (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_id TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.open_finance_consents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consents
CREATE POLICY "Users can view their own consents"
  ON public.open_finance_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents"
  ON public.open_finance_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.open_finance_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_open_finance_consents_updated_at
  BEFORE UPDATE ON public.open_finance_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_bitrix_webhook_events_type ON public.bitrix_webhook_events(event_type);
CREATE INDEX idx_bitrix_webhook_events_processed ON public.bitrix_webhook_events(processed);
CREATE INDEX idx_open_finance_consents_user ON public.open_finance_consents(user_id);
CREATE INDEX idx_open_finance_consents_status ON public.open_finance_consents(status);