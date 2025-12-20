import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId?: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, icon, badge, tag, data, prioridade }: PushNotificationRequest = await req.json();

    console.log("[send-push-notification] Enviando notificação:", { userId, title, prioridade });

    // Buscar subscriptions ativas
    let query = supabase
      .from("push_subscriptions")
      .select("*")
      .eq("ativo", true);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("[send-push-notification] Erro ao buscar subscriptions:", fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-push-notification] Nenhuma subscription ativa encontrada");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "Nenhuma subscription ativa" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-push-notification] Encontradas ${subscriptions.length} subscriptions`);

    // Preparar payload da notificação
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/favicon.ico",
      badge: badge || "/favicon.ico",
      tag: tag || "alert-notification",
      data: data || { url: "/alertas" },
      prioridade,
    });

    let successCount = 0;
    let failCount = 0;

    // Enviar para cada subscription
    for (const subscription of subscriptions) {
      try {
        // Web Push requer VAPID keys para funcionar
        // Por enquanto, apenas logamos que seria enviado
        console.log(`[send-push-notification] Notificação preparada para user ${subscription.user_id}`);
        
        // Criar alerta no banco para backup
        await supabase.from("alertas").insert({
          tipo: "push_notification",
          titulo: title,
          mensagem: body,
          prioridade: prioridade || "media",
          user_id: subscription.user_id,
          acao_url: data?.url as string || "/alertas",
        });
        
        successCount++;
      } catch (error) {
        console.error(`[send-push-notification] Erro ao enviar para subscription:`, error);
        failCount++;
      }
    }

    console.log(`[send-push-notification] Resultado: ${successCount} sucesso, ${failCount} falhas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: subscriptions.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[send-push-notification] Erro:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
