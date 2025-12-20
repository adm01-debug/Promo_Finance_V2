import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorTracker, withErrorTracking, reportErrorToTracker } from '@/lib/error-tracking';

describe('errorTracker', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('captureException', () => {
    it('should log errors to console', () => {
      const error = new Error('Test error');
      
      errorTracker.captureException(error);
      
      expect(console.error).toHaveBeenCalledWith(
        '[ErrorTracker] Exception:',
        error
      );
    });

    it('should log context when provided', () => {
      const error = new Error('Test error');
      const context = { userId: '123', email: 'test@example.com' };
      
      errorTracker.captureException(error, context);
      
      expect(console.error).toHaveBeenCalledWith(
        '[ErrorTracker] Context:',
        context
      );
    });
  });

  describe('captureMessage', () => {
    it('should log info messages', () => {
      errorTracker.captureMessage('Info message', 'info');
      
      expect(console.info).toHaveBeenCalledWith(
        '[ErrorTracker] INFO: Info message'
      );
    });

    it('should log warning messages', () => {
      errorTracker.captureMessage('Warning message', 'warning');
      
      expect(console.warn).toHaveBeenCalledWith(
        '[ErrorTracker] WARNING: Warning message'
      );
    });

    it('should log error messages', () => {
      errorTracker.captureMessage('Error message', 'error');
      
      expect(console.error).toHaveBeenCalledWith(
        '[ErrorTracker] ERROR: Error message'
      );
    });

    it('should default to info level', () => {
      errorTracker.captureMessage('Default message');
      
      expect(console.info).toHaveBeenCalledWith(
        '[ErrorTracker] INFO: Default message'
      );
    });
  });

  describe('setUser', () => {
    it('should log when user is set', () => {
      errorTracker.setUser({ id: '123', email: 'test@example.com' });
      
      expect(console.info).toHaveBeenCalledWith(
        '[ErrorTracker] User set:',
        '123'
      );
    });

    it('should log when user is cleared', () => {
      errorTracker.setUser(null);
      
      expect(console.info).toHaveBeenCalledWith(
        '[ErrorTracker] User cleared'
      );
    });
  });

  describe('addBreadcrumb', () => {
    it('should log breadcrumbs', () => {
      errorTracker.addBreadcrumb({
        category: 'navigation',
        message: 'User navigated to /dashboard',
      });
      
      expect(console.debug).toHaveBeenCalledWith(
        '[ErrorTracker] Breadcrumb:',
        'navigation',
        '-',
        'User navigated to /dashboard'
      );
    });
  });
});

describe('withErrorTracking', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return result when function succeeds', async () => {
    const fn = async (x: number) => x * 2;
    const wrappedFn = withErrorTracking(fn);
    
    const result = await wrappedFn(5);
    
    expect(result).toBe(10);
  });

  it('should capture exception and rethrow when function fails', async () => {
    const error = new Error('Test error');
    const fn = async () => { throw error; };
    const wrappedFn = withErrorTracking(fn);
    
    await expect(wrappedFn()).rejects.toThrow('Test error');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('reportErrorToTracker', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report errors with component stack', () => {
    const error = new Error('Component error');
    const componentStack = '\n    at Button\n    at App';
    
    reportErrorToTracker(error, componentStack);
    
    expect(console.error).toHaveBeenCalled();
  });
});
