import type { ComponentType } from 'react';
import { PermissionGate } from './PermissionGate';

// HOC version for wrapping components
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  permission: string
) {
  return function PermissionWrapper(props: P) {
    return (
      <PermissionGate permission={permission} showFallback>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}
