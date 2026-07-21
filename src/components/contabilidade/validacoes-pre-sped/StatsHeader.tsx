import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  errosCount: number;
  avisosCount: number;
  hashCurto: string;
  hashFull: string | null;
  isCopied: boolean;
  onCopyHash: () => void;
}

export function StatsHeader({ errosCount, avisosCount, hashCurto, hashFull, isCopied, onCopyHash }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-[2rem] border border-white/5 bg-card/[0.02] p-6 text-center transition-all hover:bg-card/[0.04] shadow-2xl group/stat">
        <div className="text-[10px] uppercase font-black text-foreground/20 tracking-[0.3em] mb-2 group-hover/stat:text-primary transition-colors">
          Erros
        </div>
        <div
          data-testid="contador-erros"
          className={cn(
            'text-5xl font-black tabular-nums tracking-tighter drop-shadow-2xl',
            errosCount > 0 ? 'text-destructive' : 'text-success'
          )}
        >
          {errosCount}
        </div>
      </div>
      <div className="rounded-[2rem] border border-white/5 bg-card/[0.02] p-6 text-center transition-all hover:bg-card/[0.04] shadow-2xl group/stat">
        <div className="text-[10px] uppercase font-black text-foreground/20 tracking-[0.3em] mb-2 group-hover/stat:text-primary transition-colors">
          Avisos
        </div>
        <div
          data-testid="contador-avisos"
          className={cn(
            'text-5xl font-black tabular-nums tracking-tighter drop-shadow-2xl',
            avisosCount > 0 ? 'text-warning' : 'text-foreground/20'
          )}
        >
          {avisosCount}
        </div>
      </div>
      <div
        className="rounded-[2rem] border border-white/5 bg-card/[0.02] p-6 text-center transition-all hover:bg-card/[0.04] shadow-2xl flex flex-col justify-center overflow-hidden group/stat cursor-pointer relative"
        onClick={onCopyHash}
      >
        <div className="text-[10px] uppercase font-black text-foreground/20 tracking-[0.3em] mb-2 group-hover/stat:text-primary transition-colors flex items-center justify-center gap-1">
          Hash Alpha{' '}
          {isCopied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </div>
        <div
          className="text-[10px] font-mono mt-1 truncate bg-black/40 p-2.5 rounded-xl border border-white/5 text-foreground/60 transition-all group-hover/stat:border-primary/30 group-hover/stat:text-white"
          title={hashFull ?? ''}
        >
          {hashCurto}
        </div>
      </div>
    </div>
  );
}
