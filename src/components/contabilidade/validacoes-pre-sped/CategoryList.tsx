import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { agruparValidacoes } from '@/lib/sped-validacoes-categorias';

type Agrupados = ReturnType<typeof agruparValidacoes>;

interface Props {
  agrupados: Agrupados;
  expandedCats: Set<string>;
  onToggle: (id: string) => void;
  busca: string;
}

export function CategoryList({ agrupados, expandedCats, onToggle, busca }: Props) {
  return (
    <ScrollArea className="max-h-[50vh] pr-4">
      {agrupados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-success/20 mb-3" />
          <p className="text-sm font-medium">Nenhuma validação pendente</p>
          {busca && <p className="text-xs">Nenhum item corresponde a "{busca}"</p>}
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {agrupados.map(({ categoria, erros: catErros, avisos: catAvisos, total }) => {
            const isOpen = expandedCats.has(categoria.id);
            return (
              <div
                key={categoria.id}
                className={cn(
                  'border rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl',
                  isOpen
                    ? 'bg-card/[0.03] border-primary/30 ring-1 ring-primary/20'
                    : 'bg-card/[0.01] border-white/5 hover:border-primary/20'
                )}
              >
                <button
                  onClick={() => onToggle(categoria.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-xl transition-all shadow-sm',
                        catErros.length > 0
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning',
                        isOpen &&
                          (catErros.length > 0
                            ? 'bg-destructive text-primary-foreground'
                            : 'bg-warning text-primary-foreground')
                      )}
                    >
                      {catErros.length > 0 ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2 tracking-tight">
                        {categoria.label.toUpperCase()}
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-2 font-black rounded-full bg-muted/50"
                        >
                          {total}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-70">
                        {categoria.description}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'p-1.5 rounded-full transition-all',
                      isOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 space-y-2 bg-gradient-to-b from-transparent to-muted/5">
                    {catErros.map((e, i) => (
                      <div
                        key={`e-${i}`}
                        className="flex gap-3 text-xs font-mono p-3 rounded-xl bg-destructive/5 text-destructive border border-destructive/10 leading-relaxed shadow-sm transition-all hover:bg-destructive/10"
                      >
                        <span className="shrink-0 opacity-40 font-bold">ERR</span>
                        <span>{e}</span>
                      </div>
                    ))}
                    {catAvisos.map((a, i) => (
                      <div
                        key={`a-${i}`}
                        className="flex gap-3 text-xs font-mono p-3 rounded-xl bg-warning/5 text-warning-foreground border border-warning/10 leading-relaxed shadow-sm transition-all hover:bg-warning/10"
                      >
                        <span className="shrink-0 opacity-40 font-bold">WRN</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}
