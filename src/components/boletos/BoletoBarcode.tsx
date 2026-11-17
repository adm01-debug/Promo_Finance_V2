/**
 * Codigo de barras e linha digitavel DO PROVEDOR. Nao gera nada.
 *
 * A versao anterior fabricava os dois a partir de banco + valor + vencimento +
 * numero, exibia como "Dados do Boleto (FEBRABAN)" com botao de copiar, e era
 * renderizada ao lado da linha real do ASAAS (BoletoPreviewPanel.tsx:113). O
 * resultado era um instrumento de pagamento falso que o PROPRIO parser do
 * projeto rejeita (achado F10, P0, da auditoria de 2026-09-10):
 *
 * - `calcularFatorVencimento` fazia `padStart(4,'0')` sem truncar, e o fator de
 *   vencimento FEBRABAN passou de 9999 em fev/2025: qualquer vencimento futuro
 *   gerava 45 digitos. Medido: 2024-12-10 -> 44; 2025-02-21 -> 44;
 *   2026-12-10 -> 45. `parseBoleto` responde
 *   "Codigo invalido: esperado 44, 47 ou 48 digitos, recebido 45".
 * - a linha digitavel saia com 44 digitos onde o padrao pede 47 (sem os DVs de
 *   campo), entao `parseBoleto` a tratava como codigo de barras e reprovava no
 *   digito verificador -- invalida em TODOS os casos, inclusive antes de 2025.
 *
 * Quem emite boleto aqui e o ASAAS (useBoletos.ts:120-124 exige provedor
 * homologado e useBoletos.helpers.ts:24-33 aborta se o provedor nao devolver os
 * campos). Entao a tela mostra o que o provedor devolveu, ou diz que nao tem --
 * nunca um numero proprio com cara de FEBRABAN.
 */
import { useState } from 'react';
import { Barcode, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BoletoBarcodeProps {
  /** `boletos.codigo_barras`, como o provedor devolveu. */
  codigoBarras?: string | null;
  /** `boletos.linha_digitavel`, como o provedor devolveu. */
  linhaDigitavel?: string | null;
}

/** Só dígitos, para medir o tamanho do que o provedor mandou. */
const digitos = (v: string) => v.replace(/\D/g, '');

export function BoletoBarcode({ codigoBarras, linhaDigitavel }: BoletoBarcodeProps) {
  const [copied, setCopied] = useState<'barras' | 'linha' | null>(null);

  const cb = (codigoBarras ?? '').trim();
  const ld = (linhaDigitavel ?? '').trim();
  const temAlgum = cb.length > 0 || ld.length > 0;

  const handleCopy = async (text: string, type: 'barras' | 'linha') => {
    await navigator.clipboard.writeText(digitos(text));
    setCopied(type);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!temAlgum) {
    return (
      <div className="space-y-2 p-4 rounded-lg border bg-muted/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold">Código de barras não disponível</span>
        </div>
        <p className="text-xs text-muted-foreground">
          O provedor não devolveu código de barras nem linha digitável para este boleto. Nenhum
          número é gerado aqui: um código próprio não é aceito pelo banco.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
      <div className="flex items-center gap-2">
        <Barcode className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Dados do boleto</span>
        <Badge variant="outline" className="text-xs">
          Do provedor
        </Badge>
      </div>

      <div className="space-y-2">
        {cb ? (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {`Código de barras (${digitos(cb).length} dígitos)`}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-background p-2 rounded border break-all">
                {cb}
              </code>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Copiar código de barras"
                onClick={() => handleCopy(cb, 'barras')}
              >
                {copied === 'barras' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {ld ? (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Linha digitável</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-background p-2 rounded border break-all">
                {ld}
              </code>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Copiar linha digitável"
                onClick={() => handleCopy(ld, 'linha')}
              >
                {copied === 'linha' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Representação visual: desenhada a partir do código REAL, quando existe. */}
      {cb ? (
        <div className="h-12 flex items-end gap-px overflow-hidden" aria-hidden="true">
          {digitos(cb)
            .split('')
            .map((digit, i) => (
              <div
                key={i}
                className="bg-foreground"
                style={{
                  width: parseInt(digit) % 2 === 0 ? '1px' : '2px',
                  height: `${30 + parseInt(digit) * 3}%`,
                }}
              />
            ))}
        </div>
      ) : null}
    </div>
  );
}
