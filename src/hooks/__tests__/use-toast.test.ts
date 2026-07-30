import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast, useToast } from '../use-toast';

const sonnerMock = vi.hoisted(() => {
  const show = vi.fn(() => 'id-default');
  const error = vi.fn(() => 'id-error');
  const dismiss = vi.fn();
  return { show, error, dismiss };
});

vi.mock('sonner', () => {
  type AnyFn = (...args: unknown[]) => unknown;
  const fn = Object.assign((...args: unknown[]) => (sonnerMock.show as AnyFn)(...args), {
    error: (...args: unknown[]) => (sonnerMock.error as AnyFn)(...args),
    dismiss: (...args: unknown[]) => (sonnerMock.dismiss as AnyFn)(...args),
  });
  return { toast: fn };
});

describe('use-toast (adapter sonner)', () => {
  beforeEach(() => {
    sonnerMock.show.mockClear();
    sonnerMock.error.mockClear();
    sonnerMock.dismiss.mockClear();
  });

  it('variant default delega para sonner com title e description', () => {
    toast({ title: 'Salvo', description: 'Registro criado' });
    expect(sonnerMock.show).toHaveBeenCalledWith(
      'Salvo',
      expect.objectContaining({ description: 'Registro criado' })
    );
    expect(sonnerMock.error).not.toHaveBeenCalled();
  });

  it('variant destructive delega para sonner.error', () => {
    toast({ title: 'Falhou', variant: 'destructive' });
    expect(sonnerMock.error).toHaveBeenCalledWith('Falhou', expect.anything());
    expect(sonnerMock.show).not.toHaveBeenCalled();
  });

  it('propaga duration', () => {
    toast({ title: 'x', duration: 9000 });
    expect(sonnerMock.show).toHaveBeenCalledWith('x', expect.objectContaining({ duration: 9000 }));
  });

  it('dismiss do retorno usa o id emitido pelo sonner', () => {
    const t = toast({ title: 'a' });
    t.dismiss();
    expect(sonnerMock.dismiss).toHaveBeenCalledWith('id-default');
  });

  it('update reusa o mesmo id', () => {
    const t = toast({ title: 'a' });
    t.update({ title: 'b', description: 'nova' });
    expect(sonnerMock.show).toHaveBeenLastCalledWith(
      'b',
      expect.objectContaining({ id: 'id-default', description: 'nova' })
    );
  });

  it('useToast().dismiss sem id repassa undefined (fecha todos)', () => {
    const { dismiss } = useToast();
    dismiss();
    expect(sonnerMock.dismiss).toHaveBeenCalledWith(undefined);
  });

  it('title ausente vira string vazia (não quebra)', () => {
    toast({ description: 'apenas descrição' });
    expect(sonnerMock.show).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ description: 'apenas descrição' })
    );
  });

  it('simulação em massa: 200 permutações variant/título/descrição/duração roteiam corretamente', () => {
    const variants = ['default', 'destructive', undefined] as const;
    const titles = ['Op concluída', '', undefined, 'Erro #42'];
    const descriptions = ['detalhe', undefined];
    const durations = [undefined, 1000, 5000];
    let defaults = 0;
    let destructives = 0;
    for (const variant of variants)
      for (const title of titles)
        for (const description of descriptions)
          for (const duration of durations)
            for (let rep = 0; rep < 3; rep++) {
              toast({ title, description, variant, duration });
              if (variant === 'destructive') destructives++;
              else defaults++;
            }
    expect(sonnerMock.show).toHaveBeenCalledTimes(defaults);
    expect(sonnerMock.error).toHaveBeenCalledTimes(destructives);
    expect(defaults + destructives).toBe(216);
  });
});
