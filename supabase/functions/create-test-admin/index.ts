// One-shot: cria (ou reseta senha de) usuário de teste com role admin.
// Protegido por token compartilhado via header x-setup-token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token, x-supabase-client-platform",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email: string = body.email ?? "teste.admin@promobrindes.com.br";
    const password: string = body.password ?? "TesteAdmin@2026!";
    const fullName: string = body.full_name ?? "Usuário Teste Admin";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Tenta encontrar usuário existente
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // Garante role admin
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "admin", is_active: true, notes: "Usuário de teste criado via create-test-admin" },
        { onConflict: "user_id,role" },
      );
    if (roleErr) throw roleErr;

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email, password, reused: !!existing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
