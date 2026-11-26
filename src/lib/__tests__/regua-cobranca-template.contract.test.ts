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

const fonte = readFileSync(EXECUTOR, 'utf8');

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
      expect(fonte).toContain(`{{${variavel}}}`);
    }
  });

  it('recebe empresa e etapa de cada envio (não usa template global)', () => {
    expect(fonte).toContain('origem: { empresaId: string; etapa: string }');
    expect(fonte).toContain('empresaId: regra.empresa_id');
  });
});
