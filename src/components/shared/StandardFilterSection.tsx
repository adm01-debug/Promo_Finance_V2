import { ReactNode } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StandardFilterSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children: ReactNode;
  badge?: string;
  className?: string;
}

export function StandardFilterSection({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  children,
  badge = "Filtros",
  className,
}: StandardFilterSectionProps) {
  return (
    <Card className={cn("border-none bg-card/[0.03] backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10", className)}>
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Search Command */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl -m-1 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-16 bg-card/[0.03] border-white/5 focus:bg-background/80 focus:border-primary/40 h-16 rounded-[1.5rem] transition-all duration-700 font-bold text-sm shadow-inner"
          />
        </div>
        
        {/* Intelligence Filters Grid */}
        <div className="flex flex-col lg:flex-row items-center gap-6 p-4 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 pl-4 border-r border-white/10 pr-4 h-8 hidden lg:flex">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{badge}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-3 flex-1 w-full px-2 lg:px-0">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
