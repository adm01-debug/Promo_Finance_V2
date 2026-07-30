import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

import { toast } from 'sonner';
import {
  classifyAuditPriority,
  toastForPriority,
  PRIORITY_META,
} from '../audit-priority';

describe('audit-priority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classifyAuditPriority', () => {
    it('mapeia actions base corretamente', () => {
      expect(classifyAuditPriority({ action: 'DELETE' })).toBe('high');
      expect(classifyAuditPriority({ action: 'REJECT' })).toBe('high');
      expect(classifyAuditPriority({ action: 'APPROVE' })).toBe('medium');
      expect(classifyAuditPriority({ action: 'EXPORT' })).toBe('medium');
      expect(classifyAuditPriority({ action: 'UPDATE' })).toBe('medium');
      expect(classifyAuditPriority({ action: 'INSERT' })).toBe('low');
      expect(classifyAuditPriority({ action: 'LOGIN' })).toBe('info');
      expect(classifyAuditPriority({ action: 'LOGOUT' })).toBe('info');
      expect(classifyAuditPriority({ action: 'DESCONHECIDA' })).toBe('low');
    });

    it('tabela sensível eleva para high', () => {
      expect(classifyAuditPriority({ action: 'UPDATE', table_name: 'user_roles' })).toBe('high');
      expect(classifyAuditPriority({ action: 'INSERT', table_name: 'allowed_ips' })).toBe('high');
    });

    it('DELETE em tabela sensível é critical', () => {
      expect(classifyAuditPriority({ action: 'DELETE', table_name: 'user_roles' })).toBe('critical');
      expect(classifyAuditPriority({ action: 'DELETE', table_name: 'profiles' })).toBe('critical');
    });

    it('padrões críticos em details sobrepõem', () => {
      expect(
        classifyAuditPriority({ action: 'INSERT', details: 'Privilege escalation detected' }),
      ).toBe('critical');
      expect(
        classifyAuditPriority({ action: 'LOGIN', details: 'Senha alterada com sucesso' }),
      ).toBe('critical');
      expect(
        classifyAuditPriority({ action: 'UPDATE', details: 'MFA disabled' }),
      ).toBe('critical');
      expect(
        classifyAuditPriority({ action: 'INSERT', details: 'API-key rotated' }),
      ).toBe('critical');
      expect(
        classifyAuditPriority({ action: 'INSERT', details: 'bloqueio efetuado' }),
      ).toBe('critical');
    });

    it('padrões high elevam para high mas não critical', () => {
      expect(classifyAuditPriority({ action: 'INSERT', details: 'Falha ao processar' })).toBe('high');
      expect(classifyAuditPriority({ action: 'LOGIN', details: 'Tentativa suspeita' })).toBe('high');
      expect(classifyAuditPriority({ action: 'EXPORT', details: 'Bulk export solicitado' })).toBe('high');
    });

    it('nunca rebaixa a prioridade', () => {
      // DELETE já é high; padrão baixo não deve rebaixar
      expect(classifyAuditPriority({ action: 'DELETE', details: 'normal' })).toBe('high');
    });

    it('details/table nulos ou vazios não quebram', () => {
      expect(classifyAuditPriority({ action: 'UPDATE', details: null, table_name: null })).toBe('medium');
      expect(classifyAuditPriority({ action: 'UPDATE', details: '', table_name: '' })).toBe('medium');
    });
  });

  describe('PRIORITY_META', () => {
    it('cobre todas as prioridades com tone válido', () => {
      const tones = new Set(['destructive', 'warning', 'accent', 'muted', 'info']);
      for (const p of ['critical', 'high', 'medium', 'low', 'info'] as const) {
        expect(PRIORITY_META[p].label).toBeTruthy();
        expect(tones.has(PRIORITY_META[p].tone)).toBe(true);
      }
    });
  });

  describe('toastForPriority', () => {
    it('critical usa toast.error com duração 15s', () => {
      toastForPriority('critical', 'msg');
      expect(toast.error).toHaveBeenCalledWith('msg', expect.objectContaining({ duration: 15000 }));
    });
    it('high também usa toast.error', () => {
      toastForPriority('high', 'msg');
      expect(toast.error).toHaveBeenCalled();
    });
    it('medium usa toast.warning', () => {
      toastForPriority('medium', 'msg');
      expect(toast.warning).toHaveBeenCalled();
    });
    it('info usa toast.info', () => {
      toastForPriority('info', 'msg');
      expect(toast.info).toHaveBeenCalled();
    });
    it('low usa toast base', () => {
      toastForPriority('low', 'msg');
      expect(toast).toHaveBeenCalledWith('msg', expect.any(Object));
    });
    it('options do usuário sobrescrevem defaults', () => {
      toastForPriority('critical', 'msg', { duration: 500, description: 'x' });
      expect(toast.error).toHaveBeenCalledWith(
        'msg',
        expect.objectContaining({ duration: 500, description: 'x' }),
      );
    });
  });
});
