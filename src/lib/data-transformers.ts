// ============================================
// DATA TRANSFORMERS: Transformação de dados
// Parsers, formatters e conversores
// ============================================

// ============================================
// TIPOS
// ============================================

export type TransformFn<TInput, TOutput> = (input: TInput) => TOutput;

export interface TransformPipeline<TInput, TOutput> {
  add: <T>(transform: TransformFn<TOutput, T>) => TransformPipeline<TInput, T>;
  execute: (input: TInput) => TOutput;
}

// ============================================
// PIPELINE DE TRANSFORMAÇÃO
// ============================================

/**
 * Cria um pipeline de transformação
 */
export function createPipeline<TInput, TOutput>(
  initialTransform: TransformFn<TInput, TOutput>
): TransformPipeline<TInput, TOutput> {
  const transforms: TransformFn<unknown, unknown>[] = [initialTransform as TransformFn<unknown, unknown>];

  return {
    add<T>(transform: TransformFn<TOutput, T>): TransformPipeline<TInput, T> {
      transforms.push(transform as TransformFn<unknown, unknown>);
      return this as unknown as TransformPipeline<TInput, T>;
    },
    execute(input: TInput): TOutput {
      return transforms.reduce((acc, transform) => transform(acc), input as unknown) as TOutput;
    },
  };
}

// ============================================
// TRANSFORMADORES DE STRING
// ============================================

export const stringTransformers = {
  /**
   * Remove espaços extras
   */
  trim: (str: string): string => str.trim(),

  /**
   * Remove espaços duplicados
   */
  normalizeSpaces: (str: string): string => str.replace(/\s+/g, ' ').trim(),

  /**
   * Capitaliza primeira letra
   */
  capitalize: (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),

  /**
   * Capitaliza cada palavra
   */
  titleCase: (str: string): string =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()),

  /**
   * Para uppercase
   */
  toUpperCase: (str: string): string => str.toUpperCase(),

  /**
   * Para lowercase
   */
  toLowerCase: (str: string): string => str.toLowerCase(),

  /**
   * Para camelCase
   */
  toCamelCase: (str: string): string =>
    str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, (chr) => chr.toLowerCase()),

  /**
   * Para snake_case
   */
  toSnakeCase: (str: string): string =>
    str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/\s+/g, '_')
      .replace(/-/g, '_'),

  /**
   * Para kebab-case
   */
  toKebabCase: (str: string): string =>
    str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/\s+/g, '-')
      .replace(/_/g, '-'),

  /**
   * Para PascalCase
   */
  toPascalCase: (str: string): string => {
    const camel = stringTransformers.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  },

  /**
   * Remove acentos
   */
  removeAccents: (str: string): string =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),

  /**
   * Slug-ifica
   */
  slugify: (str: string): string =>
    stringTransformers.removeAccents(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),

  /**
   * Trunca com ellipsis
   */
  truncate: (str: string, maxLength: number): string =>
    str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str,

  /**
   * Remove caracteres especiais
   */
  removeSpecialChars: (str: string): string =>
    str.replace(/[^a-zA-Z0-9\s]/g, ''),

  /**
   * Apenas números
   */
  numbersOnly: (str: string): string => str.replace(/\D/g, ''),

  /**
   * Apenas letras
   */
  lettersOnly: (str: string): string => str.replace(/[^a-zA-Z]/g, ''),

  /**
   * Mascara string
   */
  mask: (str: string, pattern: string, placeholder = '#'): string => {
    let result = '';
    let strIndex = 0;

    for (const char of pattern) {
      if (strIndex >= str.length) break;

      if (char === placeholder) {
        result += str[strIndex];
        strIndex++;
      } else {
        result += char;
      }
    }

    return result;
  },
};

// ============================================
// TRANSFORMADORES DE NÚMERO
// ============================================

