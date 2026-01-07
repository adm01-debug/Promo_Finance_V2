/**
 * Render Props Pattern
 * Componentes flexíveis que delegam renderização ao consumidor
 */

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// ============================================
// TOGGLE RENDER PROPS
// ============================================

interface ToggleRenderProps {
  on: boolean;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
}

interface ToggleProps {
  initialOn?: boolean;
  onToggle?: (on: boolean) => void;
  children: (props: ToggleRenderProps) => ReactNode;
}

export function Toggle({ initialOn = false, onToggle, children }: ToggleProps) {
  const [on, setOnState] = useState(initialOn);

  const toggle = useCallback(() => {
    setOnState(prev => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  const setOn = useCallback(() => {
    setOnState(true);
    onToggle?.(true);
  }, [onToggle]);

  const setOff = useCallback(() => {
    setOnState(false);
    onToggle?.(false);
  }, [onToggle]);

  return <>{children({ on, toggle, setOn, setOff })}</>;
}

// ============================================
// COUNTER RENDER PROPS
// ============================================

interface CounterRenderProps {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
}

interface CounterProps {
  initialCount?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (count: number) => void;
  children: (props: CounterRenderProps) => ReactNode;
}

export function Counter({ 
  initialCount = 0, 
  min = -Infinity,
  max = Infinity,
  step = 1,
  onChange,
  children 
}: CounterProps) {
  const [count, setCountState] = useState(initialCount);

  const setCount = useCallback((value: number) => {
    const clamped = Math.max(min, Math.min(max, value));
    setCountState(clamped);
    onChange?.(clamped);
  }, [min, max, onChange]);

  const increment = useCallback(() => setCount(count + step), [count, step, setCount]);
  const decrement = useCallback(() => setCount(count - step), [count, step, setCount]);
  const reset = useCallback(() => setCount(initialCount), [initialCount, setCount]);

  return <>{children({ count, increment, decrement, reset, setCount })}</>;
}

// ============================================
// HOVER RENDER PROPS
// ============================================

interface HoverRenderProps {
  isHovered: boolean;
  hoverProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

interface HoverProps {
  delay?: number;
  onHoverChange?: (isHovered: boolean) => void;
  children: (props: HoverRenderProps) => ReactNode;
}

export function Hover({ delay = 0, onHoverChange, children }: HoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const onMouseEnter = useCallback(() => {
    if (delay > 0) {
      const id = setTimeout(() => {
        setIsHovered(true);
        onHoverChange?.(true);
      }, delay);
      setTimeoutId(id);
    } else {
      setIsHovered(true);
      onHoverChange?.(true);
    }
  }, [delay, onHoverChange]);

  const onMouseLeave = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsHovered(false);
    onHoverChange?.(false);
  }, [timeoutId, onHoverChange]);

  return <>{children({ isHovered, hoverProps: { onMouseEnter, onMouseLeave } })}</>;
}

// ============================================
// FOCUS RENDER PROPS
// ============================================

interface FocusRenderProps {
  isFocused: boolean;
  focusProps: {
    onFocus: () => void;
    onBlur: () => void;
  };
}

interface FocusProps {
  onFocusChange?: (isFocused: boolean) => void;
  children: (props: FocusRenderProps) => ReactNode;
}

export function Focus({ onFocusChange, children }: FocusProps) {
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(() => {
    setIsFocused(true);
    onFocusChange?.(true);
  }, [onFocusChange]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  return <>{children({ isFocused, focusProps: { onFocus, onBlur } })}</>;
}

// ============================================
// ASYNC RENDER PROPS
// ============================================

interface AsyncRenderProps<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface AsyncProps<T> {
  asyncFn: () => Promise<T>;
  deps?: unknown[];
  children: (props: AsyncRenderProps<T>) => ReactNode;
}

export function Async<T>({ asyncFn, deps = [], children }: AsyncProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  useEffect(() => {
    fetch();
  }, deps);

  return <>{children({ data, loading, error, refetch: fetch })}</>;
}

// ============================================
// LIST RENDER PROPS
// ============================================

interface ListRenderProps<T> {
  items: T[];
  selectedItems: T[];
  toggleItem: (item: T) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (item: T) => boolean;
}

interface ListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onSelectionChange?: (items: T[]) => void;
  children: (props: ListRenderProps<T>) => ReactNode;
}

export function List<T>({ 
  items, 
  keyExtractor, 
  onSelectionChange, 
  children 
}: ListProps<T>) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const selectedItems = items.filter(item => selectedKeys.has(keyExtractor(item)));

  const toggleItem = useCallback((item: T) => {
    const key = keyExtractor(item);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      const newSelected = items.filter(i => next.has(keyExtractor(i)));
      onSelectionChange?.(newSelected);
      return next;
    });
  }, [items, keyExtractor, onSelectionChange]);

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(items.map(keyExtractor)));
    onSelectionChange?.(items);
  }, [items, keyExtractor, onSelectionChange]);

  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const isSelected = useCallback((item: T) => {
    return selectedKeys.has(keyExtractor(item));
  }, [selectedKeys, keyExtractor]);

  return <>{children({ items, selectedItems, toggleItem, selectAll, deselectAll, isSelected })}</>;
}

// ============================================
// PAGINATION RENDER PROPS
// ============================================

interface PaginationRenderProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  pageNumbers: number[];
}

