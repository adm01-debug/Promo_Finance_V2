import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomerDeepScore } from '../CustomerDeepScore';

describe('CustomerDeepScore', () => {
  it('não inventa scores de bureaus nem data de consulta quando a integração não forneceu dados', () => {
    render(<CustomerDeepScore score={65} />);

    expect(screen.getAllByText('Não consultado')).toHaveLength(2);
    expect(screen.getAllByText('Integração não configurada')).toHaveLength(2);
    expect(screen.getByText(/Sem consulta registrada/)).toBeInTheDocument();
    expect(screen.getByText('Ainda não há análise comportamental disponível para este cliente.')).toBeInTheDocument();
    expect(screen.queryByText('+5 pts este mês')).not.toBeInTheDocument();
  });

  it('apresenta somente scores externos informados por uma integração', () => {
    render(
      <CustomerDeepScore
        score={82}
        serasaScore={810}
        boaVistaScore={740}
        riscoComportamental="Histórico validado pela integração."
        lastUpdate="10/09/2026"
      />,
    );

    expect(screen.getByText('810')).toBeInTheDocument();
    expect(screen.getByText('740')).toBeInTheDocument();
    expect(screen.queryByText('Não consultado')).not.toBeInTheDocument();
    expect(screen.getByText(/10\/09\/2026/)).toBeInTheDocument();
  });
});
