// Edge Function: upload-anexo
// Proxy de upload para o bucket `financeiro`: valida magic bytes no
// servidor (o cliente faz a mesma checagem só por UX — quem chama o HTTP
// direto pula o front), grava via service_role e registra a linha em
// `anexos_financeiros`. A policy restritiva na migration 20261002 bloqueia
// INSERT direto do role `authenticated` no bucket, então esta função é a
// única porta de escrita.

import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { exigirUsuario } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { validarMagicBytesServidor } from '../_shared/magic-bytes.ts';
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('upload-anexo');

const BUCKET = 'financeiro';
const TAMANHO_MAX = 10 * 1024 * 1024;
const ENTIDADES = new Set(['contas_pagar', 'contas_receber', 'movimentacoes']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function erro(req: Request, status: number, codigo: string, mensagem: string): Response {
  return new Response(JSON.stringify({ error: codigo, message: mensagem }), {
    status,
    headers: { ...corsHeadersPara(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersPara(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return erro(req, 405, 'method_not_allowed', 'Apenas POST.');

  try {
    const auth = await exigirUsuario(req);
    if (!auth.ok) return auth.resposta;
    const { userId } = auth.dados;

    const form = await req.formData();
    const arquivo = form.get('arquivo');
    const entidadeTipo = String(form.get('entidade_tipo') ?? '');
    const entidadeId = String(form.get('entidade_id') ?? '');

    if (!(arquivo instanceof File)) {
      return erro(req, 400, 'arquivo_ausente', 'Campo "arquivo" é obrigatório.');
    }
    if (!ENTIDADES.has(entidadeTipo)) {
      return erro(req, 400, 'entidade_invalida', 'entidade_tipo fora da lista aceita.');
    }
    if (!UUID_RE.test(entidadeId)) {
      return erro(req, 400, 'entidade_invalida', 'entidade_id precisa ser UUID.');
    }
    if (arquivo.size === 0 || arquivo.size > TAMANHO_MAX) {
      return erro(req, 413, 'arquivo_tamanho', 'Arquivo vazio ou acima de 10MB.');
    }

    // 32 KiB: mesma janela do validador do front — precisa cobrir as
    // primeiras entradas do zip para identificar pacotes de escritório.
    const head = new Uint8Array(await arquivo.slice(0, 32768).arrayBuffer());
    const erroConteudo = validarMagicBytesServidor(arquivo.name, head);
    if (erroConteudo) {
      return erro(req, 415, 'conteudo_invalido', erroConteudo);
    }

    const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const caminho = `${entidadeTipo}/${entidadeId}/${crypto.randomUUID()}.${ext}`;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error: erroUpload } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, arquivo, { contentType: arquivo.type || 'application/octet-stream' });
    if (erroUpload) {
      log.error('falha no upload ao storage', { caminho, erro: erroUpload.message });
      return erro(req, 500, 'upload_falhou', 'Falha ao gravar o arquivo.');
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(caminho);

    const { error: erroInsert } = await supabase.from('anexos_financeiros').insert({
      entidade_id: entidadeId,
      entidade_tipo: entidadeTipo,
      nome_arquivo: arquivo.name,
      mime_type: arquivo.type,
      tamanho_bytes: arquivo.size,
      url: publicUrl,
      url_publica: publicUrl,
      user_id: userId,
    });

    if (erroInsert) {
      // Sem a linha o arquivo fica invisível na tela e imorrível — desfaz
      // o upload para não deixar órfão no bucket.
      await supabase.storage.from(BUCKET).remove([caminho]);
      log.error('falha ao registrar anexo', { caminho, erro: erroInsert.message });
      return erro(req, 500, 'registro_falhou', 'Falha ao registrar o anexo.');
    }

    log.info('anexo registrado', { caminho, tamanho: arquivo.size });
    return new Response(JSON.stringify({ url: publicUrl, caminho }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    log.error('erro inesperado', { erro: e instanceof Error ? e.message : String(e) });
    return erro(req, 500, 'erro_interno', 'Erro interno.');
  }
});
