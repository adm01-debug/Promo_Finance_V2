import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Camera, Layers, Monitor, Tablet, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface PixelPerfectOverlayProps {
  referenceImageUrl?: string;
}

export const PixelPerfectOverlay = ({ referenceImageUrl }: PixelPerfectOverlayProps) => {
  const [opacity, setOpacity] = useState([50]);
  const [isVisible, setIsVisible] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState(referenceImageUrl || '');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOverlayUrl(url);
      setIsVisible(true);
      toast.success("Reference image loaded");
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <>
      {/* Overlay Control Panel */}
      <div className="fixed bottom-6 right-6 z-[9999] bg-white border shadow-2xl rounded-xl p-4 w-80 space-y-4 pointer-events-auto">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Visual Comparator</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsVisible(!isVisible)}
            title={isVisible ? "Hide Overlay" : "Show Overlay"}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reference Image</Label>
            {!overlayUrl ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileUpload}
                  accept="image/*"
                />
                <Camera className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Upload reference design</p>
              </div>
            ) : (
              <div className="flex items-center justify-between space-x-2">
                <div className="text-xs truncate max-w-[150px] font-mono bg-muted p-1 rounded">Ref: Loaded</div>
                <Button variant="outline" size="sm" onClick={() => setOverlayUrl('')} className="text-[10px] h-7">Clear</Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Opacity ({opacity}%)</Label>
            </div>
            <Slider 
              value={opacity} 
              onValueChange={setOpacity} 
              max={100} 
              step={1}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
             <Label className="text-xs uppercase tracking-wider text-muted-foreground">Breakpoints</Label>
             <div className="flex justify-between gap-1">
                <Button 
                  variant={viewport === 'desktop' ? 'default' : 'outline'} 
                  size="icon" 
                  className="flex-1 h-8"
                  onClick={() => setViewport('desktop')}
                ><Monitor className="w-3 h-3" /></Button>
                <Button 
                  variant={viewport === 'tablet' ? 'default' : 'outline'} 
                  size="icon" 
                  className="flex-1 h-8"
                  onClick={() => setViewport('tablet')}
                ><Tablet className="w-3 h-3" /></Button>
                <Button 
                  variant={viewport === 'mobile' ? 'default' : 'outline'} 
                  size="icon" 
                  className="flex-1 h-8"
                  onClick={() => setViewport('mobile')}
                ><Smartphone className="w-3 h-3" /></Button>
             </div>
          </div>
        </div>
      </div>

      {/* Actual Overlay */}
      {isVisible && overlayUrl && (
        <div 
          className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden flex justify-center"
          style={{ 
            opacity: opacity[0] / 100,
            mixBlendMode: 'difference',
            filter: 'invert(1)' // Heatmap-like effect for pixel differences
          }}
        >
          <div 
            className="h-full bg-no-repeat bg-top bg-contain shadow-2xl border-x"
            style={{ 
              backgroundImage: `url(${overlayUrl})`,
              width: getViewportWidth(),
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
          />
        </div>
      )}
    </>
  );
};
