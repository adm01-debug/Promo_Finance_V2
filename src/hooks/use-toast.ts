import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

// ============================================================================
// TIPOS
// ============================================================================

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration: number = TOAST_REMOVE_DELAY) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId));
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, duration);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId, 300);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, 300);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

// ============================================================================
// TOAST PRINCIPAL
// ============================================================================

function toast({ duration = TOAST_REMOVE_DELAY, ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Auto dismiss
  addToRemoveQueue(id, duration);

  return {
    id: id,
    dismiss,
    update,
  };
}

// ============================================================================
// HELPERS DE TOAST
// ============================================================================

toast.success = (title: string, description?: string) => {
  return toast({
    title,
    description,
    className: "border-green-500/50 bg-green-50 dark:bg-green-950/50",
  });
};

toast.error = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "destructive",
  });
};

toast.warning = (title: string, description?: string) => {
  return toast({
    title,
    description,
    className: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/50",
  });
};

toast.info = (title: string, description?: string) => {
  return toast({
    title,
    description,
    className: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/50",
  });
};

toast.loading = (title: string, description?: string) => {
  return toast({
    title,
    description,
    duration: 100000, // Long duration for loading
  });
};

toast.promise = async <T,>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: Error) => string);
  },
): Promise<T> => {
  const toastInstance = toast.loading(loading);

  try {
    const result = await promise;
    toastInstance.update({
      id: toastInstance.id,
      title: typeof success === "function" ? success(result) : success,
      className: "border-green-500/50 bg-green-50 dark:bg-green-950/50",
    } as ToasterToast);
    addToRemoveQueue(toastInstance.id, 3000);
    return result;
  } catch (caughtError: unknown) {
    toastInstance.update({
      id: toastInstance.id,
      title: typeof error === "function" ? error(caughtError as Error) : error,
      variant: "destructive",
    } as ToasterToast);
    addToRemoveQueue(toastInstance.id, 5000);
    throw caughtError;
  }
};

// ============================================================================
// HOOK
// ============================================================================

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
