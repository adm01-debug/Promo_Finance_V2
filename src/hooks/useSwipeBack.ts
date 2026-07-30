import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeBackOptions {
  /** Minimum swipe distance in pixels to trigger navigation */
  threshold?: number;
  /** Edge zone width in pixels where swipe can start */
  edgeWidth?: number;
  /** Whether swipe back is enabled */
  enabled?: boolean;
}

export function useSwipeBack({
  threshold = 80,
  edgeWidth = 30,
  enabled = true,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isEdgeSwipe = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    // Only trigger from left edge
    if (touch.clientX <= edgeWidth) {
      isEdgeSwipe.current = true;
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  }, [enabled, edgeWidth]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !isEdgeSwipe.current || !touchStart.current) {
      isEdgeSwipe.current = false;
      touchStart.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);
    const elapsed = Date.now() - touchStart.current.time;

    // Must be a horizontal swipe (not vertical scroll)
    if (deltaX > threshold && deltaY < deltaX * 0.5 && elapsed < 500) {
      if (location.pathname !== '/' && location.pathname !== '/dashboard') {
        if (window.history.length > 2) {
          navigate(-1);
        } else {
          navigate('/');
        }
      }
    }

    isEdgeSwipe.current = false;
    touchStart.current = null;
  }, [enabled, threshold, navigate, location.pathname]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}
