import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApi, useApiMutation, useApiQuery } from '../useApi';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useApi hook', () => {
    it('starts in idle state', () => {
      const { result } = renderHook(() => useApi());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('executes request and returns data', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApi<typeof mockData>());

      await act(async () => {
        await result.current.execute(() => apiClient.get('/test'));
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles loading state', async () => {
      vi.mocked(apiClient.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
      );

      const { result } = renderHook(() => useApi());

      act(() => {
        result.current.execute(() => apiClient.get('/test'));
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles errors', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        try {
          await result.current.execute(() => apiClient.get('/test'));
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe(error);
      expect(result.current.data).toBeNull();
    });

    it('resets state', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.execute(() => apiClient.get('/test'));
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('useApiMutation hook', () => {
    it('executes mutation', async () => {
      const mockResponse = { id: 1, created: true };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => 
        useApiMutation((data: { name: string }) => apiClient.post('/items', data))
      );

      await act(async () => {
        await result.current.mutate({ name: 'New Item' });
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/items', { name: 'New Item' });
    });

    it('calls onSuccess callback', async () => {
      const onSuccess = vi.fn();
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() => 
        useApiMutation(
          (data: any) => apiClient.post('/items', data),
          { onSuccess }
        )
      );

      await act(async () => {
        await result.current.mutate({ name: 'Test' });
      });

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    });

    it('calls onError callback', async () => {
      const onError = vi.fn();
      const error = new Error('Mutation failed');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => 
        useApiMutation(
          (data: any) => apiClient.post('/items', data),
          { onError }
        )
      );

      await act(async () => {
        try {
          await result.current.mutate({ name: 'Test' });
        } catch (e) {
          // Expected
        }
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('useApiQuery hook', () => {
    it('fetches data on mount', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => 
        useApiQuery(() => apiClient.get('/items'))
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });

    it('refetches when dependencies change', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      const { result, rerender } = renderHook(
        ({ id }) => useApiQuery(() => apiClient.get(`/items/${id}`), [id]),
        { initialProps: { id: 1 } }
      );

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/items/1'));

      rerender({ id: 2 });

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/items/2'));
    });

    it('does not fetch when enabled is false', () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      renderHook(() => 
        useApiQuery(() => apiClient.get('/items'), [], { enabled: false })
      );

      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });
});
