import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QuickCreateModal } from '@/components/quick-create/QuickCreateModal';

interface QuickCreateButtonProps {
  collapsed: boolean;
}

export function QuickCreateButton({ collapsed }: QuickCreateButtonProps) {
  const [open, setOpen] = useState(false);

  // Listen for keyboard shortcut "N"
  useEffect(() => {
    const handleQuickCreate = () => setOpen(true);
    window.addEventListener('quick-create-open', handleQuickCreate);
    return () => window.removeEventListener('quick-create-open', handleQuickCreate);
  }, []);

  const button = (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setOpen(true)}
      className={cn(
        'flex items-center gap-4 w-full rounded-2xl transition-all duration-700 relative overflow-hidden',
        'bg-primary text-white',
        'shadow-[0_20px_40px_-12px_rgba(var(--primary),0.6)] hover:shadow-[0_24px_48px_-8px_rgba(var(--primary),0.7)]',
        'ring-1 ring-white/20 group/create',
        collapsed ? 'p-4.5 justify-center' : 'px-7 py-5'
      )}
    >
      <div className="absolute inset-0 bg-white/20 blur-md -translate-x-full group-hover/create:translate-x-full transition-transform duration-1000" />
      
      <div className="bg-white/20 p-2 rounded-xl relative z-10 shadow-inner">
        <Plus className="h-5 w-5 font-black" />
      </div>
      {!collapsed && (
        <span className="font-black text-[11px] uppercase tracking-[0.2em] relative z-10">NOVO COMANDO</span>
      )}
    </motion.button>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-3 mb-4">{button}</div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Criar Novo (N)</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="px-3 mb-4">{button}</div>
      )}
      
      <QuickCreateModal open={open} onOpenChange={setOpen} />
    </>
  );
}
