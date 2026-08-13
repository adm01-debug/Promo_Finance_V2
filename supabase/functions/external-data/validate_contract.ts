import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Script de validação de contrato para a Edge Function external-data.
 * Verifica se os campos obrigatórios retornados batem com a documentação em docs/ARCHITECTURE.md.
 */

async function validateExternalDataContract() {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!url || !anonKey) {
    console.warn("⚠️ Ambiente local incompleto. Pulando validação de contrato real.");
    return;
  }

  console.log("🧪 Iniciando validação de contrato: external-data...");

  try {
    const supabase = createClient(url, anonKey);
    
    // Testa o comportamento de fallback (sem auth real ou sem config externa)
    const { data, error } = await supabase.functions.invoke('external-data', {
      method: 'GET',
      query_params: { tabela: 'clientes' }
    });

    if (error) {
      console.error("❌ Falha na invocação da function:", error);
      Deno.exit(1);
    }

    // Se for fallback, deve ter estrutura específica
    if (data.fallback) {
      console.log("✅ Estrutura de Fallback validada.");
      const requiredFields = ['data', 'total', 'page', 'error', 'message'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          console.error(`❌ Estrutura de fallback incompleta. Campo ausente: ${field}`);
          Deno.exit(1);
        }
      }
    } else {
      console.log("✅ Estrutura de Resposta de Dados validada.");
      // Se houver dados, valida mapeamento
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        const requiredMapping = ['id', 'razao_social', 'cnpj_cpf', 'nome'];
        for (const field of requiredMapping) {
          if (!(field in item)) {
            console.error(`❌ Mapeamento de item inválido. Campo ausente: ${field}`);
            Deno.exit(1);
          }
        }
      }
    }

    console.log("🚀 Todos os contratos do external-data estão em conformidade.");
  } catch (e) {
    console.error("💥 Erro durante validação:", e);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  validateExternalDataContract();
}
