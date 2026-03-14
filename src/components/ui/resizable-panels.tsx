import {
  useState,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// Types
interface PanelGroupContextValue {
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  setSizes: (sizes: number[]) => void;
  onResize?: (sizes: number[]) => void;
}

interface PanelGroupProps {
  direction?: 'horizontal' | 'vertical';
  children: ReactNode;
  className?: string;
  onResize?: (sizes: number[]) => void;
  autoSaveId?: string;
}

interface PanelProps {
  children: ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  className?: string;
  order?: number;
}

interface ResizeHandleProps {
  className?: string;
  disabled?: boolean;
}

// Context
const PanelGroupContext = createContext<PanelGroupContextValue | null>(null);

// Panel Group Component
export function PanelGroup({
  direction = 'horizontal',
  children,
  className,
  onResize,
  autoSaveId,
}: PanelGroupProps) {
  const [sizes, setSizes] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Load saved sizes
  useEffect(() => {
    if (autoSaveId && !initializedRef.current) {
      const saved = localStorage.getItem(`panel-sizes-${autoSaveId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSizes(parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    initializedRef.current = true;
  }, [autoSaveId]);

  // Save sizes
  useEffect(() => {
    if (autoSaveId && sizes.length > 0 && initializedRef.current) {
      localStorage.setItem(`panel-sizes-${autoSaveId}`, JSON.stringify(sizes));
    }
  }, [autoSaveId, sizes]);

  // Initialize sizes from children
  useEffect(() => {
    if (!containerRef.current || sizes.length > 0) return;

    const panels = containerRef.current.querySelectorAll('[data-panel]');
    const defaultSizes: number[] = [];
    const totalDefault = Array.from(panels).reduce((sum, panel) => {
      const size = Number(panel.getAttribute('data-default-size')) || 0;
      defaultSizes.push(size);
      return sum + size;
    }, 0);

    // Normalize to percentages
    if (totalDefault > 0) {
      const normalized = defaultSizes.map(s => (s / totalDefault) * 100);
      setSizes(normalized);
    } else {
      // Equal distribution
      const equal = 100 / panels.length;
      setSizes(Array(panels.length).fill(equal));
    }
  }, [sizes.length]);

  const handleSizesChange = useCallback((newSizes: number[]) => {
    setSizes(newSizes);
    onResize?.(newSizes);
  }, [onResize]);

  return (
    <PanelGroupContext.Provider
      value={{
        direction,
        sizes,
        setSizes: handleSizesChange,
        onResize,
      }}
    >
      <div
        ref={containerRef}
        className={cn(
          'flex h-full w-full overflow-hidden',
          direction === 'vertical' && 'flex-col',
          className
        )}
      >
        {children}
      </div>
    </PanelGroupContext.Provider>
  );
}

// Panel Component
export function Panel({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  collapsible = false,
  collapsedSize = 0,
  className,
  order = 0,
}: PanelProps) {
  const context = useContext(PanelGroupContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!context) {
    throw new Error('Panel must be used within PanelGroup');
  }

  const { direction, sizes } = context;
  const size = sizes[order] ?? defaultSize;

  const style = {
    flexBasis: `${isCollapsed ? collapsedSize : size}%`,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: direction === 'horizontal' ? `${minSize}%` : undefined,
    maxWidth: direction === 'horizontal' ? `${maxSize}%` : undefined,
    minHeight: direction === 'vertical' ? `${minSize}%` : undefined,
    maxHeight: direction === 'vertical' ? `${maxSize}%` : undefined,
  };

  return (
    <div
      ref={panelRef}
      data-panel
      data-order={order}
      data-default-size={defaultSize}
      data-collapsed={isCollapsed}
      className={cn('overflow-auto', className)}
      style={style}
    >
      {children}
    </div>
  );
}

// Resize Handle Component
export function ResizeHandle({ className, disabled = false }: ResizeHandleProps) {
  const context = useContext(PanelGroupContext);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!context) {
    throw new Error('ResizeHandle must be used within PanelGroup');
  }

  const { direction, sizes, setSizes } = context;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  }, [disabled]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const handle = handleRef.current;
      if (!handle) return;

      const parent = handle.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const position = direction === 'horizontal'
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;

      // Find which panel this handle is between
      const handles = Array.from(parent.querySelectorAll('[data-resize-handle]'));
      const handleIndex = handles.indexOf(handle);

      // Update sizes
      const newSizes = [...sizes];
      const leftPanelIndex = handleIndex;
      const rightPanelIndex = handleIndex + 1;

      // Calculate new sizes
      let leftSize = position;
      let rightSize = 100 - position;

      // Account for panels before this handle
      for (let i = 0; i < leftPanelIndex; i++) {
        leftSize -= newSizes[i];
      }

      // Account for panels after this handle
      for (let i = rightPanelIndex + 1; i < newSizes.length; i++) {
        rightSize -= newSizes[i];
      }

      // Apply constraints
      leftSize = Math.max(10, Math.min(90, leftSize));
      rightSize = Math.max(10, Math.min(90, rightSize));

      newSizes[leftPanelIndex] = leftSize;
      newSizes[rightPanelIndex] = rightSize;

      setSizes(newSizes);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, sizes, setSizes]);

  return (
    <div
      ref={handleRef}
      data-resize-handle
      onMouseDown={handleMouseDown}
      className={cn(
        'relative flex-shrink-0 select-none',
        direction === 'horizontal'
          ? 'w-1 cursor-col-resize'
          : 'h-1 cursor-row-resize',
        'bg-border hover:bg-primary/50',
        isDragging && 'bg-primary',
        disabled && 'cursor-default bg-muted',
        'transition-colors',
        className
      )}
    >
      {/* Visual indicator */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          direction === 'horizontal' ? 'flex-col' : 'flex-row'
        )}
      >
        <div
          className={cn(
            'rounded-full bg-muted-foreground/50',
            direction === 'horizontal' ? 'w-0.5 h-4' : 'w-4 h-0.5'
          )}
        />
      </div>

      {/* Larger hit area */}
      <div
        className={cn(
          'absolute',
          direction === 'horizontal'
            ? '-left-1 -right-1 inset-y-0'
            : '-top-1 -bottom-1 inset-x-0'
        )}
      />
    </div>
  );
}

// Pre-built layouts
interface TwoPanelLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftDefaultSize?: number;
  leftMinSize?: number;
  rightMinSize?: number;
  className?: string;
}

export function TwoPanelLayout({
  left,
  right,
  leftDefaultSize = 30,
  leftMinSize = 15,
  rightMinSize = 30,
  className,
}: TwoPanelLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className={className}>
      <Panel defaultSize={leftDefaultSize} minSize={leftMinSize} order={0}>
        {left}
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={100 - leftDefaultSize} minSize={rightMinSize} order={1}>
        {right}
      </Panel>
    </PanelGroup>
  );
}

interface ThreePanelLayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftDefaultSize?: number;
  rightDefaultSize?: number;
  className?: string;
}

export function ThreePanelLayout({
  left,
  center,
  right,
  leftDefaultSize = 20,
  rightDefaultSize = 25,
  className,
}: ThreePanelLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className={className}>
      <Panel defaultSize={leftDefaultSize} minSize={10} order={0}>
        {left}
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={100 - leftDefaultSize - rightDefaultSize} minSize={30} order={1}>
        {center}
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={rightDefaultSize} minSize={10} order={2}>
        {right}
      </Panel>
    </PanelGroup>
  );
}

interface MainSidebarLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarDefaultSize?: number;
  className?: string;
}

export function MainSidebarLayout({
  sidebar,
  main,
  sidebarPosition = 'left',
  sidebarDefaultSize = 25,
  className,
}: MainSidebarLayoutProps) {
  if (sidebarPosition === 'right') {
    return (
      <PanelGroup direction="horizontal" className={className}>
        <Panel defaultSize={100 - sidebarDefaultSize} minSize={40} order={0}>
          {main}
        </Panel>
        <ResizeHandle />
        <Panel defaultSize={sidebarDefaultSize} minSize={15} maxSize={40} order={1}>
          {sidebar}
        </Panel>
      </PanelGroup>
    );
  }

  return (
    <PanelGroup direction="horizontal" className={className}>
      <Panel defaultSize={sidebarDefaultSize} minSize={15} maxSize={40} order={0}>
        {sidebar}
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={100 - sidebarDefaultSize} minSize={40} order={1}>
        {main}
      </Panel>
    </PanelGroup>
  );
}

export default PanelGroup;
