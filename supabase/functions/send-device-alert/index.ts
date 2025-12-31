import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceAlertRequest {
  userId: string;
  email: string;
  browser: string;
  os: string;
  deviceType: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, browser, os, deviceType, timestamp }: DeviceAlertRequest = await req.json();

    console.log(`Sending new device alert to ${email}`);

    const formattedDate = new Date(timestamp).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Alerta de Segurança</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Detectamos um novo login em sua conta a partir de um dispositivo desconhecido.
            </p>
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase;">Detalhes do acesso</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600; width: 120px;">Navegador:</td>
                  <td style="padding: 8px 0; color: #78350f;">${browser || 'Desconhecido'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600;">Sistema:</td>
                  <td style="padding: 8px 0; color: #78350f;">${os || 'Desconhecido'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600;">Dispositivo:</td>
                  <td style="padding: 8px 0; color: #78350f;">${deviceType || 'Desktop'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600;">Data/Hora:</td>
                  <td style="padding: 8px 0; color: #78350f;">${formattedDate}</td>
                </tr>
              </table>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              <strong>Se foi você:</strong> Ignore este email. Você pode gerenciar seus dispositivos na Central de Segurança.
            </p>
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>Se NÃO foi você:</strong> Sua conta pode estar comprometida. Altere sua senha imediatamente.
              </p>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Este é um email automático de segurança. Por favor, não responda.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
              Promo Brindes - Sistema de Gestão Financeira
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Segurança <onboarding@resend.dev>",
        to: [email],
        subject: "⚠️ Novo dispositivo detectado em sua conta",
        html: emailHtml,
      }),
    });

    const data = await res.json();
    console.log("Device alert email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-device-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
