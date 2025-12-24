import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertaEmailRequest {
  tipo: 'vencimento' | 'inadimplencia' | 'aprovacao' | 'ruptura';
  destinatario: string;
  dados: {
    titulo: string;
    mensagem: string;
    valor?: number;
    dataVencimento?: string;
    urlAcao?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { tipo, destinatario, dados }: AlertaEmailRequest = await req.json();

    console.log(`Processando alerta do tipo: ${tipo} para ${destinatario}`);

    // Verificar se Resend está configurado
    if (!resendApiKey) {
      console.log("RESEND_API_KEY não configurada - simulando envio");
      
      // Registrar o alerta no banco mesmo sem enviar email
      await supabase.from('alertas').insert({
        tipo: tipo,
        titulo: dados.titulo,
        mensagem: `[Email simulado para ${destinatario}] ${dados.mensagem}`,
        prioridade: tipo === 'ruptura' ? 'critica' : tipo === 'inadimplencia' ? 'alta' : 'media',
        acao_url: dados.urlAcao,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          simulated: true,
          message: "Email simulado - configure RESEND_API_KEY para envio real" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Templates de email por tipo
    const templates: Record<string, { subject: string; html: string }> = {
      vencimento: {
        subject: `⏰ Alerta de Vencimento: ${dados.titulo}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⏰ Alerta de Vencimento</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">${dados.titulo}</h2>
              <p style="color: #4b5563; line-height: 1.6;">${dados.mensagem}</p>
              ${dados.valor ? `<p style="font-size: 24px; font-weight: bold; color: #1f2937;">Valor: R$ ${dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
              ${dados.dataVencimento ? `<p style="color: #6b7280;">Vencimento: ${dados.dataVencimento}</p>` : ''}
              ${dados.urlAcao ? `<a href="${dados.urlAcao}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Ver Detalhes</a>` : ''}
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
              Sistema Financeiro - Alerta Automático
            </div>
          </div>
        `,
      },
      inadimplencia: {
        subject: `🚨 Alerta de Inadimplência: ${dados.titulo}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🚨 Alerta de Inadimplência</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">${dados.titulo}</h2>
              <p style="color: #4b5563; line-height: 1.6;">${dados.mensagem}</p>
              ${dados.valor ? `<p style="font-size: 24px; font-weight: bold; color: #ef4444;">Valor em atraso: R$ ${dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
              ${dados.urlAcao ? `<a href="${dados.urlAcao}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Iniciar Cobrança</a>` : ''}
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
              Sistema Financeiro - Alerta Automático
            </div>
          </div>
        `,
      },
      aprovacao: {
        subject: `✅ Aprovação Pendente: ${dados.titulo}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Aprovação Necessária</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-top: 0;">${dados.titulo}</h2>
              <p style="color: #4b5563; line-height: 1.6;">${dados.mensagem}</p>
              ${dados.valor ? `<p style="font-size: 24px; font-weight: bold; color: #1f2937;">Valor: R$ ${dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
              ${dados.urlAcao ? `<a href="${dados.urlAcao}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Aprovar Agora</a>` : ''}
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
              Sistema Financeiro - Alerta Automático
            </div>
          </div>
        `,
      },
      ruptura: {
        subject: `⚠️ ALERTA CRÍTICO: Risco de Ruptura de Caixa`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ ALERTA CRÍTICO</h1>
            </div>
            <div style="padding: 30px; background: #fef2f2; border: 2px solid #fecaca;">
              <h2 style="color: #991b1b; margin-top: 0;">${dados.titulo}</h2>
              <p style="color: #4b5563; line-height: 1.6;">${dados.mensagem}</p>
              ${dados.valor ? `<p style="font-size: 24px; font-weight: bold; color: #991b1b;">Déficit projetado: R$ ${Math.abs(dados.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>` : ''}
              ${dados.urlAcao ? `<a href="${dados.urlAcao}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Ver Fluxo de Caixa</a>` : ''}
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
              Sistema Financeiro - Alerta Crítico Automático
            </div>
          </div>
        `,
      },
    };

    const template = templates[tipo] || templates.vencimento;

    // Enviar email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sistema Financeiro <alertas@resend.dev>",
        to: [destinatario],
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await response.json();
    console.log("Resultado do envio:", result);

    if (!response.ok) {
      throw new Error(result.message || "Erro ao enviar email");
    }

    // Registrar o alerta no banco
    await supabase.from('alertas').insert({
      tipo: tipo,
      titulo: dados.titulo,
      mensagem: `[Email enviado para ${destinatario}] ${dados.mensagem}`,
      prioridade: tipo === 'ruptura' ? 'critica' : tipo === 'inadimplencia' ? 'alta' : 'media',
      acao_url: dados.urlAcao,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Erro ao enviar alerta:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
