import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[gerar-alertas] Iniciando geração de alertas automáticos...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar a função do banco para gerar alertas
    const { error } = await supabase.rpc('gerar_alertas_vencimento');

    if (error) {
      console.error('[gerar-alertas] Erro ao executar função:', error);
      throw error;
    }

    console.log('[gerar-alertas] Alertas gerados com sucesso');

    // Contar alertas criados recentemente
    const { count } = await supabase
      .from('alertas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alertas gerados com sucesso',
        alertas_criados: count || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[gerar-alertas] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
