/**
 * Interactive Chart - Chart with zoom, pan, and drill-down capabilities
 * 
 * Wraps recharts with additional interactive features
 */

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  RefreshCw,
  Move,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InteractiveChartProps {
  children: ReactNode;
  title?: string;
  onExport?: () => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  showControls?: boolean;
  className?: string;
  allowZoom?: boolean;
  allowPan?: boolean;
}

export function InteractiveChart({
  children,
  title,
  onExport,
  onRefresh,
  onFullscreen,
  showControls = true,
  className,
  allowZoom = true,
  allowPan = true,
}: InteractiveChartProps) {
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startPanX = useRef(0);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(100);
    setPanX(0);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!allowPan || zoom <= 100) return;
    setIsPanning(true);
    startX.current = e.clientX;
    startPanX.current = panX;
  }, [allowPan, zoom, panX]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const deltaX = e.clientX - startX.current;
    const maxPan = ((zoom - 100) / 100) * 200;
    setPanX(Math.max(-maxPan, Math.min(maxPan, startPanX.current + deltaX)));
  }, [isPanning, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handlePanLeft = useCallback(() => {
    const maxPan = ((zoom - 100) / 100) * 200;
    setPanX((prev) => Math.min(maxPan, prev + 50));
  }, [zoom]);

  const handlePanRight = useCallback(() => {
    const maxPan = ((zoom - 100) / 100) * 200;
    setPanX((prev) => Math.max(-maxPan, prev - 50));
  }, [zoom]);

  return (
    <div className={cn('relative group', className)}>
      {/* Controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg border shadow-sm p-1"
        >
          {allowZoom && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Diminuir zoom</TooltipContent>
              </Tooltip>

              <span className="text-xs font-mono w-10 text-center">
                {zoom}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aumentar zoom</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}

          {allowPan && zoom > 100 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handlePanLeft}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover esquerda</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handlePanRight}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover direita</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReset}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Resetar visualização</TooltipContent>
          </Tooltip>

          {onExport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onExport}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar gráfico</TooltipContent>
            </Tooltip>
          )}

          {onFullscreen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onFullscreen}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tela cheia</TooltipContent>
            </Tooltip>
          )}
        </motion.div>
      )}

      {/* Pan indicator */}
      {allowPan && zoom > 100 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
          <Move className="h-3 w-3" />
          <span>Arraste para navegar</span>
        </div>
      )}

      {/* Chart container with zoom/pan */}
      <div
        ref={containerRef}
        className={cn(
          'overflow-hidden',
          isPanning && 'cursor-grabbing',
          allowPan && zoom > 100 && !isPanning && 'cursor-grab'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          animate={{
            scale: zoom / 100,
            x: panX,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformOrigin: 'center center' }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// Zoom slider for fine control
interface ChartZoomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function ChartZoomSlider({
  value,
  onChange,
  min = 50,
  max = 200,
  className,
}: ChartZoomSliderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ZoomOut className="h-4 w-4 text-muted-foreground" />
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={5}
        className="w-32"
      />
      <ZoomIn className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-mono w-10">{value}%</span>
    </div>
  );
}

// Custom tooltip for charts with better styling
interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => string;
  labelFormatter?: (label: string) => string;
}

export function EnhancedChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-popover border rounded-lg shadow-lg p-3 min-w-[150px]"
    >
      <p className="text-sm font-medium mb-2 text-foreground">
        {labelFormatter ? labelFormatter(label || '') : label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
