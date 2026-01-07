/**
 * Enhanced Sheet - Com animações melhoradas e variantes
 */

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    blur?: boolean;
  }
>(({ className, blur = true, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/60",
      blur && "backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background shadow-2xl transition-all ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b rounded-b-xl data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
      size: {
        default: "",
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        full: "w-full max-w-full",
      },
    },
    defaultVariants: {
      side: "right",
      size: "default",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showHandle?: boolean;
  overlayBlur?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", size, className, children, showHandle, overlayBlur = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay blur={overlayBlur} />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side, size }), "p-6", className)}
      {...props}
    >
      {/* Handle para bottom sheets */}
      {showHandle && (side === "bottom" || side === "top") && (
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      {children}

      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left mb-4", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// ============================================================================
// Sheet with Sections
// ============================================================================

interface SheetSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function SheetSection({ title, children, className }: SheetSectionProps) {
  return (
    <div className={cn("py-4 border-b last:border-0", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-3">{title}</h4>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// Resizable Sheet Hook
// ============================================================================

interface UseResizableSheetOptions {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

function useResizableSheet(options: UseResizableSheetOptions = {}) {
  const { minWidth = 320, maxWidth = 800, defaultWidth = 400 } = options;
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return { width, isResizing, handleMouseDown };
}

// ============================================================================
// Resizable Sheet Content
// ============================================================================

interface ResizableSheetContentProps extends Omit<SheetContentProps, 'style'> {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

const ResizableSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  ResizableSheetContentProps
>(({ minWidth = 320, maxWidth = 800, defaultWidth = 400, className, children, ...props }, ref) => {
  const { width, isResizing, handleMouseDown } = useResizableSheet({
    minWidth,
    maxWidth,
    defaultWidth,
  });

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-y-0 right-0 z-50 h-full bg-background shadow-2xl",
          "border-l transition-all data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          "data-[state=closed]:duration-200 data-[state=open]:duration-300",
          isResizing && "select-none",
          className,
        )}
        style={{ width: `${width}px` }}
        {...props}
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize group",
            "hover:bg-primary/20 transition-colors",
            isResizing && "bg-primary/30",
          )}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="p-6 h-full overflow-auto">
          {children}
        </div>

        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
ResizableSheetContent.displayName = "ResizableSheetContent";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  SheetSection,
  ResizableSheetContent,
  useResizableSheet,
};
