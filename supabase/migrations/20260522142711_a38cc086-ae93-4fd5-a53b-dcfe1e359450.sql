-- Add RLS policies for identified tables that had none
DO $$
BEGIN
    -- aprovacao_comentarios
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aprovacao_comentarios') THEN
        CREATE POLICY "Users can view comments on requests they can see" 
        ON public.aprovacao_comentarios FOR SELECT 
        USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can insert their own comments" 
        ON public.aprovacao_comentarios FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- apuracoes_tributarias
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'apuracoes_tributarias') THEN
        CREATE POLICY "Authenticated users can view tax calculations" 
        ON public.apuracoes_tributarias FOR SELECT 
        USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Admins can manage tax calculations" 
        ON public.apuracoes_tributarias FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;

    -- configuracoes_aprovacao
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'configuracoes_aprovacao') THEN
        CREATE POLICY "Authenticated users can view approval config" 
        ON public.configuracoes_aprovacao FOR SELECT 
        USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Admins can manage approval config" 
        ON public.configuracoes_aprovacao FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END
$$;