import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: () => void;
}

interface BulkActionsBarProps {
  selectedCount: number;
  isProcessing?: boolean;
  progress?: number;
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  isProcessing = false,
  progress = 0,
  actions,
  onClear,
  className,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "bg-popover border shadow-lg rounded-xl p-3",
            "flex items-center gap-3",
            className
          )}
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
            </span>
          </div>

          {/* Progress bar (when processing) */}
          {isProcessing && (
            <div className="flex items-center gap-2 min-w-[150px]">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          )}

          {/* Action buttons */}
          {!isProcessing && (
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Clear selection */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isProcessing}
            className="h-8 w-8"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
