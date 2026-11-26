import { describe, expect, it } from 'vitest';
import {
  aplicarVariaveis,
  assuntoSeguro,
  escaparHtml,
} from '../../../supabase/functions/executar-regua-cobranca/domain.ts';

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

  it('neutraliza marcação vinda do template no corpo do e-mail', () => {
    expect(escaparHtml('<img src=x onerror=alert(1)>Pague & pronto')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;Pague &amp; pronto'
    );
    expect(escaparHtml('aspas \' e " duplas')).toBe('aspas &#39; e &quot; duplas');
  });

  it('preserva as quebras de linha do template', () => {
    expect(escaparHtml('linha 1\nlinha 2')).toBe('linha 1<br />linha 2');
  });

  it('remove marcação do assunto sem mostrar entidades ao cliente', () => {
    expect(assuntoSeguro('Nota <b>urgente</b>\nhoje')).toBe('Nota urgente hoje');
    expect(assuntoSeguro('<script>alert(1)</script>Vencimento')).toBe('alert(1) Vencimento');
  });
});
