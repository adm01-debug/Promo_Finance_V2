import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import 'vitest-axe/extend-expect';
import { axe } from 'vitest-axe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkipLinks } from '@/components/accessibility/SkipLinks';

const axeConfig = {
  rules: {
    // jsdom não calcula contraste — desabilitar nesta camada (validado em e2e/Lighthouse)
    'color-contrast': { enabled: false },
    region: { enabled: false },
  },
};

describe('A11y — componentes críticos WCAG 2.1 AA', () => {
  it('SkipLinks não possui violações', async () => {
    const { container } = render(<SkipLinks />);
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('Formulário básico (Label + Input + Button) não possui violações', async () => {
    const { container } = render(
      <form>
        <Label htmlFor="email-test">E-mail</Label>
        <Input id="email-test" type="email" placeholder="voce@empresa.com" />
        <Button type="submit">Enviar</Button>
      </form>,
    );
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('Botão com aria-label não possui violações', async () => {
    const { container } = render(
      <Button aria-label="Fechar modal" type="button">
        ×
      </Button>,
    );
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });
});
