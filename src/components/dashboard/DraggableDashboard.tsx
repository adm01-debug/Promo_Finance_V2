import { useState, ReactNode, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Maximize2, Minimize2, Settings2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DashboardWidget } from '@/hooks/useDashboardConfig';

interface SortableWidgetProps {
  widget: DashboardWidget;
  children: ReactNode;
  isEditing: boolean;
  onToggle: () => void;
  onResize: (size: 'sm' | 'md' | 'lg') => void;
}

function SortableWidget({ widget, children, isEditing, onToggle, onResize }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const sizeClass = widget.size === 'lg'
    ? 'col-span-1 sm:col-span-2 lg:col-span-3'
    : widget.size === 'md'
      ? 'col-span-1 sm:col-span-2 lg:col-span-2'
      : 'col-span-1';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClass,
        isDragging && 'opacity-50 scale-[0.98]',
        isEditing && 'ring-1 ring-primary/20 rounded-xl',
        !widget.visible && 'opacity-40'
      )}
    >
      <div className="relative group">
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-background border border-border rounded-full px-2 py-0.5 shadow-lg"
          >
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:text-primary transition-colors"
              title="Arrastar"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onToggle}
              className="p-0.5 hover:text-primary transition-colors"
              title={widget.visible ? 'Ocultar' : 'Mostrar'}
            >
              {widget.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onResize(widget.size === 'lg' ? 'sm' : widget.size === 'md' ? 'lg' : 'md')}
              className="p-0.5 hover:text-primary transition-colors"
              title="Redimensionar"
            >
              {widget.size === 'sm' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {widget.size.toUpperCase()}
            </Badge>
          </motion.div>
        )}
        {children}
      </div>
    </div>
  );
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggle: (id: string) => void;
  onResize: (id: string, size: 'sm' | 'md' | 'lg') => void;
  renderWidget: (widget: DashboardWidget) => ReactNode;
}

export function DraggableDashboard({
  widgets,
  isEditing,
  setIsEditing,
  onReorder,
  onToggle,
  onResize,
  renderWidget,
}: DraggableDashboardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleWidgets = useMemo(
    () => widgets.filter(w => isEditing || w.visible).sort((a, b) => a.order - b.order),
    [widgets, isEditing]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

  return (
    <div className="space-y-3">
      {/* Edit mode toggle */}
      <div className="flex justify-end">
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Lock className="h-3.5 w-3.5" />
              Salvar Layout
            </>
          ) : (
            <>
              <Settings2 className="h-3.5 w-3.5" />
              Personalizar
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence>
              {visibleWidgets.map(widget => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isEditing={isEditing}
                  onToggle={() => onToggle(widget.id)}
                  onResize={(size) => onResize(widget.id, size)}
                >
                  {renderWidget(widget)}
                </SortableWidget>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <div className="opacity-80 scale-[1.02] shadow-2xl rounded-xl ring-2 ring-primary/30">
              {renderWidget(activeWidget)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {isEditing && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground"
        >
          Arraste os widgets para reorganizar • Clique no olho para ocultar • Clique no ícone de tamanho para redimensionar
        </motion.p>
      )}
    </div>
  );
}