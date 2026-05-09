-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    current_user_email text;
    old_data jsonb := null;
    new_data jsonb := null;
BEGIN
    -- Tenta obter o ID do usuário da sessão do Supabase
    current_user_id := auth.uid();
    
    -- Busca o email se houver um usuário logado
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;

    -- Define os dados antigos e novos baseados na operação
    IF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_data := to_jsonb(NEW);
    END IF;

    -- Insere na tabela de audit_logs
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        COALESCE(current_user_email, 'sistema'),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text 
            ELSE NEW.id::text 
        END,
        old_data,
        new_data,
        inet_client_addr()::text,
        NULL -- User agent não é facilmente acessível via trigger pura sem extensões
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicação dos triggers nas tabelas core
-- Clientes
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
CREATE TRIGGER audit_clientes
AFTER INSERT OR UPDATE OR DELETE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Fornecedores
DROP TRIGGER IF EXISTS audit_fornecedores ON public.fornecedores;
CREATE TRIGGER audit_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Contas Receber
DROP TRIGGER IF EXISTS audit_contas_receber ON public.contas_receber;
CREATE TRIGGER audit_contas_receber
AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Contas Pagar
DROP TRIGGER IF EXISTS audit_contas_pagar ON public.contas_pagar;
CREATE TRIGGER audit_contas_pagar
AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Usuários (Perfis)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Permissões (Roles)
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Empresas
DROP TRIGGER IF EXISTS audit_empresas ON public.empresas;
CREATE TRIGGER audit_empresas
AFTER INSERT OR UPDATE OR DELETE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Adiciona índice para performance em buscas por record_id se não existir
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
