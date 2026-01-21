import { forwardRef, useState, useCallback, ChangeEvent, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type MaskType = 'cpf' | 'cnpj' | 'cpfCnpj' | 'phone' | 'cep' | 'date' | 'creditCard' | 'custom';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  customMask?: string; // Para mask='custom', ex: '999.999.999-99'
  value?: string;
  onChange?: (value: string, rawValue: string) => void;
  error?: boolean;
}

/**
 * Máscaras predefinidas
 * 9 = dígito
 * A = letra
 * S = alfanumérico
 */
const MASKS: Record<Exclude<MaskType, 'custom' | 'cpfCnpj'>, string> = {
  cpf: '999.999.999-99',
  cnpj: '99.999.999/9999-99',
  phone: '(99) 99999-9999',
  cep: '99999-999',
  date: '99/99/9999',
  creditCard: '9999 9999 9999 9999',
};

/**
 * Aplica máscara a um valor
 */
function applyMask(value: string, mask: string): string {
  let result = '';
  let valueIndex = 0;

  // Remover formatação existente
  const rawValue = value.replace(/\D/g, '');

  for (let i = 0; i < mask.length && valueIndex < rawValue.length; i++) {
    const maskChar = mask[i];

    if (maskChar === '9') {
      // Dígito
      if (/\d/.test(rawValue[valueIndex])) {
        result += rawValue[valueIndex];
        valueIndex++;
      }
    } else if (maskChar === 'A') {
      // Letra
      if (/[a-zA-Z]/.test(rawValue[valueIndex])) {
        result += rawValue[valueIndex];
        valueIndex++;
      }
    } else if (maskChar === 'S') {
      // Alfanumérico
      result += rawValue[valueIndex];
      valueIndex++;
    } else {
      // Caractere literal (separador)
      result += maskChar;
    }
  }

  return result;
}

/**
 * Remove máscara de um valor
 */
function removeMask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Detecta se é CPF ou CNPJ pelo tamanho
 */
function getCpfCnpjMask(value: string): string {
  const digits = removeMask(value);
  return digits.length <= 11 ? MASKS.cpf : MASKS.cnpj;
}

/**
 * Input com máscara automática
 */
export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, customMask, value = '', onChange, error, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    // Determinar máscara a usar
    const getMask = useCallback(
      (inputValue: string): string => {
        if (mask === 'custom' && customMask) {
          return customMask;
        }
        if (mask === 'cpfCnpj') {
          return getCpfCnpjMask(inputValue);
        }
        return MASKS[mask as keyof typeof MASKS] || '';
      },
      [mask, customMask]
    );

    // Atualizar display quando value mudar externamente
    useEffect(() => {
      const currentMask = getMask(value);
      setDisplayValue(applyMask(value, currentMask));
    }, [value, getMask]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const currentMask = getMask(inputValue);
        const masked = applyMask(inputValue, currentMask);
        const raw = removeMask(inputValue);

        setDisplayValue(masked);
        onChange?.(masked, raw);
      },
      [getMask, onChange]
    );

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={cn(
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

/**
 * Inputs específicos pré-configurados
 */

export const CPFInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      mask="cpf"
      placeholder="000.000.000-00"
      maxLength={14}
      {...props}
    />
  )
);
CPFInput.displayName = 'CPFInput';

export const CNPJInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      mask="cnpj"
      placeholder="00.000.000/0000-00"
      maxLength={18}
      {...props}
    />
  )
);
CNPJInput.displayName = 'CNPJInput';

export const CPFCNPJInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      mask="cpfCnpj"
      placeholder="CPF ou CNPJ"
      maxLength={18}
      {...props}
    />
  )
);
CPFCNPJInput.displayName = 'CPFCNPJInput';

export const PhoneInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      mask="phone"
      placeholder="(00) 00000-0000"
      maxLength={15}
      {...props}
    />
  )
);
PhoneInput.displayName = 'PhoneInput';

export const CEPInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      mask="cep"
      placeholder="00000-000"
      maxLength={9}
      {...props}
    />
  )
);
CEPInput.displayName = 'CEPInput';

export const CreditCardInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      mask="creditCard"
      placeholder="0000 0000 0000 0000"
      maxLength={19}
      {...props}
    />
  )
);
CreditCardInput.displayName = 'CreditCardInput';
