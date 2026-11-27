import { afterEach, describe, expect, it, vi } from 'vitest';
import { proximoEnvioInicial } from '../useRelatoriosTributariosAgendados';

// O DEFAULT da coluna e `now()`, e o job horario `enviar-relatorios-tributarios`
// processa tudo com `proximo_envio_em <= now()`: sem esse calculo o primeiro
// envio saia no minuto da criacao, ignorando o `dia_envio` escolhido.
describe('proximoEnvioInicial', () => {
  afterEach(() => vi.useRealTimers());

  it('agenda para o dia escolhido ainda neste mes quando ele nao passou', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
    expect(proximoEnvioInicial('mensal', 10)).toBe('2026-03-10T06:00:00.000Z');
  });

  it('avanca um periodo quando o dia escolhido ja passou', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    expect(proximoEnvioInicial('mensal', 10)).toBe('2026-04-10T06:00:00.000Z');
    expect(proximoEnvioInicial('trimestral', 10)).toBe('2026-06-10T06:00:00.000Z');
    expect(proximoEnvioInicial('anual', 10)).toBe('2027-03-10T06:00:00.000Z');
  });

  it('nunca devolve um instante ja vencido', () => {
    vi.useFakeTimers();
    const agora = new Date('2026-03-10T06:00:00Z');
    vi.setSystemTime(agora);
    for (const freq of ['mensal', 'trimestral', 'anual'] as const) {
      for (const dia of [1, 10, 28]) {
        expect(new Date(proximoEnvioInicial(freq, dia)).getTime()).toBeGreaterThan(agora.getTime());
      }
    }
  });
});
