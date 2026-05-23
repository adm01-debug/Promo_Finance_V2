import React from 'react';
import { PixelPerfectOverlay } from '@/components/design-system-debug/PixelPerfectOverlay';

export const VisualCorrectionOverlay = () => {
  // Only render in development or if a specific flag is set
  if (process.env.NODE_ENV !== 'development' && !window.location.search.includes('debug=true')) {
    return null;
  }

  return <PixelPerfectOverlay />;
};
