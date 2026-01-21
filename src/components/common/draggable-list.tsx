import { useState, useRef, useCallback, ReactNode } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableItem {
  id: string;
  [key: string]: unknown;
}

interface DraggableListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode;
  keyExtractor?: (item: T) => string;
  onRemove?: (item: T) => void;
  showHandle?: boolean;
  showRemove?: boolean;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  dragHandleClassName?: string;
  emptyMessage?: string;
}

export function DraggableList<T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.id,
  onRemove,
  showHandle = true,
  showRemove = false,
  disabled = false,
  className,
  itemClassName,
  dragHandleClassName,
  emptyMessage = 'Nenhum item',
}: DraggableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    if (disabled) return;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);

    // Create custom drag image
    if (dragRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      e.dataTransfer.setDragImage(e.currentTarget, rect.width / 2, rect.height / 2);
    }
  }, [disabled]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setOverIndex(null);
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback((targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || draggedIndex === null) return;

    const sourceIndex = draggedIndex;
    if (sourceIndex === targetIndex) {
      setDraggedIndex(null);
      setOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);
    onReorder(newItems);

    setDraggedIndex(null);
    setOverIndex(null);
  }, [disabled, draggedIndex, items, onReorder]);

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500 dark:text-gray-400', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)} ref={dragRef}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isOver = overIndex === index && draggedIndex !== index;
        const key = keyExtractor(item);

        return (
          <div
            key={key}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(index, e)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(index, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(index, e)}
            className={cn(
              'group flex items-center gap-2 rounded-lg transition-all',
              isDragging && 'opacity-50 scale-95',
              isOver && 'border-t-2 border-primary-500',
              !disabled && 'cursor-move',
              itemClassName
            )}
          >
            {/* Drag handle */}
            {showHandle && !disabled && (
              <div
                className={cn(
                  'flex-shrink-0 p-1 cursor-grab active:cursor-grabbing',
                  'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                  dragHandleClassName
                )}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            {/* Item content */}
            <div className="flex-1 min-w-0">
              {renderItem(item, index, isDragging)}
            </div>

            {/* Remove button */}
            {showRemove && onRemove && (
              <button
                onClick={() => onRemove(item)}
                className={cn(
                  'flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100',
                  'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                  'transition-all'
                )}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Sortable list with cards
interface SortableCardListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderCard: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T) => string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SortableCardList<T extends DraggableItem>({
  items,
  onReorder,
  renderCard,
  keyExtractor = (item) => item.id,
  columns = 1,
  className,
}: SortableCardListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setOverIndex(null);
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);
    onReorder(newItems);

    setDraggedIndex(null);
    setOverIndex(null);
  }, [draggedIndex, items, onReorder]);

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isOver = overIndex === index && draggedIndex !== index;
        const key = keyExtractor(item);

        return (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(index, e)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(index, e)}
            onDrop={(e) => handleDrop(index, e)}
            className={cn(
              'relative cursor-move transition-all',
              isDragging && 'opacity-50 scale-95',
              isOver && 'ring-2 ring-primary-500 ring-offset-2'
            )}
          >
            {renderCard(item, index)}
            
            {/* Drag handle overlay */}
            <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
              <div className="p-1 bg-white dark:bg-gray-800 rounded shadow">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple reorder hook
export function useReorder<T>(initialItems: T[]) {
  const [items, setItems] = useState(initialItems);

  const reorder = useCallback((startIndex: number, endIndex: number) => {
    const result = [...items];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setItems(result);
    return result;
  }, [items]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) {
      return reorder(index, index - 1);
    }
    return items;
  }, [items, reorder]);

  const moveDown = useCallback((index: number) => {
    if (index < items.length - 1) {
      return reorder(index, index + 1);
    }
    return items;
  }, [items, reorder]);

  const moveToTop = useCallback((index: number) => {
    return reorder(index, 0);
  }, [reorder]);

  const moveToBottom = useCallback((index: number) => {
    return reorder(index, items.length - 1);
  }, [items.length, reorder]);

  const remove = useCallback((index: number) => {
    const result = items.filter((_, i) => i !== index);
    setItems(result);
    return result;
  }, [items]);

  const add = useCallback((item: T, index?: number) => {
    const result = [...items];
    if (index !== undefined) {
      result.splice(index, 0, item);
    } else {
      result.push(item);
    }
    setItems(result);
    return result;
  }, [items]);

  return {
    items,
    setItems,
    reorder,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    remove,
    add,
  };
}

export default DraggableList;
