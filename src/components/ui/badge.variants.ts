import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-vela-sm border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-acc focus:ring-offset-bg-1 active:scale-95",

  {
    variants: {
      variant: {
        default: "border-transparent bg-acc text-t0 shadow-lg shadow-acc/20 font-black",
        secondary: "border-transparent bg-bg-3/50 backdrop-blur-sm text-t1 shadow-sm font-bold",
        destructive: "border-transparent bg-bad-soft text-bad shadow-none font-black ring-1 ring-bad/20",
        outline: "border-line text-t0 bg-bg-3/50 font-bold",
        success: "border-transparent bg-ok-soft text-ok font-black ring-1 ring-ok/20",
        warning: "border-transparent bg-warn-soft text-warn font-black ring-1 ring-warn/20",
        info: "border-transparent bg-info-soft text-info font-black ring-1 ring-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
