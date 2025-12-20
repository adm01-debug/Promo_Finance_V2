import { useState } from 'react';
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
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SortableCard } from './SortableCard';
import { useDashboardConfig, DashboardWidget } from '@/hooks/useDashboardConfig';
import { cn } from '@/lib/utils';

interface DraggableDashboardGridProps {
  children: (props: { 
    visibleWidgets: DashboardWidget[];
    renderCard: (id: string, content: React.ReactNode, className?: string) => React.ReactNode;
  }) => React.ReactNode;
}

export const DraggableDashboardGrid = ({ children }: DraggableDashboardGridProps) => {
  const {
    visibleWidgets,
    isEditing,
    setIsEditing,
    reorderWidgets,
    resetToDefault,
  } = useDashboardConfig();

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      reorderWidgets(active.id as string, over.id as string);
    }
  };

  const renderCard = (id: string, content: React.ReactNode, className?: string) => {
    if (!isEditing) {
      return <div className={className}>{content}</div>;
    }

    return (
      <SortableCard key={id} id={id} isEditing={isEditing}>
        <div className={className}>{content}</div>
      </SortableCard>
    );
  };

  return (
    <div className="space-y-4">
      {/* Edit Mode Controls */}
      <div className="flex items-center justify-end gap-2">
        <AnimatePresence mode="wait">
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2"
            >
              <Badge variant="secondary" className="gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Modo edição ativo
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4" />
              Concluir
            </>
          ) : (
            <>
              <Settings2 className="h-4 w-4" />
              Personalizar
            </>
          )}
        </Button>
      </div>

      {/* Drag Context */}
      {isEditing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleWidgets.map(w => w.id)}
            strategy={rectSortingStrategy}
          >
            {children({ visibleWidgets, renderCard })}
          </SortableContext>
          <DragOverlay>
            {activeId && (
              <Card className="w-full h-32 bg-primary/5 border-primary/20 shadow-xl">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Arrastando...
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        children({ visibleWidgets, renderCard })
      )}

      {/* Edit Mode Hint */}
      <AnimatePresence>
        {isEditing && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center text-sm text-muted-foreground"
          >
            Arraste os cards pelo ícone <span className="inline-flex items-center"><Settings2 className="h-3 w-3 mx-1" /></span> para reorganizar
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
