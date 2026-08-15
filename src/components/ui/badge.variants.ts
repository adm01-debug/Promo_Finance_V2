import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-95",

  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-black",
        secondary: "border-transparent bg-secondary/50 backdrop-blur-sm text-secondary-foreground shadow-sm font-bold",
        destructive: "border-transparent bg-destructive/10 text-destructive shadow-none font-black ring-1 ring-destructive/20",
        outline: "border-border/50 text-foreground bg-background/50 font-bold",
        success: "border-transparent bg-success/10 text-success font-black ring-1 ring-success/20",
        warning: "border-transparent bg-warning/10 text-warning font-black ring-1 ring-warning/20",
        info: "border-transparent bg-info/10 text-info font-black ring-1 ring-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
