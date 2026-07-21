import { Loader2, Search, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  busca: string;
  onBusca: (v: string) => void;
  bloqueado: boolean;
  isAiCorrecting: boolean;
  onAiCorrection: () => void;
}

export function SearchBar({ busca, onBusca, bloqueado, isAiCorrecting, onAiCorrection }: Props) {
  return (
    <div className="flex items-center justify-between mb-2 gap-4">
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
        <Input
          data-testid="input-busca-validacoes"
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          placeholder="Buscar nas validações (ex: código de conta, descrição)..."
          className="h-14 pl-12 pr-12 text-sm font-bold bg-card/[0.03] border-white/5 focus-visible:ring-1 focus-visible:ring-primary/40 transition-all rounded-2xl shadow-inner placeholder:text-foreground/20 text-foreground"
        />
        {busca && (
          <button
            type="button"
            onClick={() => onBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {bloqueado && (
        <Button
          onClick={onAiCorrection}
          disabled={isAiCorrecting}
          variant="premium"
          className="h-14 px-6 rounded-2xl font-black gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
        >
          {isAiCorrecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
          <span className="hidden sm:inline">Corrigir com IA</span>
        </Button>
      )}
    </div>
  );
}
