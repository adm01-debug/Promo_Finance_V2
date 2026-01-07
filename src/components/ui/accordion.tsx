import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Plus, Minus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

// ============================================================================
// ACCORDION BASE
// ============================================================================

const Accordion = AccordionPrimitive.Root;

// ============================================================================
// ACCORDION ITEM COM VARIANTES
// ============================================================================

interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  variant?: "default" | "bordered" | "ghost" | "card";
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "border-b",
    bordered: "border rounded-lg mb-2 overflow-hidden",
    ghost: "mb-1",
    card: "border rounded-lg mb-3 shadow-sm bg-card overflow-hidden",
  };

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

// ============================================================================
// ACCORDION TRIGGER COM ÍCONES PERSONALIZADOS
// ============================================================================

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  icon?: "chevron" | "plus" | "arrow";
  iconPosition?: "left" | "right";
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, icon = "chevron", iconPosition = "right", ...props }, ref) => {
  const IconComponent = {
    chevron: ChevronDown,
    plus: Plus,
    arrow: ChevronRight,
  }[icon];

  const iconElement = (
    <motion.div
      className="shrink-0"
      initial={false}
    >
      <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" />
    </motion.div>
  );

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center gap-3 py-4 px-1 font-medium transition-all",
          "hover:text-primary",
          "[&[data-state=open]>div>svg]:rotate-180",
          icon === "plus" && "[&[data-state=open]>div>svg]:rotate-45",
          icon === "arrow" && "[&[data-state=open]>div>svg]:rotate-90",
          iconPosition === "left" ? "justify-start" : "justify-between",
          className,
        )}
        {...props}
      >
        {iconPosition === "left" && iconElement}
        <span className="flex-1 text-left">{children}</span>
        {iconPosition === "right" && iconElement}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

// ============================================================================
// ACCORDION CONTENT ANIMADO
// ============================================================================

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("pb-4 pt-0 px-1", className)}
    >
      {children}
    </motion.div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// ============================================================================
// FAQ ACCORDION - Componente pronto para FAQs
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
  id?: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  variant?: "default" | "bordered" | "card";
  defaultOpen?: string;
  className?: string;
}

const FAQAccordion = ({
  items,
  variant = "bordered",
  defaultOpen,
  className,
}: FAQAccordionProps) => {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen}
      className={cn("w-full", className)}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.id || index}
          value={item.id || `item-${index}`}
          variant={variant}
        >
          <AccordionTrigger className="text-left">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

// ============================================================================
// ANIMATED ACCORDION GROUP - Com animações stagger
// ============================================================================

interface AnimatedAccordionGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

const AnimatedAccordionGroup = ({
  children,
  className,
  staggerDelay = 0.1,
}: AnimatedAccordionGroupProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ============================================================================
// NESTED ACCORDION - Accordion aninhado
// ============================================================================

interface NestedAccordionItem {
  id: string;
  title: string;
  content?: React.ReactNode;
  children?: NestedAccordionItem[];
}

interface NestedAccordionProps {
  items: NestedAccordionItem[];
  level?: number;
  className?: string;
}

const NestedAccordion = ({
  items,
  level = 0,
  className,
}: NestedAccordionProps) => {
  return (
    <Accordion type="multiple" className={cn("w-full", className)}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          variant="ghost"
          className={cn(level > 0 && "ml-4 border-l pl-4")}
        >
          <AccordionTrigger icon="arrow" iconPosition="left">
            {item.title}
          </AccordionTrigger>
          <AccordionContent>
            {item.content}
            {item.children && item.children.length > 0 && (
              <NestedAccordion items={item.children} level={level + 1} />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  FAQAccordion,
  AnimatedAccordionGroup,
  NestedAccordion,
};
