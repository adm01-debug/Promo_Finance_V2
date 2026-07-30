DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'elisao_creditos_auditoria_nota_fiscal_id_fkey') THEN
        ALTER TABLE public.elisao_creditos_auditoria
        ADD CONSTRAINT elisao_creditos_auditoria_nota_fiscal_id_fkey 
        FOREIGN KEY (nota_fiscal_id) REFERENCES public.notas_fiscais_ocr(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'elisao_creditos_auditoria_regra_id_fkey') THEN
        ALTER TABLE public.elisao_creditos_auditoria
        ADD CONSTRAINT elisao_creditos_auditoria_regra_id_fkey 
        FOREIGN KEY (regra_id) REFERENCES public.elisao_regras_creditos(id);
    END IF;
END $$;
