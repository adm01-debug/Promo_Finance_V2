import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-vela-sm text-sm font-medium ring-offset-bg-1 transition-colors hover:bg-bg-3 hover:text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc focus-visible:ring-offset-bg-1 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-acc data-[state=on]:text-t0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-line bg-transparent hover:bg-acc-soft hover:text-t0",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
