-- Create table for frontend performance metrics
CREATE TABLE IF NOT EXISTS public.frontend_performance_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metric_name TEXT NOT NULL, -- LCP, FID, CLS, FCP, TTFB, INP
    value FLOAT NOT NULL,
    rating TEXT, -- good, needs-improvement, poor
    url TEXT,
    user_agent TEXT,
    navigation_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.frontend_performance_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can insert their own (or anonymous), admins can see all
CREATE POLICY "Anyone can insert performance logs" 
ON public.frontend_performance_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all performance logs" 
ON public.frontend_performance_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Index for analytics
CREATE INDEX idx_performance_logs_metric ON public.frontend_performance_logs(metric_name);
CREATE INDEX idx_performance_logs_created_at ON public.frontend_performance_logs(created_at);
