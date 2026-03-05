import { useState, useCallback, useMemo } from 'react';
import { z, ZodSchema } from 'zod';

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseZodFormOptions<T extends z.ZodRawShape> {
  schema: ZodSchema<z.infer<z.ZodObject<T>>>;
  initialValues?: Partial<z.infer<z.ZodObject<T>>>;
  onSubmit?: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  onError?: (errors: FormErrors<z.infer<z.ZodObject<T>>>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseZodFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setFieldError: (field: keyof T, error: string | undefined) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: FormErrors<T>) => void;
  resetForm: (newValues?: Partial<T>) => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  validateField: (field: keyof T) => string | undefined;
  validateForm: () => boolean;
  getFieldProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    name: string;
  };
  getFieldState: (field: keyof T) => {
    error: string | undefined;
    touched: boolean;
    invalid: boolean;
  };
}

export function useZodForm<T extends z.ZodRawShape>(
  options: UseZodFormOptions<T>
): UseZodFormReturn<z.infer<z.ZodObject<T>>> {
  type FormData = z.infer<z.ZodObject<T>>;
  
  const {
    schema,
    initialValues = {} as Partial<FormData>,
    onSubmit,
    onError,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<FormData>(initialValues as FormData);
  const [errors, setErrors] = useState<FormErrors<FormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const validateField = useCallback(
    (field: keyof FormData): string | undefined => {
      try {
        const fieldSchema = (schema as z.ZodObject<T>).shape[field as string];
        if (fieldSchema) {
          fieldSchema.parse(values[field]);
        }
        return undefined;
      } catch (err) {
        if (err instanceof z.ZodError) {
          return err.errors[0]?.message;
        }
        return 'Erro de validação';
      }
    },
    [schema, values]
  );

  const validateForm = useCallback((): boolean => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: FormErrors<FormData> = {};
    result.error.errors.forEach((err) => {
      const path = err.path[0] as keyof FormData;
      if (!newErrors[path]) {
        newErrors[path] = err.message;
      }
    });
    setErrors(newErrors);
    return false;
  }, [schema, values]);

  const setFieldValue = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      
      if (validateOnChange) {
        const error = validateField(field);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [field]: error };
          }
          const { [field]: _, ...rest } = prev;
          return rest as FormErrors<FormData>;
        });
      }
    },
    [validateOnChange, validateField]
  );

  const setFieldTouched = useCallback(
    (field: keyof FormData, isTouched: boolean = true) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  const setFieldError = useCallback(
    (field: keyof FormData, error: string | undefined) => {
      setErrors((prev) => {
        if (error) {
          return { ...prev, [field]: error };
        }
        const { [field]: _, ...rest } = prev;
        return rest as FormErrors<FormData>;
      });
    },
    []
  );

  const resetForm = useCallback(
    (newValues?: Partial<FormData>) => {
      setValues((newValues || initialValues) as FormData);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  const handleChange = useCallback(
    (field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { type, value } = e.target;
      const newValue = type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? value === '' ? undefined : Number(value)
        : value;
      
      setFieldValue(field, newValue as FormData[typeof field]);
    },
    [setFieldValue]
  );

  const handleBlur = useCallback(
    (field: keyof FormData) => () => {
      setFieldTouched(field);
      
      if (validateOnBlur) {
        const error = validateField(field);
        setFieldError(field, error);
      }
    },
    [setFieldTouched, validateOnBlur, validateField, setFieldError]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      // Touch all fields
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof FormData, boolean>
      );
      setTouched(allTouched);

      if (!validateForm()) {
        onError?.(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit?.(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit, onError, errors]
  );

  const getFieldProps = useCallback(
    (field: keyof FormData) => ({
      value: values[field] as FormData[keyof FormData],
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      name: String(field),
    }),
    [values, handleChange, handleBlur]
  );

  const getFieldState = useCallback(
    (field: keyof FormData) => ({
      error: errors[field],
      touched: touched[field] ?? false,
      invalid: !!errors[field] && (touched[field] ?? false),
    }),
    [errors, touched]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    setValues: ((v: Partial<FormData>) => setValues((prev) => ({ ...prev, ...v }))) as (values: Partial<FormData>) => void,
    setErrors,
    resetForm,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    getFieldProps,
    getFieldState,
  };
}

// Hook simplificado para campos individuais
export function useZodField<T>(
  schema: ZodSchema<T>,
  initialValue?: T
) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validate = useCallback(() => {
    const result = schema.safeParse(value);
    if (result.success) {
      setError(undefined);
      return true;
    }
    setError(result.error.errors[0]?.message);
    return false;
  }, [schema, value]);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    if (touched) {
      const result = schema.safeParse(newValue);
      setError(result.success ? undefined : result.error.errors[0]?.message);
    }
  }, [schema, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  return {
    value,
    error,
    touched,
    setValue: handleChange,
    setTouched,
    setError,
    validate,
    handleBlur,
    isValid: !error,
    isDirty: value !== initialValue,
  };
}

export default useZodForm;
