/**
 * Enhanced Form Hooks
 * Reusable form logic with validation, submission, and state management
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

// ==========================================
// TYPES
// ==========================================

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  schema?: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSuccess?: boolean;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (newValues?: T) => void;
  validate: () => boolean;
  getFieldProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    error: string | undefined;
  };
}

// ==========================================
// MAIN HOOK
// ==========================================

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  schema,
  onSubmit,
  onSuccess,
  onError,
  validateOnChange = true,
  validateOnBlur = true,
  resetOnSuccess = false,
}: UseFormOptions<T>): UseFormReturn<T> {
  const initialValuesRef = useRef(initialValues);
  
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  });

  // Validate single field
  const validateField = useCallback((field: keyof T, value: unknown): string | undefined => {
    if (!schema) return undefined;
    
    try {
      // Create partial data and validate with full schema
      const partialData = { ...state.values, [field]: value };
      schema.parse(partialData);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path[0] === field);
        return fieldError?.message;
      }
      return undefined;
    }
  }, [schema, state.values]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    if (!schema) return true;
    
    try {
      schema.parse(state.values);
      setState(prev => ({ ...prev, errors: {}, isValid: true }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof T;
          if (!errors[path]) {
            errors[path] = err.message;
          }
        });
        setState(prev => ({ ...prev, errors, isValid: false }));
      }
      return false;
    }
  }, [schema, state.values]);

  // Set single value
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);
      
      let newErrors = prev.errors;
      if (validateOnChange && schema) {
        const error = validateField(field, value);
        newErrors = { ...prev.errors, [field]: error };
      }
      
      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isDirty,
      };
    });
  }, [validateOnChange, validateField, schema]);

  // Set multiple values
  const setValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newValues = { ...prev.values, ...values };
      const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);
      return {
        ...prev,
        values: newValues,
        isDirty,
      };
    });
  }, []);

  // Set error for field
  const setError = useCallback((field: keyof T, message: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: message },
      isValid: false,
    }));
  }, []);

  // Clear error for field
  const clearError = useCallback((field: keyof T) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // Handle change event
  const handleChange = useCallback((field: keyof T) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    setValue(field, value as T[keyof T]);
  }, [setValue]);

  // Handle blur event
  const handleBlur = useCallback((field: keyof T) => () => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));
    
    if (validateOnBlur && schema) {
      const error = validateField(field, state.values[field]);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: error },
      }));
    }
  }, [validateOnBlur, validateField, schema, state.values]);

  // Handle form submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validate()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(state.values);
      onSuccess?.();
      
      if (resetOnSuccess) {
        setState({
          values: initialValuesRef.current,
          errors: {},
          touched: {},
          isSubmitting: false,
          isValid: true,
          isDirty: false,
        });
      } else {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      onError?.(error as Error);
      toast.error((error as Error).message || 'Erro ao enviar formulário');
    }
  }, [validate, onSubmit, onSuccess, onError, resetOnSuccess, state.values]);

  // Reset form
  const reset = useCallback((newValues?: T) => {
    const values = newValues || initialValuesRef.current;
    initialValuesRef.current = values;
    setState({
      values,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, []);

  // Get field props helper
  const getFieldProps = useCallback((field: keyof T) => ({
    value: state.values[field],
    onChange: handleChange(field) as (e: React.ChangeEvent<HTMLInputElement>) => void,
    onBlur: handleBlur(field),
    error: state.touched[field] ? state.errors[field] : undefined,
  }), [state.values, state.errors, state.touched, handleChange, handleBlur]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
    getFieldProps,
  };
}

// ==========================================
// FIELD ARRAY HOOK
// ==========================================

interface UseFieldArrayReturn<T> {
  fields: T[];
  append: (item: T) => void;
  prepend: (item: T) => void;
  remove: (index: number) => void;
  update: (index: number, item: T) => void;
  move: (from: number, to: number) => void;
  swap: (indexA: number, indexB: number) => void;
  replace: (items: T[]) => void;
  clear: () => void;
}

export function useFieldArray<T>(
  initialItems: T[] = []
): UseFieldArrayReturn<T> {
  const [fields, setFields] = useState<T[]>(initialItems);

  const append = useCallback((item: T) => {
    setFields(prev => [...prev, item]);
  }, []);

  const prepend = useCallback((item: T) => {
    setFields(prev => [item, ...prev]);
  }, []);

  const remove = useCallback((index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setFields(prev => prev.map((f, i) => i === index ? item : f));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setFields(prev => {
      const result = [...prev];
      const [removed] = result.splice(from, 1);
      result.splice(to, 0, removed);
      return result;
    });
  }, []);

  const swap = useCallback((indexA: number, indexB: number) => {
    setFields(prev => {
      const result = [...prev];
      [result[indexA], result[indexB]] = [result[indexB], result[indexA]];
      return result;
    });
  }, []);

  const replace = useCallback((items: T[]) => {
    setFields(items);
  }, []);

  const clear = useCallback(() => {
    setFields([]);
  }, []);

  return {
    fields,
    append,
    prepend,
    remove,
    update,
    move,
    swap,
    replace,
    clear,
  };
}

// ==========================================
// ASYNC FORM DATA HOOK
// ==========================================

interface UseAsyncFormDataOptions<T> {
  fetcher: () => Promise<T>;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncFormDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAsyncFormData<T>({
  fetcher,
  enabled = true,
  onSuccess,
  onError,
}: UseAsyncFormDataOptions<T>): UseAsyncFormDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, onSuccess, onError]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ==========================================
// FORM PERSISTENCE HOOK
// ==========================================

interface UseFormPersistenceOptions<T> {
  key: string;
  values: T;
  setValues: (values: T) => void;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormPersistence<T>({
  key,
  values,
  setValues,
  enabled = true,
  debounceMs = 500,
}: UseFormPersistenceOptions<T>): { clear: () => void } {
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load on mount
  useEffect(() => {
    if (!enabled) return;
    
    const stored = localStorage.getItem(`form_${key}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setValues(parsed);
      } catch {
        // Ignore parse errors
      }
    }
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on change (debounced)
  useEffect(() => {
    if (!enabled) return;
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(`form_${key}`, JSON.stringify(values));
    }, debounceMs);
    
    return () => clearTimeout(timeoutRef.current);
  }, [key, values, enabled, debounceMs]);

  const clear = useCallback(() => {
    localStorage.removeItem(`form_${key}`);
  }, [key]);

  return { clear };
}

// ==========================================
// CONFIRMATION HOOK
// ==========================================

interface UseConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface UseConfirmationReturn {
  isOpen: boolean;
  confirm: () => Promise<boolean>;
  cancel: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirmation(): UseConfirmationReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmationOptions>({
    message: '',
    title: 'Confirmar',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'default',
  });
  
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = useCallback((opts?: Partial<UseConfirmationOptions>): Promise<boolean> => {
    setOptions(prev => ({ ...prev, ...opts }));
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const onConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(true);
  }, []);

  const onCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
  }, []);

  const cancel = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
  }, []);

  return {
    isOpen,
    confirm: (opts?: Partial<UseConfirmationOptions>) => confirm(opts),
    cancel,
    title: options.title || 'Confirmar',
    message: options.message,
    confirmText: options.confirmText || 'Confirmar',
    cancelText: options.cancelText || 'Cancelar',
    variant: options.variant || 'default',
    onConfirm,
    onCancel,
  };
}
