import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-vela-md text-sm font-semibold ring-offset-bg-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc focus-visible:ring-offset-bg-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] duration-200",
  {
    variants: {
      variant: {
        default: "bg-acc text-t0 hover:bg-acc-2 hover:shadow-xl hover:shadow-acc/30",
        destructive: "bg-bad text-t0 hover:bg-bad/90 hover:shadow-lg hover:shadow-bad/20",
        outline: "border border-line bg-bg-3/50 backdrop-blur-sm hover:bg-acc-soft hover:text-0 hover:border-acc/30 hover:shadow-lg",
        secondary: "bg-bg-3/50 backdrop-blur-sm text-t0 hover:bg-bg-2 hover:shadow-md",
        ghost: "hover:bg-acc-soft hover:text-acc active:bg-acc/20",
        link: "text-acc underline-offset-4 hover:underline",
        success: "bg-ok text-t0 hover:bg-ok/90 hover:shadow-lg hover:shadow-ok/20",
        warning: "bg-warn text-t0 hover:bg-warn/90 hover:shadow-lg hover:shadow-warn/20",
        premium: "bg-acc text-t0 hover:bg-acc-2 hover:shadow-2xl hover:shadow-acc/40 hover:-translate-y-0.5 border border-acc/20",
        glow: "bg-acc text-t0 shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_30px_rgba(124,92,255,0.6)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-vela-sm px-3",
        lg: "h-11 rounded-vela-lg px-8",
        xl: "h-12 rounded-vela-xl px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
