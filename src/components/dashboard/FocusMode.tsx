/**
 * Focus Mode - Modo de foco para visualização destacada de KPIs
 * 
 * Permite visualizar um KPI em destaque com animações elegantes
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface FocusModeData {
  title: string;
  value: number;
  previousValue?: number;
  variation?: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  color?: string;
  insight?: string;
  sparkline?: number[];
}

interface FocusModeProps {
  data: FocusModeData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FocusMode({ data, isOpen, onClose }: FocusModeProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!data) return null;

  const formattedValue = data.isPercentage 
    ? `${data.value.toFixed(1)}%` 
    : data.isCurrency 
      ? formatCurrency(data.value)
      : data.value.toLocaleString('pt-BR');

  const variationValue = data.variation ?? 
    (data.previousValue ? ((data.value - data.previousValue) / data.previousValue) * 100 : 0);
  const isPositive = variationValue >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 text-center px-8"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute -top-16 right-0 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Title */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground mb-4"
            >
              {data.title}
            </motion.p>

            {/* Value - Hero display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <span 
                className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight"
                style={{ color: data.color || 'hsl(var(--foreground))' }}
              >
                {formattedValue}
              </span>
            </motion.div>

            {/* Variation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'flex items-center justify-center gap-2 text-xl',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
              <span className="font-semibold">
                {formatPercentage(Math.abs(variationValue))}
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </motion.div>

            {/* Insight */}
            {data.insight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex items-center justify-center gap-2 text-muted-foreground"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span>{data.insight}</span>
              </motion.div>
            )}

            {/* Sparkline */}
            {data.sparkline && data.sparkline.length > 1 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 0.3, scaleY: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 flex items-end justify-center gap-1 h-20"
              >
                {data.sparkline.map((value, i) => {
                  const max = Math.max(...data.sparkline!);
                  const height = (value / max) * 100;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="w-2 rounded-full bg-primary"
                      style={{ minHeight: 4 }}
                    />
                  );
                })}
              </motion.div>
            )}

            {/* Hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-sm text-muted-foreground"
            >
              Pressione ESC ou clique fora para fechar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for using focus mode
export function useFocusMode() {
  const [focusData, setFocusData] = useState<FocusModeData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openFocus = (data: FocusModeData) => {
    setFocusData(data);
    setIsOpen(true);
  };

  const closeFocus = () => {
    setIsOpen(false);
  };

  return {
    focusData,
    isOpen,
    openFocus,
    closeFocus,
  };
}

// Trigger button component
interface FocusModeTriggerProps {
  onClick: () => void;
  className?: string;
}

export function FocusModeTrigger({ onClick, className }: FocusModeTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
        className
      )}
    >
      <Maximize2 className="h-3.5 w-3.5" />
    </Button>
  );
}
