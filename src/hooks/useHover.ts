import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

/**
 * Hook para bloquear scroll do body
 */
export function useLockScroll(locked: boolean = false): void {
  useEffect(() => {
    if (!locked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '';
    };
  }, [locked]);
}

/**
 * Hook para bloquear scroll com controle manual
 */
export function useScrollLock() {
  const [isLocked, setIsLocked] = useState(false);

  useLockScroll(isLocked);

  const lock = useCallback(() => setIsLocked(true), []);
  const unlock = useCallback(() => setIsLocked(false), []);
  const toggle = useCallback(() => setIsLocked((prev) => !prev), []);

  return { isLocked, lock, unlock, toggle };
}

/**
 * Hook para detectar hover em elemento
 */
export function useHover<T extends HTMLElement = HTMLElement>(): [
  RefObject<T>,
  boolean
] {
  const ref = useRef<T>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return [ref, isHovered];
}

/**
 * Hook para hover com delay
 */
export function useHoverDelay<T extends HTMLElement = HTMLElement>(
  delayEnter: number = 0,
  delayLeave: number = 0
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isHovered, setIsHovered] = useState(false);
  const enterTimeout = useRef<NodeJS.Timeout>();
  const leaveTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      clearTimeout(leaveTimeout.current);
      enterTimeout.current = setTimeout(() => setIsHovered(true), delayEnter);
    };

    const handleMouseLeave = () => {
      clearTimeout(enterTimeout.current);
      leaveTimeout.current = setTimeout(() => setIsHovered(false), delayLeave);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(enterTimeout.current);
      clearTimeout(leaveTimeout.current);
    };
  }, [delayEnter, delayLeave]);

  return [ref, isHovered];
}

/**
 * Hook para detectar focus em elemento
 */
export function useFocus<T extends HTMLElement = HTMLElement>(): [
  RefObject<T>,
  boolean
] {
  const ref = useRef<T>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return [ref, isFocused];
}

/**
 * Hook para detectar hover/focus combinado
 */
export function useHoverOrFocus<T extends HTMLElement = HTMLElement>(): [
  RefObject<T>,
  boolean,
  { isHovered: boolean; isFocused: boolean }
] {
  const ref = useRef<T>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return [ref, isHovered || isFocused, { isHovered, isFocused }];
}

/**
 * Hook para detectar scroll lock do modal/dialog
 */
export function useModalScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.paddingRight = originalStyle.paddingRight;
    };
  }, [isOpen]);
}

export default useHover;
