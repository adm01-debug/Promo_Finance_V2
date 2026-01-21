import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '', email: '' },
      })
    );

    expect(result.current.values).toEqual({ name: '', email: '' });
    expect(result.current.errors).toEqual({});
  });

  it('updates values on change', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '' },
      })
    );

    act(() => {
      result.current.handleChange('name', 'John');
    });

    expect(result.current.values.name).toBe('John');
  });

  it('handles input change event', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '' },
      })
    );

    act(() => {
      result.current.handleInputChange({
        target: { name: 'name', value: 'Jane' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.name).toBe('Jane');
  });

  it('validates on submit', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => 
      useForm({
        initialValues: { email: '' },
        validate: {
          email: (value) => (!value ? 'Email is required' : undefined),
        },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.errors.email).toBe('Email is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when valid', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: 'John' },
        validate: {
          name: (value) => (!value ? 'Required' : undefined),
        },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
  });

  it('clears errors on value change', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '' },
        validate: {
          name: (value) => (!value ? 'Required' : undefined),
        },
      })
    );

    act(() => {
      result.current.setFieldError('name', 'Required');
    });

    expect(result.current.errors.name).toBe('Required');

    act(() => {
      result.current.handleChange('name', 'John');
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it('resets form to initial values', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: 'Initial' },
      })
    );

    act(() => {
      result.current.handleChange('name', 'Changed');
    });

    expect(result.current.values.name).toBe('Changed');

    act(() => {
      result.current.reset();
    });

    expect(result.current.values.name).toBe('Initial');
    expect(result.current.errors).toEqual({});
  });

  it('tracks dirty state', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '' },
      })
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.handleChange('name', 'John');
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('tracks touched fields', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '', email: '' },
      })
    );

    expect(result.current.touched.name).toBeFalsy();

    act(() => {
      result.current.handleBlur('name');
    });

    expect(result.current.touched.name).toBe(true);
    expect(result.current.touched.email).toBeFalsy();
  });

  it('validates single field', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '' },
        validate: {
          name: (value) => (!value ? 'Required' : undefined),
        },
      })
    );

    act(() => {
      result.current.validateField('name');
    });

    expect(result.current.errors.name).toBe('Required');
  });

  it('sets multiple values at once', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '', email: '' },
      })
    );

    act(() => {
      result.current.setValues({ name: 'John', email: 'john@example.com' });
    });

    expect(result.current.values).toEqual({ name: 'John', email: 'john@example.com' });
  });

  it('handles async validation', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => 
      useForm({
        initialValues: { email: 'test@test.com' },
        validate: {
          email: async (value) => {
            await new Promise((r) => setTimeout(r, 10));
            return value.includes('invalid') ? 'Invalid email' : undefined;
          },
        },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onSubmit).toHaveBeenCalled();
  });

  it('tracks submitting state', async () => {
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(r, 50))
    );

    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: 'Test' },
        onSubmit,
      })
    );

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.isSubmitting).toBe(true);
  });
});
