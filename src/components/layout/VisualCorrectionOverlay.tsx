import React from 'react';
import { PixelPerfectOverlay } from '@/components/design-system-debug/PixelPerfectOverlay';

export const VisualCorrectionOverlay = () => {
  const params = new URLSearchParams(window.location.search);

  // Renderiza somente quando explicitamente solicitado para evitar contaminar a UI do app.
  if (!params.has('visualDebug')) {
    return null;
  }

  return <PixelPerfectOverlay />;
};
