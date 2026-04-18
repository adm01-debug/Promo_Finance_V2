-- Tabela de telemetria de erros frontend
CREATE TABLE public.frontend_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'error',
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_frontend_error_logs_user_id ON public.frontend_error_logs(user_id);
CREATE INDEX idx_frontend_error_logs_created_at ON public.frontend_error_logs(created_at DESC);
CREATE INDEX idx_frontend_error_logs_severity ON public.frontend_error_logs(severity);

ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem inserir seus próprios erros
CREATE POLICY "Users can insert their own error logs"
ON public.frontend_error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Usuários veem apenas seus próprios erros
CREATE POLICY "Users can view their own error logs"
ON public.frontend_error_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins veem todos os erros
CREATE POLICY "Admins can view all error logs"
ON public.frontend_error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins podem deletar erros antigos
CREATE POLICY "Admins can delete error logs"
ON public.frontend_error_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));