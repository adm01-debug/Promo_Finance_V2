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
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setOpen(true)}
      className={cn(
        'flex items-center gap-3 w-full rounded-2xl transition-all duration-300',
        'bg-gradient-to-br from-primary to-primary-glow text-primary-foreground',
        'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30',
        'ring-1 ring-white/20',
        collapsed ? 'p-3 justify-center' : 'px-5 py-3.5'
      )}
    >
      <div className="bg-white/20 p-1 rounded-lg">
        <Plus className="h-4.5 w-4.5 font-black" />
      </div>
      {!collapsed && (
        <span className="font-bold text-sm tracking-tight">Novo Registro</span>
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
