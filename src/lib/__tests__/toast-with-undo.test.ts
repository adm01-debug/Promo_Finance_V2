import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toastWithUndo, toastDeleteWithUndo, toastBulkWithUndo, toastSuccessWithUndo } from '@/lib/toast-with-undo';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: Object.assign(
    vi.fn(() => 'mock-toast-id'),
    {
      success: vi.fn(() => 'mock-success-id'),
      error: vi.fn(() => 'mock-error-id'),
    }
  ),
}));

describe('toastWithUndo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a toast with the correct title', () => {
    const onUndo = vi.fn();
    
    toastWithUndo({
      title: 'Test Toast',
      onUndo,
    });
    
    expect(toast).toHaveBeenCalledWith(
      'Test Toast',
      expect.objectContaining({
        action: expect.any(Object),
      })
    );
  });

  it('should include description when provided', () => {
    const onUndo = vi.fn();
    
    toastWithUndo({
      title: 'Test Toast',
      description: 'Test description',
      onUndo,
    });
    
    expect(toast).toHaveBeenCalledWith(
      'Test Toast',
      expect.objectContaining({
        description: 'Test description',
      })
    );
  });

  it('should use custom duration when provided', () => {
    const onUndo = vi.fn();
    
    toastWithUndo({
      title: 'Test Toast',
      duration: 10000,
      onUndo,
    });
    
    expect(toast).toHaveBeenCalledWith(
      'Test Toast',
      expect.objectContaining({
        duration: 10000,
      })
    );
  });

  it('should return a toast id', () => {
    const onUndo = vi.fn();
    
    const result = toastWithUndo({
      title: 'Test Toast',
      onUndo,
    });
    
    expect(result).toBe('mock-toast-id');
  });
});

describe('toastDeleteWithUndo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a delete toast with item name', () => {
    const item = { id: '1', name: 'Test Item' };
    const onDelete = vi.fn();
    const onRestore = vi.fn();
    
    toastDeleteWithUndo({
      item,
      itemName: 'Item',
      onDelete,
      onRestore,
    });
    
    expect(toast).toHaveBeenCalledWith(
      'Item removido',
      expect.any(Object)
    );
  });

  it('should include restore instructions in description', () => {
    const item = { id: '1' };
    const onDelete = vi.fn();
    const onRestore = vi.fn();
    
    toastDeleteWithUndo({
      item,
      itemName: 'Registro',
      onDelete,
      onRestore,
    });
    
    expect(toast).toHaveBeenCalledWith(
      'Registro removido',
      expect.objectContaining({
        description: 'Clique em "Desfazer" para restaurar.',
      })
    );
  });
});

describe('toastBulkWithUndo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle single item correctly', () => {
    const onUndo = vi.fn();
    
    toastBulkWithUndo({
      count: 1,
      action: 'removido',
      onUndo,
    });
    
    expect(toast).toHaveBeenCalledWith(
      '1 item removido',
      expect.any(Object)
    );
  });

  it('should handle multiple items correctly', () => {
    const onUndo = vi.fn();
    
    toastBulkWithUndo({
      count: 5,
      action: 'removidos',
      onUndo,
    });
    
    expect(toast).toHaveBeenCalledWith(
      '5 itens removidos',
      expect.any(Object)
    );
  });

  it('should use longer duration for bulk operations', () => {
    const onUndo = vi.fn();
    
    toastBulkWithUndo({
      count: 10,
      action: 'atualizados',
      onUndo,
    });
    
    expect(toast).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        duration: 6000,
      })
    );
  });
});

describe('toastSuccessWithUndo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create undo toast when onUndo is provided', () => {
    const onUndo = vi.fn();
    
    toastSuccessWithUndo({
      title: 'Sucesso',
      onUndo,
    });
    
    expect(toast).toHaveBeenCalled();
  });

  it('should create regular success toast when onUndo is not provided', () => {
    toastSuccessWithUndo({
      title: 'Sucesso',
      description: 'Operação concluída',
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Sucesso',
      expect.objectContaining({
        description: 'Operação concluída',
      })
    );
  });
});
