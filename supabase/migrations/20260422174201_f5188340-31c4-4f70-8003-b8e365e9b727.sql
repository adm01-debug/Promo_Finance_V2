
CREATE TRIGGER trg_audit_lancamentos_contabeis
AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos_contabeis
FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_financeira();

CREATE TRIGGER trg_audit_partidas_contabeis
AFTER INSERT OR UPDATE OR DELETE ON public.partidas_contabeis
FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_financeira();
