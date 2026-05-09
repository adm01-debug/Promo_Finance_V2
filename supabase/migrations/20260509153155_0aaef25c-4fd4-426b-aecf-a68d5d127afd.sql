-- Habilitar a extensão pg_net
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Função para chamar o webhook da Edge Function
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamada assíncrona para a Edge Function usando pg_net
  PERFORM
    net.http_post(
      url := 'https://iikqosstymnnxaujzadw.supabase.co/functions/v1/whatsapp-ai-analyzer',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas mensagens
DROP TRIGGER IF EXISTS on_whatsapp_message_inserted ON public.historico_cobranca_whatsapp;
CREATE TRIGGER on_whatsapp_message_inserted
AFTER INSERT ON public.historico_cobranca_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();
