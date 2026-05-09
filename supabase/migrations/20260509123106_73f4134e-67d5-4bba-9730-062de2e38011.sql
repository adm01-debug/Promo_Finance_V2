-- Create table for API Keys
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] DEFAULT '{"read"}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own company api keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.user_empresas WHERE empresa_id = public.api_keys.empresa_id
));

CREATE POLICY "Admins can manage api keys"
ON public.api_keys
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = public.api_keys.empresa_id 
    AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
