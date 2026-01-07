import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

// ============================================================================
// CARD BASE
// ============================================================================

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

// ============================================================================
// INTERACTIVE CARD - Com hover effects
// ============================================================================

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: "lift" | "glow" | "border" | "scale" | "tilt";
  clickable?: boolean;
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ className, hoverEffect = "lift", clickable = true, children, ...props }, ref) => {
    const effects = {
      lift: "hover:-translate-y-1 hover:shadow-lg",
      glow: "hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50",
      border: "hover:border-primary",
      scale: "hover:scale-[1.02]",
      tilt: "", // Handled by motion
    };

    if (hoverEffect === "tilt") {
      return (
        <TiltCard ref={ref} className={className} clickable={clickable} {...props}>
          {children}
        </TiltCard>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
          effects[hoverEffect],
          clickable && "cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
InteractiveCard.displayName = "InteractiveCard";

// ============================================================================
// TILT CARD - Efeito 3D
// ============================================================================

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tiltAmount?: number;
  clickable?: boolean;
}

const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ className, tiltAmount = 10, clickable = true, children, onClick, ...props }, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${tiltAmount}deg`, `-${tiltAmount}deg`]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${tiltAmount}deg`, `${tiltAmount}deg`]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateY,
          rotateX,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          clickable && "cursor-pointer",
          className,
        )}
      >
        <div style={{ transform: "translateZ(20px)" }}>{children}</div>
      </motion.div>
    );
  },
);
TiltCard.displayName = "TiltCard";

// ============================================================================
// FLIP CARD - Cartão com frente e verso
// ============================================================================

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  flipOnHover?: boolean;
}

const FlipCard = ({ front, back, className, flipOnHover = true }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <div
      className={cn("perspective-1000 cursor-pointer", className)}
      onClick={() => !flipOnHover && setIsFlipped(!isFlipped)}
      onMouseEnter={() => flipOnHover && setIsFlipped(true)}
      onMouseLeave={() => flipOnHover && setIsFlipped(false)}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 rounded-lg border bg-card text-card-foreground shadow-sm backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 rounded-lg border bg-card text-card-foreground shadow-sm"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// GRADIENT CARD
// ============================================================================

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: "primary" | "success" | "warning" | "danger" | "rainbow";
  animated?: boolean;
}

const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ className, gradient = "primary", animated = false, children, ...props }, ref) => {
    const gradients = {
      primary: "from-primary/20 to-primary/5",
      success: "from-green-500/20 to-green-500/5",
      warning: "from-yellow-500/20 to-yellow-500/5",
      danger: "from-destructive/20 to-destructive/5",
      rainbow: "from-pink-500/20 via-purple-500/20 to-blue-500/20",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-gradient-to-br text-card-foreground shadow-sm",
          gradients[gradient],
          animated && "animate-gradient-x bg-[length:200%_200%]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GradientCard.displayName = "GradientCard";

// ============================================================================
// SPOTLIGHT CARD - Efeito de spotlight no hover
// ============================================================================

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
}

const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ className, spotlightColor = "hsl(var(--primary))", children, ...props }, ref) => {
    const divRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current) return;
      const rect = divRef.current.getBoundingClientRect();
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
          className,
        )}
        {...props}
      >
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}15, transparent 40%)`,
          }}
        />
        {children}
      </div>
    );
  },
);
SpotlightCard.displayName = "SpotlightCard";

// ============================================================================
// ANIMATED CARD STACK
// ============================================================================

interface CardStackProps {
  cards: React.ReactNode[];
  className?: string;
}

const CardStack = ({ cards, className }: CardStackProps) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className={cn("relative h-64", className)}>
      {cards.map((card, index) => {
        const isActive = index === activeIndex;
        const offset = index - activeIndex;

        return (
          <motion.div
            key={index}
            initial={false}
            animate={{
              scale: isActive ? 1 : 1 - Math.abs(offset) * 0.05,
              y: offset * 10,
              zIndex: cards.length - Math.abs(offset),
              opacity: 1 - Math.abs(offset) * 0.2,
            }}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "absolute inset-0 rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer",
              isActive && "shadow-lg",
            )}
            style={{ originY: 0 }}
          >
            {card}
          </motion.div>
        );
      })}
    </div>
  );
};

// ============================================================================
// STATS CARD
// ============================================================================

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, description, icon, trend, className }: StatsCardProps) => {
  return (
    <InteractiveCard hoverEffect="lift" className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            {value}
          </motion.p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-green-500" : "text-destructive",
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </motion.div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </InteractiveCard>
  );
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  InteractiveCard,
  TiltCard,
  FlipCard,
  GradientCard,
  SpotlightCard,
  CardStack,
  StatsCard,
};
