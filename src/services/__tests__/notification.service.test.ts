import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '../notification.service';

// Mock toast library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('success notifications', () => {
    it('shows success notification', () => {
      notificationService.success('Operation completed');

      expect(toast.success).toHaveBeenCalledWith('Operation completed', expect.any(Object));
    });

    it('shows success with custom title', () => {
      notificationService.success('Data saved', { title: 'Success!' });

      expect(toast.success).toHaveBeenCalledWith(
        'Data saved',
        expect.objectContaining({ description: 'Success!' })
      );
    });

    it('shows success with duration', () => {
      notificationService.success('Quick message', { duration: 2000 });

      expect(toast.success).toHaveBeenCalledWith(
        'Quick message',
        expect.objectContaining({ duration: 2000 })
      );
    });

    it('shows success with action', () => {
      const action = { label: 'Undo', onClick: vi.fn() };
      notificationService.success('Item deleted', { action });

      expect(toast.success).toHaveBeenCalledWith(
        'Item deleted',
        expect.objectContaining({ action })
      );
    });
  });

  describe('error notifications', () => {
    it('shows error notification', () => {
      notificationService.error('Something went wrong');

      expect(toast.error).toHaveBeenCalledWith('Something went wrong', expect.any(Object));
    });

    it('shows error with description', () => {
      notificationService.error('Failed to save', { description: 'Network error' });

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to save',
        expect.objectContaining({ description: 'Network error' })
      );
    });

    it('shows error from Error object', () => {
      const error = new Error('Database connection failed');
      notificationService.error(error.message);

      expect(toast.error).toHaveBeenCalledWith('Database connection failed', expect.any(Object));
    });

    it('shows error with longer duration', () => {
      notificationService.error('Critical error', { duration: 10000 });

      expect(toast.error).toHaveBeenCalledWith(
        'Critical error',
        expect.objectContaining({ duration: 10000 })
      );
    });
  });

  describe('warning notifications', () => {
    it('shows warning notification', () => {
      notificationService.warning('Please review your data');

      expect(toast.warning).toHaveBeenCalledWith('Please review your data', expect.any(Object));
    });

    it('shows warning with title', () => {
      notificationService.warning('Some fields are incomplete', { title: 'Warning' });

      expect(toast.warning).toHaveBeenCalledWith(
        'Some fields are incomplete',
        expect.objectContaining({ description: 'Warning' })
      );
    });
  });

  describe('info notifications', () => {
    it('shows info notification', () => {
      notificationService.info('New feature available');

      expect(toast.info).toHaveBeenCalledWith('New feature available', expect.any(Object));
    });

    it('shows info with link action', () => {
      const action = { label: 'Learn more', onClick: vi.fn() };
      notificationService.info('Updates available', { action });

      expect(toast.info).toHaveBeenCalledWith(
        'Updates available',
        expect.objectContaining({ action })
      );
    });
  });

  describe('loading notifications', () => {
    it('shows loading notification', () => {
      notificationService.loading('Processing...');

      expect(toast.loading).toHaveBeenCalledWith('Processing...', expect.any(Object));
    });

    it('returns toast id for dismissal', () => {
      vi.mocked(toast.loading).mockReturnValue('toast-123');

      const toastId = notificationService.loading('Loading data...');

      expect(toastId).toBe('toast-123');
    });
  });

  describe('promise notifications', () => {
    it('shows promise notification', async () => {
      const promise = Promise.resolve({ data: 'test' });

      notificationService.promise(promise, {
        loading: 'Saving...',
        success: 'Saved!',
        error: 'Failed to save',
      });

      expect(toast.promise).toHaveBeenCalledWith(
        promise,
        expect.objectContaining({
          loading: 'Saving...',
          success: 'Saved!',
          error: 'Failed to save',
        })
      );
    });

    it('handles promise with function messages', async () => {
      const promise = Promise.resolve({ name: 'Test Item' });

      notificationService.promise(promise, {
        loading: 'Saving...',
        success: (data: any) => `Saved ${data.name}`,
        error: (err: any) => `Error: ${err.message}`,
      });

      expect(toast.promise).toHaveBeenCalled();
    });
  });

  describe('dismiss notifications', () => {
    it('dismisses specific notification', () => {
      notificationService.dismiss('toast-123');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });

    it('dismisses all notifications', () => {
      notificationService.dismissAll();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('custom notifications', () => {
    it('shows custom notification with render function', () => {
      const customRender = vi.fn();
      notificationService.custom(customRender);

      // Custom implementation would call the render function
      expect(customRender).not.toHaveBeenCalled(); // Depends on implementation
    });
  });

  describe('notification options', () => {
    it('supports position option', () => {
      notificationService.success('Message', { position: 'top-right' });

      expect(toast.success).toHaveBeenCalledWith(
        'Message',
        expect.objectContaining({ position: 'top-right' })
      );
    });

    it('supports dismissible option', () => {
      notificationService.info('Dismissible', { dismissible: true });

      expect(toast.info).toHaveBeenCalledWith(
        'Dismissible',
        expect.objectContaining({ dismissible: true })
      );
    });

    it('supports icon option', () => {
      notificationService.success('With icon', { icon: '✨' });

      expect(toast.success).toHaveBeenCalledWith(
        'With icon',
        expect.objectContaining({ icon: '✨' })
      );
    });

    it('supports className option', () => {
      notificationService.info('Styled', { className: 'custom-toast' });

      expect(toast.info).toHaveBeenCalledWith(
        'Styled',
        expect.objectContaining({ className: 'custom-toast' })
      );
    });
  });

  describe('shorthand methods', () => {
    it('has shorthand for common operations', () => {
      notificationService.saved();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('salvo'), expect.any(Object));

      vi.clearAllMocks();

      notificationService.deleted();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('excluído'), expect.any(Object));

      vi.clearAllMocks();

      notificationService.updated();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('atualizado'), expect.any(Object));
    });

    it('has shorthand for error operations', () => {
      notificationService.saveError();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('salvar'), expect.any(Object));

      vi.clearAllMocks();

      notificationService.loadError();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('carregar'), expect.any(Object));

      vi.clearAllMocks();

      notificationService.networkError();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('conexão'), expect.any(Object));
    });
  });
});
