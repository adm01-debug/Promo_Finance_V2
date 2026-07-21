import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function Step({ ok, title, detail, icon }: { ok: boolean; title: string; detail: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={ok ? 'text-success' : 'text-destructive'}>
        {icon ?? (ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground break-words">{detail}</p>
      </div>
    </div>
  );
}
