import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Loader2, Tag, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCategorizacaoIA, CategoriaDetectada } from '@/hooks/useCategorizacaoIA';
import { cn } from '@/lib/utils';

interface CategorizacaoIABadgeProps {
  despesa: {
    id?: string;
    descricao: string;
    valor: number;
    cliente_nome?: string;
    data_vencimento?: string;
  };
  categoriaAtual?: string;
  onAplicar?: (categoria: CategoriaDetectada) => void;
  size?: 'sm' | 'md';
}

export function CategorizacaoIABadge({
  despesa,
  categoriaAtual,
  onAplicar,
  size = 'sm',
}: CategorizacaoIABadgeProps) {
  const [open, setOpen] = useState(false);
  const [sugestao, setSugestao] = useState<CategoriaDetectada | null>(null);
  const { isAnalyzing, categorizarDespesa } = useCategorizacaoIA();

  const handleAnalisar = async () => {
    const resultado = await categorizarDespesa({
        ...despesa,
        fornecedor_nome: despesa.cliente_nome // Adaptação para o hook existente
    });
    if (resultado) {
      setSugestao(resultado);
    }
  };

  const handleAplicar = () => {
    if (sugestao && onAplicar) {
      onAplicar(sugestao);
      setOpen(false);
    }
  };

  const confiancaColor = sugestao?.confianca
    ? sugestao.confianca >= 0.8
      ? 'text-success'
      : sugestao.confianca >= 0.5
        ? 'text-warning'
        : 'text-muted-foreground'
    : 'text-muted-foreground';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'icon' : 'sm'}
          className={cn(
            'h-7 w-7 hover:bg-primary/10',
            size === 'md' && 'h-8 w-8'
          )}
          onClick={() => {
            if (!sugestao) {
              handleAnalisar();
            }
          }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Categorizar com IA</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Categorização Inteligente</h4>
          </div>

          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analisando registro...</p>
              </motion.div>
            ) : sugestao ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Categoria sugerida</span>
                    <span className={cn('text-xs font-medium', confiancaColor)}>
                      {Math.round((sugestao.confianca || 0) * 100)}% confiança
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{sugestao.categoria}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleAplicar}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSugestao(null);
                      handleAnalisar();
                    }}
                  >
                    Reanalisar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <Button onClick={handleAnalisar}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisar Registro
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
