import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  isEditing?: boolean;
}

export const SortableCard = ({ id, children, isEditing }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-90 scale-105',
        isEditing && 'ring-2 ring-primary/20 ring-offset-2 rounded-lg'
      )}
    >
      {isEditing && (
        <button
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-2 top-1/2 -translate-y-1/2 z-10',
            'p-1.5 rounded-md bg-primary/90 text-primary-foreground shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'cursor-grab active:cursor-grabbing',
            'hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
};
