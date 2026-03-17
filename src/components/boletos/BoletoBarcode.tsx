import { useMemo } from 'react';
import { Barcode, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';

interface BoletoBarcodeProps {
  banco: string;
  valor: number;
  vencimento: string;
  cedenteCnpj?: string;
  numero: string;
}

function gerarCodigoBarras(banco: string, valor: number, vencimento: string, numero: string): string {
  // Simplified FEBRABAN barcode generation
  const codigoBanco = banco.padStart(3, '0').substring(0, 3);
  const moeda = '9'; // Real
  const fatorVencimento = calcularFatorVencimento(vencimento);
  const valorFormatado = Math.round(valor * 100).toString().padStart(10, '0');
  const campoLivre = numero.replace(/\D/g, '').padStart(25, '0').substring(0, 25);
  
  const semDV = codigoBanco + moeda + fatorVencimento + valorFormatado + campoLivre;
  const dv = calcularDV(semDV);
  
  return codigoBanco + moeda + dv + fatorVencimento + valorFormatado + campoLivre;
}

function calcularFatorVencimento(vencimento: string): string {
  const base = new Date('1997-10-07');
  const venc = new Date(vencimento);
  const diff = Math.floor((venc.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0).toString().padStart(4, '0');
}

function calcularDV(codigo: string): string {
  const pesos = [2,3,4,5,6,7,8,9];
  let soma = 0;
  const digits = codigo.split('').reverse();
  for (let i = 0; i < digits.length; i++) {
    soma += parseInt(digits[i]) * pesos[i % pesos.length];
  }
  const resto = soma % 11;
  const dv = 11 - resto;
  if (dv === 0 || dv === 10 || dv === 11) return '1';
  return dv.toString();
}

function gerarLinhaDigitavel(codigoBarras: string): string {
  if (codigoBarras.length < 44) return codigoBarras;
  // Simplified conversion
  const campo1 = codigoBarras.substring(0, 4) + codigoBarras.substring(19, 24);
  const campo2 = codigoBarras.substring(24, 34);
  const campo3 = codigoBarras.substring(34, 44);
  const campo4 = codigoBarras.substring(4, 5);
  const campo5 = codigoBarras.substring(5, 19);
  
  return `${campo1.substring(0,5)}.${campo1.substring(5)} ${campo2.substring(0,5)}.${campo2.substring(5)} ${campo3.substring(0,5)}.${campo3.substring(5)} ${campo4} ${campo5}`;
}

export function BoletoBarcode({ banco, valor, vencimento, cedenteCnpj, numero }: BoletoBarcodeProps) {
  const [copied, setCopied] = useState<'barras' | 'linha' | null>(null);

  const { codigoBarras, linhaDigitavel } = useMemo(() => {
    const cb = gerarCodigoBarras(banco, valor, vencimento, numero);
    const ld = gerarLinhaDigitavel(cb);
    return { codigoBarras: cb, linhaDigitavel: ld };
  }, [banco, valor, vencimento, numero]);

  const handleCopy = async (text: string, type: 'barras' | 'linha') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
      <div className="flex items-center gap-2">
        <Barcode className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Dados do Boleto (FEBRABAN)</span>
        <Badge variant="outline" className="text-xs">Auto-gerado</Badge>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Código de Barras (44 dígitos)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background p-2 rounded border break-all">{codigoBarras}</code>
            <Button size="icon" variant="ghost" onClick={() => handleCopy(codigoBarras, 'barras')}>
              {copied === 'barras' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Linha Digitável</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background p-2 rounded border break-all">{linhaDigitavel}</code>
            <Button size="icon" variant="ghost" onClick={() => handleCopy(linhaDigitavel, 'linha')}>
              {copied === 'linha' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Visual barcode representation */}
      <div className="h-12 flex items-end gap-px overflow-hidden">
        {codigoBarras.split('').map((digit, i) => (
          <div
            key={i}
            className="bg-foreground"
            style={{
              width: parseInt(digit) % 2 === 0 ? '1px' : '2px',
              height: `${30 + (parseInt(digit) * 3)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
