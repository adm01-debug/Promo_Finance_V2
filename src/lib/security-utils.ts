// ============================================
// SECURITY UTILITIES: Ferramentas de segurança
// Sanitização, validação e proteções
// ============================================

// ============================================
// SANITIZAÇÃO DE INPUT
// ============================================

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Remove tags HTML de uma string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitiza string para uso seguro
 */
export function sanitizeString(str: string): string {
  return stripHtml(escapeHtml(str.trim()));
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// ============================================
// VALIDAÇÃO DE ENTRADA
// ============================================

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Valida CEP
 */
export function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

/**
 * Valida URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida força da senha
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: 'muito_fraca' | 'fraca' | 'razoavel' | 'forte' | 'muito_forte';
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Mínimo 8 caracteres');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Use letras maiúsculas e minúsculas');

  if (/\d/.test(password)) score++;
  else feedback.push('Inclua números');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Inclua caracteres especiais');

  // Penalidades
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Evite caracteres repetidos');
  }

  if (/^[0-9]+$/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Não use apenas números');
  }

  const labels: PasswordStrength['label'][] = [
    'muito_fraca',
    'fraca',
    'razoavel',
    'forte',
    'muito_forte',
  ];

  return {
    score: Math.min(4, Math.max(0, score)),
    label: labels[Math.min(4, Math.max(0, score))],
    feedback,
  };
}

// ============================================
// CSRF PROTECTION
// ============================================

/**
 * Gera token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Armazena token CSRF
 */
export function storeCSRFToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Recupera token CSRF
 */
export function getCSRFToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken === token && token.length === 64;
}

// ============================================
// RATE LIMITING (CLIENT-SIDE)
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Verifica rate limit
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Reset rate limit
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================
// ENCRYPTION HELPERS
// ============================================

/**
 * Gera hash SHA-256
 */
export async function hashSHA256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera random bytes
 */
export function generateRandomBytes(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// ============================================
// SECURE STORAGE
// ============================================

const STORAGE_PREFIX = 'secure_';

/**
 * Armazena dado de forma segura (com prefixo)
 */
export function secureStore(key: string, value: string): void {
  const prefixedKey = `${STORAGE_PREFIX}${key}`;
  try {
    // Em produção, considere criptografia adicional
    localStorage.setItem(prefixedKey, btoa(value));
  } catch (error) {
    console.error('Erro ao armazenar dado seguro:', error);
  }
}

/**
 * Recupera dado seguro
 */
export function secureRetrieve(key: string): string | null {
  const prefixedKey = `${STORAGE_PREFIX}${key}`;
  try {
    const value = localStorage.getItem(prefixedKey);
    return value ? atob(value) : null;
  } catch (error) {
    console.error('Erro ao recuperar dado seguro:', error);
    return null;
  }
}

/**
 * Remove dado seguro
 */
export function secureRemove(key: string): void {
  const prefixedKey = `${STORAGE_PREFIX}${key}`;
  localStorage.removeItem(prefixedKey);
}

/**
 * Limpa todos os dados seguros
 */
export function secureClearAll(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// ============================================
// CONTENT SECURITY
// ============================================

/**
 * Valida e sanitiza URL para navegação segura
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Verifica se URL é externa
 */
export function isExternalURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Gera atributos seguros para links externos
 */
export function getSecureLinkAttrs(url: string): Record<string, string> {
  if (isExternalURL(url)) {
    return {
      rel: 'noopener noreferrer',
      target: '_blank',
    };
  }
  return {};
}

// ============================================
// HOOKS
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook para CSRF token
 */
export function useCSRFToken(): { token: string; refresh: () => void } {
  const [token, setToken] = useState<string>('');

  const refresh = useCallback(() => {
    const newToken = generateCSRFToken();
    storeCSRFToken(newToken);
    setToken(newToken);
  }, []);

  useEffect(() => {
    const existingToken = getCSRFToken();
    if (existingToken) {
      setToken(existingToken);
    } else {
      refresh();
    }
  }, [refresh]);

  return { token, refresh };
}

/**
 * Hook para rate limiting
 */
export function useRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): {
  check: () => boolean;
  remaining: number;
  resetIn: number;
  reset: () => void;
} {
  const [state, setState] = useState({ remaining: maxRequests, resetIn: 0 });

  const check = useCallback(() => {
    const result = checkRateLimit(key, maxRequests, windowMs);
    setState({ remaining: result.remaining, resetIn: result.resetIn });
    return result.allowed;
  }, [key, maxRequests, windowMs]);

  const reset = useCallback(() => {
    resetRateLimit(key);
    setState({ remaining: maxRequests, resetIn: 0 });
  }, [key, maxRequests]);

  return { check, ...state, reset };
}

/**
 * Hook para validação de força de senha
 */
export function usePasswordStrength(password: string): PasswordStrength {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'muito_fraca',
    feedback: [],
  });

  useEffect(() => {
    if (password) {
      setStrength(checkPasswordStrength(password));
    } else {
      setStrength({ score: 0, label: 'muito_fraca', feedback: [] });
    }
  }, [password]);

  return strength;
}

/**
 * Hook para detecção de inatividade
 */
export function useIdleTimeout(
  timeoutMs: number,
  onIdle: () => void
): { isIdle: boolean; resetTimer: () => void } {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, timeoutMs);
  }, [timeoutMs, onIdle]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  return { isIdle, resetTimer };
}

/**
 * Hook para sanitização de formulário
 */
export function useSanitizedForm<T extends Record<string, unknown>>(
  initialValues: T
): {
  values: T;
  setValues: (values: T) => void;
  sanitizedValues: T;
} {
  const [values, setValues] = useState<T>(initialValues);
  const sanitizedValues = sanitizeObject(values);

  return { values, setValues, sanitizedValues };
}