export const numberTransformers = {
  /**
   * Arredonda para N casas decimais
   */
  round: (num: number, decimals = 2): number =>
    Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),

  /**
   * Arredonda para baixo
   */
  floor: (num: number, decimals = 0): number =>
    Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals),

  /**
   * Arredonda para cima
   */
  ceil: (num: number, decimals = 0): number =>
    Math.ceil(num * Math.pow(10, decimals)) / Math.pow(10, decimals),

  /**
   * Clamp entre min e max
   */
  clamp: (num: number, min: number, max: number): number =>
    Math.min(Math.max(num, min), max),

  /**
   * Porcentagem
   */
  toPercent: (num: number, decimals = 2): number =>
    numberTransformers.round(num * 100, decimals),

  /**
   * De porcentagem
   */
  fromPercent: (num: number): number => num / 100,

  /**
   * Valor absoluto
   */
  abs: (num: number): number => Math.abs(num),

  /**
   * Negativo
   */
  negate: (num: number): number => -num,

  /**
   * Normaliza entre 0 e 1
   */
  normalize: (num: number, min: number, max: number): number =>
    (num - min) / (max - min),

  /**
   * Denormaliza de 0-1 para range
   */
  denormalize: (num: number, min: number, max: number): number =>
    num * (max - min) + min,

  /**
   * Converte para inteiro
   */
  toInt: (num: number): number => Math.trunc(num),

  /**
   * Garante número positivo
   */
  positive: (num: number): number => Math.max(0, num),

  /**
   * Parse de string para número
   */
  parse: (str: string): number => {
    const cleaned = str.replace(/[^\d.,\-]/g, '');
    // Trata formato brasileiro (1.234,56) e americano (1,234.56)
    const hasCommaDecimal = /,\d{1,2}$/.test(cleaned);
    if (hasCommaDecimal) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    return parseFloat(cleaned.replace(/,/g, ''));
  },
};

// ============================================
// TRANSFORMADORES DE DATA
// ============================================

