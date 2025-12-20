import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, fileContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing document: ${fileName} (${fileType})`);

    // Determine analysis prompt based on file type
    let analysisPrompt = `Analise o seguinte documento financeiro e extraia as informações relevantes:

Nome do arquivo: ${fileName}
Tipo: ${fileType}

`;

    // For images and PDFs, use vision capabilities
    const isImage = fileType.startsWith('image/');
    const isPDF = fileType === 'application/pdf';

    let messages: any[] = [];

    if (isImage) {
      messages = [
        {
          role: "system",
          content: `Você é um analista financeiro especializado em extrair informações de documentos.
          
Ao analisar documentos financeiros, extraia:
1. **Tipo de documento** (boleto, nota fiscal, extrato, contrato, etc.)
2. **Valores** identificados
3. **Datas importantes** (vencimento, emissão, pagamento)
4. **Partes envolvidas** (pagador, beneficiário, cliente, fornecedor)
5. **Códigos e referências** (número do documento, código de barras, etc.)
6. **Observações relevantes** para o departamento financeiro

Formate a resposta de forma clara e estruturada em português brasileiro.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de documento financeiro: ${fileName}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${fileType};base64,${fileContent}`
              }
            }
          ]
        }
      ];
    } else {
      // For text-based files (CSV, TXT, etc.), decode and analyze
      let textContent = "";
      try {
        const bytes = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));
        textContent = new TextDecoder().decode(bytes);
        // Limit content size
        if (textContent.length > 10000) {
          textContent = textContent.substring(0, 10000) + "\n\n[... conteúdo truncado ...]";
        }
      } catch (e) {
        textContent = "[Não foi possível decodificar o conteúdo do arquivo]";
      }

      messages = [
        {
          role: "system",
          content: `Você é um analista financeiro especializado em extrair informações de documentos.
          
Ao analisar documentos financeiros, extraia:
1. **Tipo de documento** e seu propósito
2. **Valores e totais** identificados
3. **Datas importantes**
4. **Padrões e tendências** (para extratos e planilhas)
5. **Anomalias ou pontos de atenção**
6. **Resumo executivo** com insights acionáveis

Formate a resposta de forma clara e estruturada em português brasileiro.`
        },
        {
          role: "user",
          content: `${analysisPrompt}

Conteúdo do documento:
\`\`\`
${textContent}
\`\`\``
        }
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isImage ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao analisar documento");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Não foi possível analisar o documento.";

    console.log("Document analysis complete");

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        fileName,
        fileType 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Document analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
