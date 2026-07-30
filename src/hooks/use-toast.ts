import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

/**
 * Adapter compatível com a API antiga (shadcn/radix `useToast`) delegando ao
 * sonner — o único <Toaster /> montado no App. Mantém os call-sites
 * `toast({ title, description, variant })` funcionando com renderização real.
 */

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
  duration?: number;
};

function toast({ title, description, variant, duration }: ToastInput) {
  const show = variant === 'destructive' ? sonnerToast.error : sonnerToast;
  const id = show(title ?? '', { description, duration });

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToastInput) => {
      const showNext = next.variant === 'destructive' ? sonnerToast.error : sonnerToast;
      showNext(next.title ?? '', { id, description: next.description, duration: next.duration });
    },
  };
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  };
}

export { useToast, toast };
