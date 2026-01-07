/**
 * Drag and Drop - Enhanced sortable components
 * 
 * Features: visual feedback, animations, accessibility
 */

import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

// Sortable list with animations
interface SortableItem {
  id: string;
  [key: string]: any;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  disabled = false,
  onDelete,
  onEdit
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn('space-y-2', className)}
    >
      <AnimatePresence>
        {items.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item}
            onDragStart={() => !disabled && setActiveId(item.id)}
            onDragEnd={() => setActiveId(null)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: activeId === item.id ? 1.02 : 1,
              boxShadow: activeId === item.id 
                ? '0 10px 40px -10px rgba(0,0,0,0.2)' 
                : '0 1px 3px rgba(0,0,0,0.1)'
            }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg bg-card border',
              'transition-colors cursor-grab active:cursor-grabbing',
              activeId === item.id && 'z-10 border-primary bg-card',
              disabled && 'cursor-default',
              itemClassName
            )}
          >
            {!disabled && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GripVertical className="h-4 w-4" />
              </motion.div>
            )}
            
            <div className="flex-1 min-w-0">
              {renderItem(item, activeId === item.id)}
            </div>

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </motion.button>
                )}
                {onDelete && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-950 transition-colors text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </div>
            )}
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

// Kanban-style drag between columns
interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function KanbanCard({ 
  id, 
  children, 
  className,
  onDragStart,
  onDragEnd
}: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      layout
      layoutId={id}
      drag
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.1}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd?.();
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 2 : 0,
        boxShadow: isDragging 
          ? '0 20px 40px -10px rgba(0,0,0,0.3)' 
          : '0 1px 3px rgba(0,0,0,0.1)'
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -2 }}
      className={cn(
        'p-4 rounded-lg bg-card border cursor-grab active:cursor-grabbing',
        isDragging && 'z-50',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// Drop zone indicator
interface DropZoneProps {
  isActive: boolean;
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

export function DropZone({ isActive, children, className, label = 'Solte aqui' }: DropZoneProps) {
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        backgroundColor: isActive ? 'hsl(var(--primary) / 0.05)' : 'transparent'
      }}
      className={cn(
        'relative min-h-[100px] rounded-lg border-2 border-dashed p-4 transition-colors',
        className
      )}
    >
      {children}
      
      <AnimatePresence>
        {isActive && !children && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-primary font-medium"
            >
              {label}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Drag handle component
interface DragHandleProps {
  className?: string;
  variant?: 'default' | 'compact' | 'dots';
}

export function DragHandle({ className, variant = 'default' }: DragHandleProps) {
  if (variant === 'dots') {
    return (
      <div className={cn('grid grid-cols-2 gap-0.5', className)}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.2 }}
            className="h-1 w-1 rounded-full bg-muted-foreground/50"
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={cn(
        'text-muted-foreground hover:text-foreground transition-colors cursor-grab',
        className
      )}
    >
      <GripVertical className={cn('h-4 w-4', variant === 'compact' && 'h-3 w-3')} />
    </motion.div>
  );
}

// Reorderable grid
interface ReorderableGridProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  columns?: number;
  className?: string;
}

export function ReorderableGrid<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  columns = 3,
  className
}: ReorderableGridProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
        className
      )}
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          onDragStart={() => setActiveId(item.id)}
          onDragEnd={() => setActiveId(null)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: activeId === item.id ? 1.05 : 1,
            zIndex: activeId === item.id ? 10 : 0
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.02 }}
          className="cursor-grab active:cursor-grabbing"
        >
          {renderItem(item)}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

// Sortable with placeholder
interface SortableWithPlaceholderProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
}

export function SortableWithPlaceholder<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  placeholder,
  className
}: SortableWithPlaceholderProps<T>) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn('space-y-2', className)}
    >
      {items.map((item, index) => (
        <div key={item.id}>
          <AnimatePresence>
            {dragOverIndex === index && placeholder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 0.5, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2"
              >
                {placeholder}
              </motion.div>
            )}
          </AnimatePresence>
          
          <Reorder.Item
            value={item}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-grab active:cursor-grabbing"
          >
            {renderItem(item)}
          </Reorder.Item>
        </div>
      ))}
    </Reorder.Group>
  );
}
