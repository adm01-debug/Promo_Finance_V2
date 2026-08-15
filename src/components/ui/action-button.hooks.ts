import * as React from 'react';
import type { ActionState } from './action-button';

// Hook for managing action state with auto-reset
export function useActionState(resetDelay = 2000) {
  const [state, setState] = React.useState<ActionState>('idle');

  const setLoading = () => setState('loading');
  const setSuccess = () => {
    setState('success');
    setTimeout(() => setState('idle'), resetDelay);
  };
  const setError = () => {
    setState('error');
    setTimeout(() => setState('idle'), resetDelay);
  };
  const reset = () => setState('idle');

  return { state, setLoading, setSuccess, setError, reset };
}
