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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setOpen(true)}
      className={cn(
        'flex items-center gap-3 w-full rounded-xl transition-all duration-200',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'shadow-md hover:shadow-lg',
        collapsed ? 'p-2.5 justify-center' : 'px-4 py-2.5'
      )}
    >
      <Plus className="h-5 w-5" />
      {!collapsed && (
        <span className="font-medium text-sm">Criar Novo</span>
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
