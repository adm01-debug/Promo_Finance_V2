import type { ComponentType } from 'react';
import { Check, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string }>;

export const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: IconType; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
      active ? 'bg-card/10 text-foreground' : 'text-foreground/40 hover:text-foreground/60',
    )}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

export const TokenItem = ({ name, value, type }: { name: string; value: string; type: 'color' }) => (
  <div className="p-3 bg-card/5 border border-white/5 rounded-xl flex items-center gap-3">
    {type === 'color' && <div className="h-8 w-8 rounded-lg border border-border" style={{ backgroundColor: value }} />}
    <div>
      <p className="text-caption leading-none mb-1">{name}</p>
      <code className="text-xs text-foreground/90 font-mono">{value}</code>
    </div>
  </div>
);

export const TypographyRow = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div>
      <p className="text-xs font-bold text-foreground leading-none mb-1">{label}</p>
      <p className="text-caption !text-primary/40">{sub}</p>
    </div>
    <code className="text-[11px] text-primary font-mono">{value}</code>
  </div>
);

export const CheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
  <div className="flex items-center gap-3">
    <div
      className={cn(
        'h-5 w-5 rounded border flex items-center justify-center transition-colors',
        checked ? 'bg-green-500 border-green-500 text-foreground' : 'border-white/20 bg-card/5 text-transparent',
      )}
    >
      <Check className="h-3 w-3" />
    </div>
    <span className={cn('text-xs font-medium', checked ? 'text-foreground/80' : 'text-foreground/40')}>{label}</span>
  </div>
);

export const DeviceToggle = ({ icon: Icon, label, active, onClick }: { icon: IconType; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
      active ? 'bg-card text-card-foreground' : 'text-foreground/40 hover:bg-card/5',
    )}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

export const DeviceIndicator = ({ icon: Icon, status }: { icon: IconType; status: 'pending' | 'success' | 'error' }) => (
  <div className={cn('h-6 w-6 rounded flex items-center justify-center', status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-card/5 text-foreground/20')}>
    <Icon className="h-3 w-3" />
  </div>
);

export const PlaceholderView = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-foreground/10">
    <EyeOff className="h-8 w-8" />
    <span className="text-[10px] uppercase font-black tracking-widest">Sem Imagem</span>
  </div>
);
