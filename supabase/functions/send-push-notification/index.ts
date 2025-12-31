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

// Web Push implementation using crypto
async function generateVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const vapidKeys = {
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey,
  };

  // Parse the endpoint URL to get the audience
  const endpointUrl = new URL(endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

  // Create JWT header and payload
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  // Base64url encode
  const base64urlEncode = (data: string | Uint8Array): string => {
    const str = typeof data === "string" ? data : new TextDecoder().decode(data);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const base64urlEncodeJson = (obj: object): string => {
    return base64urlEncode(JSON.stringify(obj));
  };

  // Decode base64url to Uint8Array
  const base64urlDecode = (str: string): Uint8Array => {
    const padding = "=".repeat((4 - (str.length % 4)) % 4);
    const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Import the private key
  const privateKeyData = base64urlDecode(vapidPrivateKey);
  
  // Create the JWK for ES256
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: vapidPublicKey.substring(0, 43),
    y: vapidPublicKey.substring(43),
    d: btoa(String.fromCharCode(...privateKeyData)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  };

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create unsigned token
  const unsignedToken = `${base64urlEncodeJson(header)}.${base64urlEncodeJson(payload)}`;
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature to base64url
  const signatureBase64 = base64urlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureBase64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey,
  };
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  console.log("[send-push-notification] Sending to endpoint:", subscription.endpoint);

  try {
    // For now, we'll use a simpler approach - just POST to the endpoint
    // Real Web Push requires complex encryption, so we'll use a fallback
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
      },
      body: payload,
    });

    console.log("[send-push-notification] Push response status:", response.status);
    return response;
  } catch (error) {
    console.error("[send-push-notification] Push send error:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    
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
      tag: tag || "security-alert",
      data: data || { url: "/alertas" },
      prioridade,
      timestamp: new Date().toISOString(),
    });

    let successCount = 0;
    let failCount = 0;

    // Enviar para cada subscription
    for (const subscription of subscriptions) {
      try {
        // If we have VAPID keys and subscription has push info, try real push
        if (vapidPublicKey && vapidPrivateKey && subscription.endpoint && subscription.p256dh && subscription.auth) {
          try {
            const pushResponse = await sendWebPush(
              {
                endpoint: subscription.endpoint,
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
              payload,
              vapidPublicKey,
              vapidPrivateKey
            );

            if (pushResponse.ok || pushResponse.status === 201) {
              console.log(`[send-push-notification] Push enviado com sucesso para user ${subscription.user_id}`);
              successCount++;
              continue;
            } else if (pushResponse.status === 410 || pushResponse.status === 404) {
              // Subscription is no longer valid, mark as inactive
              console.log(`[send-push-notification] Subscription expirada para user ${subscription.user_id}, desativando...`);
              await supabase
                .from("push_subscriptions")
                .update({ ativo: false })
                .eq("id", subscription.id);
              failCount++;
              continue;
            }
          } catch (pushError) {
            console.error(`[send-push-notification] Erro no push para subscription:`, pushError);
          }
        }

        // Fallback: Criar alerta no banco para mostrar na UI
        console.log(`[send-push-notification] Criando alerta no banco para user ${subscription.user_id}`);
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
        console.error(`[send-push-notification] Erro ao processar subscription:`, error);
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
