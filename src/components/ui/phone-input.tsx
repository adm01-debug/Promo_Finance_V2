import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { Phone, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  mask: string;
  flag: string;
}

const countries: Country[] = [
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

function applyMask(value: string, mask: string): string {
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

function removeMask(value: string): string {
  return value.replace(/\D/g, '');
}

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string, formattedValue: string, country: Country) => void;
  defaultCountry?: string;
  showCountrySelect?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = '',
      onChange,
      defaultCountry = 'BR',
      showCountrySelect = true,
      placeholder,
      disabled = false,
      error = false,
      helperText,
      size = 'md',
      className,
      onBlur,
      onFocus,
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(
      countries.find((c) => c.code === defaultCountry) || countries[0]
    );
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value) {
        for (const country of countries) {
          if (value.startsWith(country.dialCode)) {
            const phoneNumber = value.slice(country.dialCode.length);
            setSelectedCountry(country);
            setInputValue(applyMask(phoneNumber, country.mask));
            return;
          }
        }
        setInputValue(applyMask(value, selectedCountry.mask));
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsCountryOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = removeMask(e.target.value);
        const maskedValue = applyMask(rawValue, selectedCountry.mask);
        setInputValue(maskedValue);
        const fullNumber = `${selectedCountry.dialCode}${rawValue}`;
        onChange?.(rawValue, fullNumber, selectedCountry);
      },
      [selectedCountry, onChange]
    );

    const handleCountryChange = useCallback(
      (country: Country) => {
        setSelectedCountry(country);
        setIsCountryOpen(false);
        const rawValue = removeMask(inputValue);
        const maskedValue = applyMask(rawValue, country.mask);
        setInputValue(maskedValue);
        const fullNumber = `${country.dialCode}${rawValue}`;
        onChange?.(rawValue, fullNumber, country);
        inputRef.current?.focus();
      },
      [inputValue, onChange]
    );

    const handleClear = useCallback(() => {
      setInputValue('');
      onChange?.('', '', selectedCountry);
      inputRef.current?.focus();
    }, [selectedCountry, onChange]);

    const sizeStyles = {
      sm: { input: 'h-8 text-sm', button: 'h-8 text-sm px-2', icon: 'w-4 h-4' },
      md: { input: 'h-10 text-sm', button: 'h-10 text-sm px-3', icon: 'w-5 h-5' },
      lg: { input: 'h-12 text-base', button: 'h-12 text-base px-4', icon: 'w-6 h-6' },
    };

    const styles = sizeStyles[size];

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div
          className={cn(
            'flex rounded-lg border transition-colors',
            isFocused && !error
              ? 'border-primary ring-1 ring-primary'
              : error
              ? 'border-destructive'
              : 'border-input',
            disabled && 'opacity-50 cursor-not-allowed bg-muted'
          )}
        >
          {showCountrySelect && (
            <button
              type="button"
              onClick={() => !disabled && setIsCountryOpen(!isCountryOpen)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 border-r border-input',
                'bg-muted rounded-l-lg',
                'hover:bg-accent transition-colors',
                disabled && 'cursor-not-allowed',
                styles.button
              )}
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-muted-foreground">
                {selectedCountry.dialCode}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  isCountryOpen && 'rotate-180'
                )}
              />
            </button>
          )}

          {!showCountrySelect && (
            <div className="flex items-center pl-3">
              <Phone className={cn('text-muted-foreground', styles.icon)} />
            </div>
          )}

          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type="tel"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={placeholder || selectedCountry.mask.replace(/#/g, '0')}
            disabled={disabled}
            className={cn(
              'flex-1 bg-transparent border-none outline-none px-3',
              'placeholder:text-muted-foreground',
              styles.input
            )}
          />

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCountryOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-popover rounded-lg shadow-lg border border-border py-1 z-50 max-h-60 overflow-y-auto">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountryChange(country)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                  country.code === selectedCountry.code
                    ? 'bg-primary/10'
                    : 'hover:bg-accent'
                )}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-foreground">
                  {country.name}
                </span>
                <span className="text-sm text-muted-foreground">{country.dialCode}</span>
              </button>
            ))}
          </div>
        )}

        {helperText && (
          <p
            className={cn(
              'mt-1 text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

interface BrazilPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function BrazilPhoneInput({
  value = '',
  onChange,
  placeholder = '(00) 00000-0000',
  disabled,
  error,
  className,
}: BrazilPhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, '(##) #####-####');
    onChange?.(masked);
  };

  return (
    <div className={cn('relative', className)}>
      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        type="tel"
        value={applyMask(value, '(##) #####-####')}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full pl-10 pr-4 py-2 border rounded-lg',
          'bg-background',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          error
            ? 'border-destructive'
            : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  );
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

export type { Country };
export { countries, applyMask, removeMask };
export default PhoneInput;
