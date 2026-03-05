import { useState, useCallback, useMemo, FormEvent, ChangeEvent } from 'react';

type ValidationRule<T> = {
  validate: (value: T[keyof T], values: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

type TouchedFields<T> = {
  [K in keyof T]?: boolean;
};

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  /** Shorthand: per-field validator functions returning error string or undefined */
  validate?: {
    [K in keyof T]?: (value: T[K], allValues: T) => string | undefined;
  };
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  touched: TouchedFields<T>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  
  // Handlers
  handleChange: ((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void) & (<K extends keyof T>(field: K, value: T[K]) => void);
  handleBlur: ((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void) & ((field: keyof T) => void);
  handleSubmit: (e?: FormEvent) => Promise<void>;
  
  // Setters
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setErrors: (errors: FormErrors<T>) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  
  // Actions
  reset: (values?: T) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => string | undefined;
  
  // Helpers
  getFieldProps: (field: keyof T) => {
    name: string;
    value: T[keyof T];
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  };
  getFieldError: (field: keyof T) => string | undefined;
  isFieldTouched: (field: keyof T) => boolean;
  isFieldValid: (field: keyof T) => boolean;
}

/**
 * Hook para gerenciamento de formulários
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationRules = {},
  validate: validateFns,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<FormErrors<T>>({});
  const [touched, setTouchedState] = useState<TouchedFields<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar um campo
  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      // Check shorthand validate functions first
      if (validateFns && validateFns[field]) {
        return validateFns[field]!(values[field] as T[typeof field], values);
      }
      // Then check validationRules
      const rules = validationRules[field];
      if (!rules) return undefined;

      for (const rule of rules) {
        if (!rule.validate(values[field], values)) {
          return rule.message;
        }
      }

      return undefined;
    },
    [values, validationRules, validateFns]
  );

  // Validar todos os campos
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isFormValid = true;

    // Check validationRules
    for (const field of Object.keys(validationRules) as Array<keyof T>) {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isFormValid = false;
      }
    }

    // Check shorthand validate functions
    if (validateFns) {
      for (const field of Object.keys(validateFns) as Array<keyof T>) {
        if (!newErrors[field]) {
          const error = validateField(field);
          if (error) {
            newErrors[field] = error;
            isFormValid = false;
          }
        }
      }
    }

    setErrorsState(newErrors);
    return isFormValid;
  }, [validateField, validationRules, validateFns]);

  // Verificar se o formulário é válido
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Verificar se o formulário foi modificado
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Handler de change
  const handleChange = useCallback(
    (...args: unknown[]) => {
      // Support both (event) and (field, value) signatures
      if (args.length === 2 && typeof args[0] === 'string') {
        const field = args[0] as keyof T;
        const value = args[1] as T[keyof T];
        setValuesState((prev) => ({ ...prev, [field]: value }));
        if (validateOnChange) {
          const error = validateField(field);
          setErrorsState((prev) => ({ ...prev, [field]: error }));
        }
        return;
      }
      const e = args[0] as ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value;

      setValuesState((prev) => ({ ...prev, [name]: newValue }));

      if (validateOnChange) {
        const error = validateField(name as keyof T);
        setErrorsState((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateOnChange, validateField]
  ) as UseFormReturn<T>['handleChange'];

  // Handler de blur
  const handleBlur = useCallback(
    (...args: unknown[]) => {
      // Support both (event) and (field) signatures
      let fieldName: keyof T;
      if (args.length === 1 && typeof args[0] === 'string') {
        fieldName = args[0] as keyof T;
      } else {
        const e = args[0] as ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
        fieldName = e.target.name as keyof T;
      }

      setTouchedState((prev) => ({ ...prev, [fieldName]: true }));

      if (validateOnBlur) {
        const error = validateField(fieldName);
        setErrorsState((prev) => ({ ...prev, [fieldName]: error }));
      }
    },
    [validateOnBlur, validateField]
  ) as UseFormReturn<T>['handleBlur'];

  // Handler de submit
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Marcar todos como touched
      const allTouched: TouchedFields<T> = {};
      for (const key of Object.keys(values)) {
        allTouched[key as keyof T] = true;
      }
      setTouchedState(allTouched);

      if (!validate()) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit?.(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  // Setters
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const setErrors = useCallback((newErrors: FormErrors<T>) => {
    setErrorsState(newErrors);
  }, []);

  const setTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouchedState((prev) => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  // Reset
  const reset = useCallback((newValues?: T) => {
    setValuesState(newValues ?? initialValues);
    setErrorsState({});
    setTouchedState({});
  }, [initialValues]);

  // Helpers
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field as string,
      value: values[field],
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [values, handleChange, handleBlur]
  );

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  const isFieldTouched = useCallback(
    (field: keyof T): boolean => {
      return !!touched[field];
    },
    [touched]
  );

  const isFieldValid = useCallback(
    (field: keyof T): boolean => {
      return !errors[field];
    },
    [errors]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    reset,
    validate,
    validateField,
    getFieldProps,
    getFieldError,
    isFieldTouched,
    isFieldValid,
  };
}

// Validation helpers
export const required = (message = 'Campo obrigatório'): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  message,
});

export const minLength = (min: number, message?: string): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (typeof value !== 'string') return true;
    return value.length >= min;
  },
  message: message ?? `Mínimo ${min} caracteres`,
});

export const maxLength = (max: number, message?: string): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (typeof value !== 'string') return true;
    return value.length <= max;
  },
  message: message ?? `Máximo ${max} caracteres`,
});

export const email = (message = 'Email inválido'): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (typeof value !== 'string' || !value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message,
});

export const pattern = (regex: RegExp, message: string): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (typeof value !== 'string' || !value) return true;
    return regex.test(value);
  },
  message,
});

export const min = (minValue: number, message?: string): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (typeof value !== 'number') return true;
    return value >= minValue;
  },
  message: message ?? `Valor mínimo: ${minValue}`,
});

export const max = (maxValue: number, message?: string): ValidationRule<Record<string, unknown>> => ({
  validate: (value) => {
    if (typeof value !== 'number') return true;
    return value <= maxValue;
  },
  message: message ?? `Valor máximo: ${maxValue}`,
});