interface PaginationProps {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
  siblingCount?: number;
  onPageChange?: (page: number) => void;
  children: (props: PaginationRenderProps) => ReactNode;
}

export function Pagination({ 
  totalItems, 
  pageSize = 10, 
  initialPage = 1,
  siblingCount = 1,
  onPageChange,
  children 
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.ceil(totalItems / pageSize);

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(clamped);
    onPageChange?.(clamped);
  }, [totalPages, onPageChange]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Generate page numbers
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => start + idx);
  };

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
  const pageNumbers = range(leftSiblingIndex, rightSiblingIndex);

  return <>{children({
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    pageNumbers,
  })}</>;
}

// ============================================
// CAROUSEL RENDER PROPS
// ============================================

interface CarouselRenderProps<T> {
  currentItem: T;
  currentIndex: number;
  items: T[];
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface CarouselProps<T> {
  items: T[];
  loop?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onChange?: (index: number) => void;
  children: (props: CarouselRenderProps<T>) => ReactNode;
}

export function Carousel<T>({ 
  items, 
  loop = false,
  autoPlay = false,
  autoPlayInterval = 3000,
  onChange,
  children 
}: CarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback((index: number) => {
    let newIndex = index;
    if (loop) {
      if (index < 0) newIndex = items.length - 1;
      if (index >= items.length) newIndex = 0;
    } else {
      newIndex = Math.max(0, Math.min(items.length - 1, index));
    }
    setCurrentIndex(newIndex);
    onChange?.(newIndex);
  }, [items.length, loop, onChange]);

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (autoPlay && items.length > 1) {
      const interval = setInterval(next, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, next, items.length]);

  const canGoNext = loop || currentIndex < items.length - 1;
  const canGoPrev = loop || currentIndex > 0;

  return <>{children({
    currentItem: items[currentIndex],
    currentIndex,
    items,
    next,
    prev,
    goTo,
    canGoNext,
    canGoPrev,
  })}</>;
}

// ============================================
// FORM FIELD RENDER PROPS
// ============================================

interface FormFieldRenderProps {
  value: string;
  error: string | null;
  touched: boolean;
  valid: boolean;
  dirty: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  reset: () => void;
  validate: () => boolean;
  inputProps: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
  };
}

interface FormFieldProps {
  initialValue?: string;
  validate?: (value: string) => string | null;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  children: (props: FormFieldRenderProps) => ReactNode;
}

export function FormField({ 
  initialValue = '',
  validate: validateFn,
  validateOnBlur = true,
  validateOnChange = false,
  children 
}: FormFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback(() => {
    if (validateFn) {
      const err = validateFn(value);
      setError(err);
      return !err;
    }
    return true;
  }, [value, validateFn]);

  const onChange = useCallback((newValue: string) => {
    setValue(newValue);
    if (validateOnChange && touched) {
      const err = validateFn?.(newValue) ?? null;
      setError(err);
    }
  }, [validateOnChange, touched, validateFn]);

  const onBlur = useCallback(() => {
    setTouched(true);
    if (validateOnBlur) {
      validate();
    }
  }, [validateOnBlur, validate]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setTouched(false);
  }, [initialValue]);

  const valid = !error;
  const dirty = value !== initialValue;

  const inputProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    onBlur,
  };

  return <>{children({ value, error, touched, valid, dirty, onChange, onBlur, reset, validate, inputProps })}</>;
}

// ============================================
// WIZARD/STEPPER RENDER PROPS
// ============================================

interface WizardRenderProps<T> {
  currentStep: number;
  currentStepData: T;
  steps: T[];
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
  next: () => void;
  prev: () => void;
  goTo: (step: number) => void;
  reset: () => void;
}

interface WizardProps<T> {
  steps: T[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  children: (props: WizardRenderProps<T>) => ReactNode;
}

export function Wizard<T>({ 
  steps, 
  initialStep = 0,
  onStepChange,
  onComplete,
  children 
}: WizardProps<T>) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goTo = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, step));
    setCurrentStep(clamped);
    onStepChange?.(clamped);
  }, [steps.length, onStepChange]);

  const next = useCallback(() => {
    if (currentStep === steps.length - 1) {
      onComplete?.();
    } else {
      goTo(currentStep + 1);
    }
  }, [currentStep, steps.length, goTo, onComplete]);

  const prev = useCallback(() => goTo(currentStep - 1), [currentStep, goTo]);
  const reset = useCallback(() => goTo(0), [goTo]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return <>{children({
    currentStep,
    currentStepData: steps[currentStep],
    steps,
    totalSteps: steps.length,
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
    progress,
    next,
    prev,
    goTo,
    reset,
  })}</>;
}

// ============================================
// DISCLOSURE RENDER PROPS
// ============================================

interface DisclosureRenderProps {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  buttonProps: {
    onClick: () => void;
    'aria-expanded': boolean;
  };
  panelProps: {
    hidden: boolean;
  };
}

interface DisclosureProps {
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children: (props: DisclosureRenderProps) => ReactNode;
}

export function Disclosure({ 
  defaultOpen = false,
  onOpenChange,
  children 
}: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  }, [onOpenChange]);

  return <>{children({
    isOpen,
    open,
    close,
    toggle,
    buttonProps: {
      onClick: toggle,
      'aria-expanded': isOpen,
    },
    panelProps: {
      hidden: !isOpen,
    },
  })}</>;
}
