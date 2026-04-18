// Edge: copilot-tributario — chat IA streaming SSE com tool calling
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `Você é o **Copilot Tributário Lovable**, especialista sênior em:
- Reforma Tributária brasileira (EC 132/23, LC 214/25)
- Novos tributos: CBS (Contribuição sobre Bens e Serviços), IBS (Imposto sobre Bens e Serviços), IS (Imposto Seletivo)
- Tributos residuais (PIS, COFINS, ICMS, ISS) durante transição 2026-2032
- Regimes: Simples Nacional, Lucro Presumido, Lucro Real
- Lei 15.270/25 (IRPFM/dividendos), apuração mensal/trimestral

Responda SEMPRE em português, com:
- Linguagem clara e profissional, sem jargão excessivo
- Números formatados em R$ (separador BR)
- Citações de base legal quando relevante
- Markdown leve (negrito, listas, código quando útil)
- Recomendações práticas e acionáveis

Se o usuário pedir cálculo específico, use as ferramentas disponíveis.
Se faltar contexto, peça apenas o essencial.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const log = createLogger('copilot-tributario');
  const t0 = Date.now();

  try {
    // Auth manual
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supaUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RBAC
    const admin = createClient(supaUrl, serviceKey);
    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const roles = (roleData ?? []).map((r) => r.role);
    const allowed = roles.some((r) => ['admin', 'financeiro', 'visualizador'].includes(r));
    if (!allowed) {
      log.warn('rbac_denied', { context: { userId: user.id, roles } });
      await log.flush();
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const empresaId: string | undefined = body?.empresa_id;

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Contexto rico opcional
    let contextoSistema = '';
    if (empresaId) {
      const { data: empresa } = await admin
        .from('empresas')
        .select('razao_social, regime_tributario, cnpj')
        .eq('id', empresaId)
        .maybeSingle();
      if (empresa) {
        contextoSistema = `\n\n**Contexto da empresa atual:**\n- Razão social: ${empresa.razao_social}\n- CNPJ: ${empresa.cnpj ?? 'n/d'}\n- Regime: ${empresa.regime_tributario ?? 'n/d'}`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY ausente');

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextoSistema },
          ...messages,
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        log.warn('rate_limit', { status_code: 429 });
        await log.flush();
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (aiResp.status === 402) {
        log.warn('credits_exhausted', { status_code: 402 });
        await log.flush();
        return new Response(
          JSON.stringify({ error: 'Créditos Lovable AI esgotados. Adicione fundos na Workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const txt = await aiResp.text();
      log.error('gateway_error', { status_code: aiResp.status, error_message: txt.slice(0, 500) });
      await log.flush();
      return new Response(JSON.stringify({ error: 'Erro no gateway de IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log.info('stream_started', { duration_ms: Date.now() - t0 });
    // Flush log assíncrono — não bloqueia stream
    log.flush().catch(() => {});

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    log.error('exception', { error_message: e instanceof Error ? e.message : String(e) });
    await log.flush();
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
