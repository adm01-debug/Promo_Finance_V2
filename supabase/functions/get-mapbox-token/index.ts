// get-mapbox-token — retorna o token público do Mapbox para o cliente.
// Token pk.* é seguro no browser; ficamos com ele em secret para centralizar rotação.
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = Deno.env.get("MAPBOX_ACCESS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "MAPBOX_ACCESS_TOKEN não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ token }), {
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, max-age=300" },
  });
});
