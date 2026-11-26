import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A régua automática lia `regua_cobranca.descricao` como texto da mensagem e
 * nunca tocava em `templates_cobranca`. Efeito: editar um template em
 * Configurações não mudava nenhuma cobrança disparada (achado do review da
 * PR #571). Este contrato protege a ligação entre os dois.
 */
const EXECUTOR = join(
  process.cwd(),
  'supabase',
  'functions',
  'executar-regua-cobranca',
  'index.ts'
);

const lerFonte = (...partes: string[]) => readFileSync(join(process.cwd(), ...partes), 'utf8');

const fonte = readFileSync(EXECUTOR, 'utf8');
const dominio = lerFonte('supabase', 'functions', 'executar-regua-cobranca', 'domain.ts');

const provedor = lerFonte('supabase', 'functions', 'enviar-alerta-email', 'index.ts');
const sanitizador = lerFonte('supabase', 'functions', 'enviar-alerta-email', 'html.ts');

describe('executar-regua-cobranca — usa o template real', () => {
  it('consulta templates_cobranca', () => {
    expect(fonte).toContain(".from('templates_cobranca')");
  });

  it('carrega o template em cada envio (chamada real, não código morto)', () => {
    expect(fonte).toMatch(
      /const template = await carregarTemplate\(\s*supabase,\s*origem\.empresaId,\s*origem\.etapa,\s*canal\s*\)/
    );
  });

  it('seleciona assunto e corpo do template', () => {
    expect(fonte).toContain(".select('assunto,corpo')");
  });

  it('filtra por empresa, etapa, canal e template ativo', () => {
    expect(fonte).toContain(".eq('empresa_id', empresaId)");
    expect(fonte).toContain(".eq('etapa', etapa)");
    expect(fonte).toContain(".eq('canal', canal)");
    expect(fonte).toContain(".eq('ativo', true)");
  });

  it('usa o corpo do template como mensagem', () => {
    expect(fonte).toMatch(/template\?\.corpo\?\.trim\(\)\s*\|\|/);
  });

  it('usa o assunto do template como título do e-mail', () => {
    expect(fonte).toMatch(/template\?\.assunto\?\.trim\(\)/);
  });

  it('substitui as variáveis publicadas no catálogo da tela', () => {
    for (const variavel of ['cliente', 'nome_cliente', 'valor', 'vencimento', 'data_vencimento']) {
      expect(dominio).toContain(`{{${variavel}}}`);
    }
  });

  it('recebe empresa e etapa de cada envio (não usa template global)', () => {
    expect(fonte).toContain('origem: { empresaId: string; etapa: string }');
    expect(fonte).toContain('empresaId: regra.empresa_id');
  });
});

/**
 * Achados do review da PR #571: o template salvava para canais sem provedor, o
 * assunto saía com marcador literal, o WhatsApp era recusado pelo schema do
 * provedor e o e-mail aceitava marcação vinda do template.
 */
describe('executar-regua-cobranca — envio que realmente chega ao provedor', () => {
  it('chama o WhatsApp no contrato do provedor (action + data.telefone/data.mensagem)', () => {
    expect(fonte).toContain("action: 'enviar-mensagem'");
    expect(fonte).toMatch(/data: \{ telefone: cliente\.telefone, mensagem \}/);
    expect(lerFonte('supabase', 'functions', '_shared', 'validation.ts')).toContain(
      "'enviar-mensagem'"
    );
    expect(lerFonte('supabase', 'functions', 'whatsapp-ia-proativo', 'index.ts')).toContain(
      'const { telefone, mensagem } = data;'
    );
    expect(fonte).not.toMatch(/body: \{ phone: cliente\.telefone/);
  });

  it('não oferece na tela canal sem provedor no executor', () => {
    expect(lerFonte('src', 'components', 'cobranca', 'ReguaCobrancaConfig.tsx')).toMatch(
      /const CANAIS = \['email', 'whatsapp'\] as const;/
    );
  });

  it('aplica as variáveis do catálogo também no assunto', () => {
    expect(fonte).toMatch(/const assunto = aplicarVariaveis\(/);
    expect(dominio).toContain('export function aplicarVariaveis(');
  });

  it('entrega o texto cru e deixa a escapagem com quem monta o HTML', () => {
    expect(fonte).toContain('titulo: assunto,');
    expect(fonte).toContain('mensagem: mensagem,');
    expect(fonte).not.toContain('escaparHtml(');
    expect(fonte).not.toContain('assuntoSeguro(');
    expect(dominio).not.toContain('export function escaparHtml(');
    expect(provedor).toContain('textoParaHtml(dados.titulo)');
    expect(provedor).toContain('textoParaHtml(dados.mensagem)');
    expect(provedor).toContain('escaparHtml(dados.urlAcao');
    expect(provedor).toContain('assuntoSeguro(dados.titulo)');
    expect(sanitizador).toContain('export function escaparHtml(');
    expect(sanitizador).toContain('export function assuntoSeguro(');
    expect(sanitizador).toContain('export function textoParaHtml(');
  });

  it('finaliza a reserva mesmo quando o envio lança', () => {
    expect(fonte).toMatch(/try \{\s*erroEnvio = await enviarCobranca\(/);
    expect(fonte).toMatch(/catch \(erro\) \{\s*erroEnvio = mensagemErro\(erro\);/);
    expect(fonte).toContain("status: sucesso ? 'sucesso' : 'falha'");
    expect(fonte).toContain('mensagem_erro: erroEnvio');
  });

  it('a reserva usa status aceito pela constraint da tabela', () => {
    expect(fonte).toContain("status: 'processando'");
    expect(
      lerFonte('supabase', 'migrations', '20260822113000_reconciliar_execucoes_regua_cobranca.sql')
    ).toMatch(/CHECK \(status IN \('sucesso', 'falha', 'erro', 'ignorado', 'processando'\)\)/);
  });
});
