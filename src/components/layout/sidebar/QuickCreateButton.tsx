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

  useEffect(() => {
    const handleQuickCreate = () => setOpen(true);
    window.addEventListener('quick-create-open', handleQuickCreate);
    return () => window.removeEventListener('quick-create-open', handleQuickCreate);
  }, []);

  const button = (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => setOpen(true)}
      className={cn(
        'flex items-center gap-3 w-full rounded-md transition-all duration-200 relative overflow-hidden',
        'bg-primary text-white font-medium shadow-sm hover:bg-primary/90',
        collapsed ? 'p-2 justify-center' : 'px-4 py-2.5'
      )}
    >
      <Plus className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
      {!collapsed && (
        <span className="text-sm font-medium">Novo Registro</span>
      )}
    </motion.button>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-2">{button}</div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Criar Novo (N)</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="mb-2">{button}</div>
      )}
      
      <QuickCreateModal open={open} onOpenChange={setOpen} />
    </>
  );
}