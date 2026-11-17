/**
 * Achado F10 (P0) da auditoria de 2026-09-10: o componente fabricava codigo de
 * barras e linha digitavel a partir de banco + valor + vencimento + numero,
 * rotulava "Dados do Boleto (FEBRABAN)" com botao de copiar, e era exibido ao
 * lado da linha REAL do ASAAS. Os dois numeros eram invalidos -- o codigo
 * passava de 44 digitos para qualquer vencimento depois de fev/2025 (fator de
 * vencimento acima de 9999) e a linha saia com 44 digitos onde o padrao pede 47.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { BoletoBarcode } from '../BoletoBarcode';

const CB_REAL = '34191098500000150000000123456789012345678901';
const LD_REAL = '34191.09850 00001.500000 00123.456789 1 09850000015000';

describe('BoletoBarcode', () => {
  it('mostra o codigo do PROVEDOR, sem fabricar nada', () => {
    render(<BoletoBarcode codigoBarras={CB_REAL} linhaDigitavel={LD_REAL} />);

    expect(screen.getByText(CB_REAL)).toBeInTheDocument();
    expect(screen.getByText(LD_REAL)).toBeInTheDocument();
    expect(screen.getByText('Do provedor')).toBeInTheDocument();
    // o rotulo que dava fe publica a numero inventado nao pode voltar
    expect(screen.queryByText(/FEBRABAN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Auto-gerado/i)).not.toBeInTheDocument();
  });

  it('o tamanho exibido e o do codigo recebido, nao um rotulo fixo de 44', () => {
    render(<BoletoBarcode codigoBarras={CB_REAL} />);
    expect(screen.getByText(/Código de barras \(44 dígitos\)/)).toBeInTheDocument();

    // um codigo de 45 digitos (o que o gerador antigo produzia) aparece como 45
    const cb45 = CB_REAL + '7';
    render(<BoletoBarcode codigoBarras={cb45} />);
    expect(screen.getByText(/Código de barras \(45 dígitos\)/)).toBeInTheDocument();
  });

  it('sem codigo do provedor, diz que nao tem -- e nao oferece copia', () => {
    render(<BoletoBarcode codigoBarras={null} linhaDigitavel={undefined} />);

    expect(screen.getByText(/não disponível/i)).toBeInTheDocument();
    expect(screen.getByText(/Nenhum número é gerado aqui/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('copia so digitos da linha digitavel formatada', async () => {
    const escrito: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: (t: string) => {
          escrito.push(t);
          return Promise.resolve();
        },
      },
    });
    render(<BoletoBarcode linhaDigitavel={LD_REAL} />);

    await userEvent.click(screen.getByRole('button', { name: /Copiar linha digitável/i }));
    expect(escrito[0]).toBe(LD_REAL.replace(/\D/g, ''));
  });
});
