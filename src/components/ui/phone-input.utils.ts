export interface Country {
  code: string;
  name: string;
  dialCode: string;
  mask: string;
  flag: string;
}

export const countries: Country[] = [
  { code: 'BR', name: 'Brasil', dialCode: '+55', mask: '(##) #####-####', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', mask: '(###) ###-####', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', mask: '### ### ###', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', dialCode: '+34', mask: '### ## ## ##', flag: '🇪🇸' },
  { code: 'FR', name: 'França', dialCode: '+33', mask: '# ## ## ## ##', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', dialCode: '+49', mask: '#### #######', flag: '🇩🇪' },
  { code: 'IT', name: 'Itália', dialCode: '+39', mask: '### ### ####', flag: '🇮🇹' },
  { code: 'UK', name: 'Reino Unido', dialCode: '+44', mask: '#### ### ####', flag: '🇬🇧' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', mask: '## ####-####', flag: '🇦🇷' },
  { code: 'MX', name: 'México', dialCode: '+52', mask: '## #### ####', flag: '🇲🇽' },
];

export function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, '');
  let result = '';
  let digitIndex = 0;
  for (const char of mask) {
    if (digitIndex >= digits.length) break;
    if (char === '#') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

export function removeMask(value: string): string {
  return value.replace(/\D/g, '');
}

export function validatePhone(phone: string, countryCode: string = 'BR'): boolean {
  const digits = phone.replace(/\D/g, '');
  const validations: Record<string, (d: string) => boolean> = {
    BR: (d) => d.length === 10 || d.length === 11,
    US: (d) => d.length === 10,
    PT: (d) => d.length === 9,
    ES: (d) => d.length === 9,
    FR: (d) => d.length === 9,
    DE: (d) => d.length >= 10 && d.length <= 11,
    IT: (d) => d.length === 10,
    UK: (d) => d.length >= 10 && d.length <= 11,
    AR: (d) => d.length === 10,
    MX: (d) => d.length === 10,
  };
  return validations[countryCode]?.(digits) ?? digits.length >= 8;
}

export function formatPhone(phone: string, countryCode: string = 'BR'): string {
  const country = countries.find((c) => c.code === countryCode);
  if (!country) return phone;
  const digits = phone.replace(/\D/g, '');
  return `${country.dialCode} ${applyMask(digits, country.mask)}`;
}