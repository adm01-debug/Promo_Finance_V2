/**
 * Interactive Button - Enhanced Button with feedback
 * 
 * Re-exports AnimatedButton with sensible defaults for the app
 */

import { forwardRef, ComponentProps } from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';

type AnimatedButtonProps = ComponentProps<typeof AnimatedButton>;

interface InteractiveButtonProps extends Omit<AnimatedButtonProps, 'hapticFeedback' | 'soundFeedback'> {
  withSound?: boolean;
  withHaptic?: boolean;
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ withSound = false, withHaptic = true, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        hapticFeedback={withHaptic ? 'light' : false}
        soundFeedback={withSound ? 'click' : false}
        {...props}
      />
    );
  }
);

InteractiveButton.displayName = 'InteractiveButton';

// Pre-configured variants
export const PrimaryActionButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  (props, ref) => (
    <InteractiveButton
      ref={ref}
      withSound
      withHaptic
      showSuccessState
      variant="default"
      {...props}
    />
  )
);

PrimaryActionButton.displayName = 'PrimaryActionButton';

export const DangerButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  (props, ref) => (
    <InteractiveButton
      ref={ref}
      withHaptic
      variant="destructive"
      {...props}
    />
  )
);

DangerButton.displayName = 'DangerButton';

export default InteractiveButton;
