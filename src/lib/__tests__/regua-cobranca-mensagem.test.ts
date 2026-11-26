import { describe, expect, it } from 'vitest';
import { aplicarVariaveis } from '../../../supabase/functions/executar-regua-cobranca/domain.ts';
import {
  assuntoSeguro,
  textoParaHtml,
} from '../../../supabase/functions/enviar-alerta-email/html.ts';

const dados = { cliente: 'Maria Souza', valor: 'R$ 1.234,56', vencimento: '10/12/2026' };

describe('executar-regua-cobranca — texto da cobrança', () => {
  it('substitui as variáveis do catálogo no corpo e no assunto', () => {
    expect(aplicarVariaveis('{{cliente}}, vence {{vencimento}} ({{valor}})', dados)).toBe(
      'Maria Souza, vence 10/12/2026 (R$ 1.234,56)'
    );
    expect(aplicarVariaveis('{{nome_cliente}} / {{data_vencimento}}', dados)).toBe(
      'Maria Souza / 10/12/2026'
    );
  });

  it('mantém o texto quando o assunto não tem variável', () => {
    expect(aplicarVariaveis('Lembrete de Pagamento', dados)).toBe('Lembrete de Pagamento');
  });

  it('o provedor de e-mail neutraliza marcação vinda do template', () => {
    expect(textoParaHtml('<img src=x onerror=alert(1)>Pague & pronto')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;Pague &amp; pronto'
    );
    expect(textoParaHtml('aspas \' e " duplas')).toBe('aspas &#39; e &quot; duplas');
  });

  it('o provedor de e-mail preserva as quebras de linha do template', () => {
    expect(textoParaHtml('linha 1\nlinha 2')).toBe('linha 1<br />linha 2');
  });

  it('o assunto mantém o texto entre < e > e corta CR/LF (cabeçalho do e-mail)', () => {
    expect(assuntoSeguro('Aviso de vencimento <Maria Souza> — R$ 150,00')).toBe(
      'Aviso de vencimento <Maria Souza> — R$ 150,00'
    );
    expect(assuntoSeguro('Nota urgente\r\nBcc: outro@exemplo.com')).toBe(
      'Nota urgente Bcc: outro@exemplo.com'
    );
  });
});
