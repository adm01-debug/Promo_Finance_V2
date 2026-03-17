const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Connect to external DB directly via pg connection string
    const EXTERNAL_DB_URL = Deno.env.get('SUPABASE_DB_URL');
    
    // Use local DB to query view definitions
    const localUrl = Deno.env.get('SUPABASE_URL') || '';
    const localKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Query local view definitions
    const viewsQuery = `
      SELECT viewname, definition 
      FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname LIKE 'vw_%'
      ORDER BY viewname;
    `;

    // We need to use the external DB URL to get the view definitions from the external DB
    // Since we have the service_role key, let's use RPC or direct SQL
    // Actually, let's query via the PostgREST RPC approach using a custom function
    
    // Alternative: use the Postgres connection directly with Deno
    // Import the postgres module
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js');
    
    // Get external DB URL from secrets
    const extDbUrl = Deno.env.get('EXTERNAL_DB_URL');
    
    // The EXTERNAL_DB_URL is the service_role key, not a pg connection string
    // We need to query views from local DB that we know exist, and compare with external
    // Let's query our local views first
    const localDbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!localDbUrl) throw new Error('SUPABASE_DB_URL not configured');
    
    const sql = postgres(localDbUrl);
    
    const views = await sql`
      SELECT viewname, definition 
      FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname LIKE 'vw_%'
      ORDER BY viewname
    `;
    
    await sql.end();
    
    const result: Record<string, string> = {};
    for (const v of views) {
      result[v.viewname] = v.definition;
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message, stack: (error as Error).stack }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
