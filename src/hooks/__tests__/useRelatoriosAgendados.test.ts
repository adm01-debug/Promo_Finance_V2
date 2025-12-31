import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRelatoriosAgendados } from '../useRelatoriosAgendados';

describe('useRelatoriosAgendados', () => {
  it('deve listar relatórios agendados', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    await waitFor(() => {
      expect(result.current.relatorios).toBeDefined();
      expect(Array.isArray(result.current.relatorios)).toBe(true);
    });
  });

  it('deve agendar novo relatório', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    const novoRelatorio = {
      tipo: 'fluxo-caixa',
      periodicidade: 'mensal',
      dia: 1,
      hora: '09:00',
      destinatarios: ['financeiro@empresa.com']
    };
    
    await act(async () => {
      await result.current.agendar(novoRelatorio);
    });
    
    await waitFor(() => {
      expect(result.current.relatorios.length).toBeGreaterThan(0);
    });
  });

  it('deve editar relatório agendado', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    await act(async () => {
      await result.current.editar('rel-1', {
        periodicidade: 'semanal',
        dia: 5
      });
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('deve deletar relatório agendado', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    await act(async () => {
      await result.current.deletar('rel-1');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it('deve pausar/retomar agendamento', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    await act(async () => {
      await result.current.pausar('rel-1');
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await act(async () => {
      await result.current.retomar('rel-1');
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('deve executar relatório manualmente', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    await act(async () => {
      await result.current.executarAgora('rel-1');
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('deve listar histórico de execuções', async () => {
    const { result } = renderHook(() => useRelatoriosAgendados());
    
    const historico = await act(async () => {
      return await result.current.getHistorico('rel-1');
    });
    
    expect(Array.isArray(historico)).toBe(true);
  });
});
