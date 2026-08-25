import { cva } from "class-variance-authority";

export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-vela-sm bg-bg-1 px-4 py-2 text-sm font-medium transition-colors hover:bg-acc-soft hover:text-t0 focus:bg-acc-soft focus:text-t0 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-acc/10 data-[state=open]:bg-acc/10",
);
