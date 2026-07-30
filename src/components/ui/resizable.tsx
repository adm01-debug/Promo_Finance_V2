import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// Stub components for react-resizable-panels compatibility
// The installed version may have different exports
const ResizablePanelGroup = ({ className, children, direction = "horizontal", ...props }: {
  className?: string;
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  [key: string]: unknown;
}) => (
  <div
    className={cn("flex h-full w-full", direction === "vertical" ? "flex-col" : "", className)}
    data-panel-group-direction={direction}
    {...props}
  >
    {children}
  </div>
);

const ResizablePanel = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  [key: string]: unknown;
}) => (
  <div className={cn("flex-1 overflow-auto", className)} {...props}>
    {children}
  </div>
);

const ResizableHandle = ({
  withHandle,
  className,
}: {
  withHandle?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-border",
      className,
    )}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
