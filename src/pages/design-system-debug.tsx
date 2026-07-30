import { DesignSystemAudit } from '@/components/design-system-debug/DesignSystemAudit';
import { PixelPerfectOverlay } from '@/components/design-system-debug/PixelPerfectOverlay';

export default function DesignSystemDebugPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <DesignSystemAudit />
      <PixelPerfectOverlay />
    </div>
  );
}