export const dateTransformers = {
  /**
   * Para Date object
   */
  toDate: (input: string | number | Date): Date => new Date(input),

  /**
   * Para ISO string
   */
  toISO: (date: Date): string => date.toISOString(),

  /**
   * Para timestamp
   */
  toTimestamp: (date: Date): number => date.getTime(),

  /**
   * Para string local
   */
  toLocalString: (date: Date, locale = 'pt-BR'): string =>
    date.toLocaleDateString(locale),

  /**
   * Início do dia
   */
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Fim do dia
   */
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  /**
   * Início do mês
   */
  startOfMonth: (date: Date): Date => {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Fim do mês
   */
  endOfMonth: (date: Date): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  /**
   * Adiciona dias
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Adiciona meses
   */
  addMonths: (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  /**
   * Adiciona anos
   */
  addYears: (date: Date, years: number): Date => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  },

  /**
   * Diferença em dias
   */
  diffInDays: (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Para formato brasileiro
   */
  toBrazilian: (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Parse formato brasileiro
   */
  fromBrazilian: (str: string): Date => {
    const [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day);
  },
};

// ============================================
// TRANSFORMADORES DE ARRAY
// ============================================

export const arrayTransformers = {
  /**
   * Remove duplicatas
   */
  unique: <T>(arr: T[]): T[] => [...new Set(arr)],

  /**
   * Remove duplicatas por chave
   */
  uniqueBy: <T>(arr: T[], key: keyof T): T[] => {
    const seen = new Set();
    return arr.filter((item) => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  /**
   * Flatten array
   */
  flatten: <T>(arr: T[][]): T[] => arr.flat(),

  /**
   * Deep flatten
   */
  deepFlatten: <T>(arr: unknown[]): T[] =>
    arr.reduce<T[]>((acc, val) =>
      acc.concat(Array.isArray(val) ? arrayTransformers.deepFlatten<T>(val) : (val as T)),
      []
    ),

  /**
   * Agrupa por chave
   */
  groupBy: <T>(arr: T[], key: keyof T): Record<string, T[]> =>
    arr.reduce((acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>),

  /**
   * Ordena por chave
   */
  sortBy: <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] =>
    [...arr].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return order === 'asc' ? comparison : -comparison;
    }),

  /**
   * Pagina array
   */
  paginate: <T>(arr: T[], page: number, pageSize: number): T[] => {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  },

  /**
   * Chunk array
   */
  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Shuffle array
   */
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * Remove valores falsy
   */
  compact: <T>(arr: (T | null | undefined | false | 0 | '')[]): T[] =>
    arr.filter(Boolean) as T[],

  /**
   * Pega primeiro N
   */
  take: <T>(arr: T[], n: number): T[] => arr.slice(0, n),

  /**
   * Pega último N
   */
  takeLast: <T>(arr: T[], n: number): T[] => arr.slice(-n),

  /**
   * Remove primeiro N
   */
  drop: <T>(arr: T[], n: number): T[] => arr.slice(n),

  /**
   * Remove último N
   */
  dropLast: <T>(arr: T[], n: number): T[] => arr.slice(0, -n),

  /**
   * Intercala dois arrays
   */
  zip: <T, U>(arr1: T[], arr2: U[]): [T, U][] =>
    arr1.map((item, i) => [item, arr2[i]]),

  /**
   * Array para objeto
   */
  toObject: <T>(arr: T[], key: keyof T): Record<string, T> =>
    arr.reduce((acc, item) => {
      acc[String(item[key])] = item;
      return acc;
    }, {} as Record<string, T>),
};

// ============================================
// TRANSFORMADORES DE OBJETO
// ============================================

export const objectTransformers = {
  /**
   * Pega apenas algumas chaves
   */
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> =>
    keys.reduce((acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    }, {} as Pick<T, K>),

  /**
   * Omite algumas chaves
   */
  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
  },

  /**
   * Renomeia chaves
   */
  renameKeys: <T extends object>(
    obj: T,
    keyMap: Record<string, string>
  ): Record<string, unknown> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = keyMap[key] || key;
      acc[newKey] = value;
      return acc;
    }, {} as Record<string, unknown>);
  },

  /**
   * Transforma valores
   */
  mapValues: <T extends object, U>(
    obj: T,
    transform: (value: T[keyof T], key: keyof T) => U
  ): Record<keyof T, U> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[key as keyof T] = transform(value as T[keyof T], key as keyof T);
      return acc;
    }, {} as Record<keyof T, U>);
  },

  /**
   * Filtra por valores
   */
  filterValues: <T extends object>(
    obj: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean
  ): Partial<T> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (predicate(value as T[keyof T], key as keyof T)) {
        (acc as Record<string, unknown>)[key] = value;
      }
      return acc;
    }, {} as Partial<T>);
  },

  /**
   * Flatten object
   */
  flatten: (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(acc, objectTransformers.flatten(value as Record<string, unknown>, newKey));
      } else {
        acc[newKey] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  },

  /**
   * Unflatten object
   */
  unflatten: (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const parts = key.split('.');
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] = value;
    }

    return result;
  },

  /**
   * Deep merge
   */
  deepMerge: <T extends object>(...objects: Partial<T>[]): T => {
    const result = objects.reduce<Record<string, unknown>>((acc, obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        const existing = acc[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value) &&
            typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
          acc[key] = objectTransformers.deepMerge(
            existing as object,
            value as object
          );
        } else {
          acc[key] = value;
        }
      });
      return acc;
    }, {} as Record<string, unknown>);
    return result as T;
  },

  /**
   * Deep clone
   */
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),

  /**
   * Remove valores undefined/null
   */
  compact: <T extends object>(obj: T): Partial<T> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        (acc as Record<string, unknown>)[key] = value;
      }
      return acc;
    }, {} as Partial<T>);
  },
};

// ============================================
// TRANSFORMADORES BRASILEIROS
// ============================================

export const brazilianTransformers = {
  /**
   * Formata CPF
   */
  formatCPF: (cpf: string): string => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  /**
   * Formata CNPJ
   */
  formatCNPJ: (cnpj: string): string => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },

  /**
   * Formata CEP
   */
  formatCEP: (cep: string): string => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  /**
   * Formata telefone
   */
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  },

  /**
   * Formata valor monetário
   */
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  /**
   * Parse valor monetário
   */
  parseCurrency: (str: string): number => {
    const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned);
  },

  /**
   * Limpa documento (CPF/CNPJ)
   */
  cleanDocument: (doc: string): string => doc.replace(/\D/g, ''),

  /**
   * Detecta tipo de documento
   */
  getDocumentType: (doc: string): 'cpf' | 'cnpj' | 'unknown' => {
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) return 'cpf';
    if (cleaned.length === 14) return 'cnpj';
    return 'unknown';
  },

  /**
   * Formata documento automaticamente
   */
  formatDocument: (doc: string): string => {
    const type = brazilianTransformers.getDocumentType(doc);
    if (type === 'cpf') return brazilianTransformers.formatCPF(doc);
    if (type === 'cnpj') return brazilianTransformers.formatCNPJ(doc);
    return doc;
  },
};
