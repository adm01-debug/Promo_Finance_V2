import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, RefreshCw } from 'lucide-react';

interface AdvancedProps {
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  juros: string;
  setJuros: (v: string) => void;
  multa: string;
  setMulta: (v: string) => void;
  descontoValor: string;
  setDescontoValor: (v: string) => void;
  descontoDias: string;
  setDescontoDias: (v: string) => void;
}

export function ConfiguracoesAvancadas({
  showAdvanced, setShowAdvanced, juros, setJuros, multa, setMulta,
  descontoValor, setDescontoValor, descontoDias, setDescontoDias,
}: AdvancedProps) {
  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground gap-1"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <Settings2 className="h-3.5 w-3.5" />
        {showAdvanced ? 'Ocultar' : 'Mostrar'} configurações avançadas
      </Button>
      {showAdvanced && (
        <div className="mt-3 space-y-3 p-3 rounded-lg border border-border bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Juros ao mês (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={juros}
                onChange={e => setJuros(e.target.value)}
                placeholder="0.00"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Multa por atraso (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={multa}
                onChange={e => setMulta(e.target.value)}
                placeholder="0.00"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Desconto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={descontoValor}
                onChange={e => setDescontoValor(e.target.value)}
                placeholder="0.00"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dias para desconto</Label>
              <Input
                type="number"
                min="0"
                value={descontoDias}
                onChange={e => setDescontoDias(e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SplitProps {
  showSplit: boolean;
  setShowSplit: (v: boolean) => void;
  splitWalletId: string;
  setSplitWalletId: (v: string) => void;
  splitPercent: string;
  setSplitPercent: (v: string) => void;
}

export function SplitCobrancaConfig({
  showSplit, setShowSplit, splitWalletId, setSplitWalletId, splitPercent, setSplitPercent,
}: SplitProps) {
  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground gap-1"
        onClick={() => setShowSplit(!showSplit)}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {showSplit ? 'Remover' : 'Configurar'} Split (Divisão)
      </Button>
      {showSplit && (
        <div className="mt-3 space-y-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Wallet ID Destino</Label>
              <Input
                value={splitWalletId}
                onChange={e => setSplitWalletId(e.target.value)}
                placeholder="Ex: d7a1..."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Percentual (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={splitPercent}
                onChange={e => setSplitPercent(e.target.value)}
                placeholder="10"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            O valor será dividido automaticamente na liquidação.
          </p>
        </div>
      )}
    </div>
  );
}
