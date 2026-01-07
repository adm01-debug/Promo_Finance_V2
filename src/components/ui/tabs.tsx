import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

import { cn } from "@/lib/utils";

// ============================================================================
// TABS BASE
// ============================================================================

const Tabs = TabsPrimitive.Root;

// ============================================================================
// TABS LIST COM VARIANTES
// ============================================================================

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "underline" | "bordered";
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-muted p-1 rounded-md",
    pills: "bg-transparent gap-2",
    underline: "bg-transparent border-b rounded-none p-0 gap-4",
    bordered: "bg-transparent border rounded-lg p-1",
  };

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center text-muted-foreground",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

// ============================================================================
// TABS TRIGGER COM VARIANTES E ANIMAÇÃO
// ============================================================================

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills" | "underline" | "bordered";
  icon?: React.ReactNode;
  badge?: string | number;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "default", icon, badge, children, ...props }, ref) => {
  const variants = {
    default: [
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "rounded-sm px-3 py-1.5",
    ].join(" "),
    pills: [
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      "rounded-full px-4 py-1.5 hover:bg-muted",
    ].join(" "),
    underline: [
      "data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary",
      "rounded-none px-1 pb-3 -mb-px hover:text-foreground",
    ].join(" "),
    bordered: [
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:shadow-sm",
      "rounded-md px-3 py-1.5",
    ].join(" "),
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
        "ring-offset-background transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {badge !== undefined && (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium">
          {badge}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// ============================================================================
// TABS CONTENT ANIMADO
// ============================================================================

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  animation?: "fade" | "slide" | "scale" | "none";
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, animation = "fade", children, ...props }, ref) => {
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };

  const selectedAnimation = animations[animation];

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      <motion.div
        initial={selectedAnimation.initial}
        animate={selectedAnimation.animate}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Content>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

// ============================================================================
// ANIMATED TABS - Com indicador animado
// ============================================================================

interface AnimatedTabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode; content: React.ReactNode }[];
  defaultValue?: string;
  variant?: "default" | "pills" | "underline";
  className?: string;
  contentClassName?: string;
}

const AnimatedTabs = ({
  tabs,
  defaultValue,
  variant = "default",
  className,
  contentClassName,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      <LayoutGroup>
        <TabsList variant={variant}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              variant={variant}
              icon={tab.icon}
              className="relative"
            >
              {tab.label}
              {activeTab === tab.value && variant === "default" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-background rounded-sm shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        {tabs.map((tab) =>
          activeTab === tab.value ? (
            <TabsContent
              key={tab.value}
              value={tab.value}
              animation="fade"
              className={contentClassName}
              forceMount
            >
              {tab.content}
            </TabsContent>
          ) : null,
        )}
      </AnimatePresence>
    </Tabs>
  );
};

// ============================================================================
// VERTICAL TABS
// ============================================================================

interface VerticalTabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode; content: React.ReactNode }[];
  defaultValue?: string;
  className?: string;
}

const VerticalTabs = ({ tabs, defaultValue, className }: VerticalTabsProps) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      orientation="vertical"
      className={cn("flex gap-6", className)}
    >
      <TabsList className="flex-col h-auto bg-transparent gap-1 items-stretch">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "justify-start px-4 py-2 text-left",
              "data-[state=active]:bg-muted data-[state=active]:text-foreground",
              "hover:bg-muted/50",
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {tabs.map((tab) =>
            activeTab === tab.value ? (
              <TabsContent key={tab.value} value={tab.value} animation="slide" forceMount>
                {tab.content}
              </TabsContent>
            ) : null,
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  );
};

// ============================================================================
// SCROLLABLE TABS
// ============================================================================

interface ScrollableTabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const ScrollableTabs = ({ tabs, value, onValueChange, className }: ScrollableTabsProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-8 py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              value === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  AnimatedTabs,
  VerticalTabs,
  ScrollableTabs,
};
