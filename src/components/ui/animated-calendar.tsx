import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnimatedCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  markers?: Array<{
    date: Date;
    color?: 'primary' | 'success' | 'warning' | 'destructive';
    label?: string;
  }>;
  className?: string;
}

export function AnimatedCalendar({ 
  selected, 
  onSelect, 
  markers = [],
  className 
}: AnimatedCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: ptBR });
  const endDate = endOfWeek(monthEnd, { locale: ptBR });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const markerColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  const getMarker = (date: Date) => 
    markers.find(m => isSameDay(m.date, date));

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className={cn('w-full max-w-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentMonth.toISOString()}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="grid grid-cols-7 gap-1"
        >
          {weeks.flat().map((date, i) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = selected && isSameDay(date, selected);
            const isCurrentDay = isToday(date);
            const marker = getMarker(date);

            return (
              <motion.button
                key={i}
                onClick={() => onSelect?.(date)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative aspect-square p-2 rounded-lg text-sm transition-colors',
                  'flex items-center justify-center',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isCurrentMonth && 'text-foreground hover:bg-muted',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isCurrentDay && !isSelected && 'ring-1 ring-primary',
                )}
              >
                {format(date, 'd')}
                {marker && (
                  <span 
                    className={cn(
                      'absolute bottom-1 left-1/2 -translate-x-1/2',
                      'h-1.5 w-1.5 rounded-full',
                      markerColors[marker.color || 'primary']
                    )}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Mini calendar picker
interface DatePickerButtonProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerButton({ 
  value, 
  onChange, 
  placeholder = 'Selecionar data',
  className 
}: DatePickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn('w-full justify-start text-left font-normal', className)}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {value ? format(value, 'dd/MM/yyyy') : placeholder}
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 p-4 bg-popover border rounded-xl shadow-lg"
          >
            <AnimatedCalendar
              selected={value}
              onSelect={(date) => {
                onChange?.(date);
                setIsOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
