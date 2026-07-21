import type { ChangeEvent } from 'react';
import { AlertCircle, Camera, Layers, Layout, Loader2, Maximize2, Palette, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceholderView } from './helpers';
import type { ViewMode } from './types';

interface Props {
  referenceImage: string | null;
  currentScreenshot: string | null;
  diffImage: string | null;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  overlayOpacity: number;
  setOverlayOpacity: (n: number) => void;
  heatmapIntensity: number;
  setHeatmapIntensity: (n: number) => void;
  splitPosition: number;
  setSplitPosition: (n: number) => void;
  isProcessing: boolean;
  onCapture: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function RegressionTab({
  referenceImage, currentScreenshot, diffImage, viewMode, setViewMode,
  overlayOpacity, setOverlayOpacity, heatmapIntensity, setHeatmapIntensity,
  splitPosition, setSplitPosition, isProcessing, onCapture, onFileChange,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card/5 border-white/5 premium-card">
          <CardHeader className="p-4"><CardTitle className="text-sm text-foreground">Referência</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="aspect-video rounded-lg bg-black border border-border flex items-center justify-center overflow-hidden relative group">
              {referenceImage ? <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" /> : <Layers className="h-8 w-8 text-foreground/10" />}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-card text-card-foreground px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
                  Upload Ref
                  <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/5 border-white/5 premium-card">
          <CardHeader className="p-4"><CardTitle className="text-sm text-foreground">Atual</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="aspect-video rounded-lg bg-black border border-border flex items-center justify-center overflow-hidden relative group">
              {currentScreenshot ? <img src={currentScreenshot} alt="Current" className="w-full h-full object-cover" /> : <Camera className="h-8 w-8 text-foreground/10" />}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" onClick={onCapture} disabled={isProcessing} className="bg-card text-card-foreground hover:bg-card/90">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Capturar Agora'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/5 border-white/5 premium-card">
          <CardHeader className="p-4"><CardTitle className="text-sm text-foreground">Ferramentas de Comparação</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Button variant={viewMode === 'side-by-side' ? 'default' : 'outline'} onClick={() => setViewMode('side-by-side')} className="justify-start gap-2 h-9 text-xs"><Layout className="h-4 w-4" /> Lado a Lado</Button>
              <Button variant={viewMode === 'overlay' ? 'default' : 'outline'} onClick={() => setViewMode('overlay')} className="justify-start gap-2 h-9 text-xs"><Layers className="h-4 w-4" /> Overlay Heatmap</Button>
              <Button variant={viewMode === 'diff' ? 'default' : 'outline'} onClick={() => setViewMode('diff')} className="justify-start gap-2 h-9 text-xs"><Palette className="h-4 w-4" /> Heatmap de Desvios</Button>
              <Button variant={viewMode === 'split' ? 'default' : 'outline'} onClick={() => setViewMode('split')} className="justify-start gap-2 h-9 text-xs"><Maximize2 className="h-4 w-4" /> Split View Slider</Button>
              <Button variant={viewMode === 'heatmap' ? 'default' : 'outline'} onClick={() => setViewMode('heatmap')} className="justify-start gap-2 h-9 text-xs"><Zap className="h-4 w-4" /> Heatmap Avançado</Button>
              <div className="pt-2">
                <p className="text-caption mb-2">Ajuste de Intensidade / Opacidade</p>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={viewMode === 'heatmap' ? heatmapIntensity : overlayOpacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (viewMode === 'heatmap') setHeatmapIntensity(val);
                    else setOverlayOpacity(val);
                  }}
                  className="w-full h-1 bg-card/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border border-white/5 rounded-2xl bg-black p-4 min-h-[400px]">
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="space-y-2">
              <Badge variant="outline" className="text-[10px] uppercase">Referência</Badge>
              <div className="border border-border rounded-xl overflow-hidden aspect-video">
                {referenceImage ? <img src={referenceImage} className="w-full" alt="Reference" /> : <PlaceholderView />}
              </div>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="text-[10px] uppercase">Interface Atual</Badge>
              <div className="border border-border rounded-xl overflow-hidden aspect-video">
                {currentScreenshot ? <img src={currentScreenshot} className="w-full" alt="Current" /> : <PlaceholderView />}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'overlay' && (
          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-zinc-900">
            {currentScreenshot && <img src={currentScreenshot} className="absolute inset-0 w-full" alt="Actual" />}
            {referenceImage && (
              <img src={referenceImage} className="absolute inset-0 w-full transition-opacity duration-200"
                style={{ opacity: overlayOpacity, mixBlendMode: 'difference', filter: 'invert(1)' }} alt="Diff overlay" />
            )}
            {!currentScreenshot && !referenceImage && <PlaceholderView />}
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground/60">
              Modo Diferença: Transparência em 0 indica pixels idênticos
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-zinc-900 group select-none">
            <div className="absolute inset-0 w-full h-full">
              {currentScreenshot ? <img src={currentScreenshot} className="w-full h-full object-cover" alt="Actual" /> : <PlaceholderView />}
            </div>
            <div className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-primary z-10" style={{ width: `${splitPosition}%` }}>
              {referenceImage ? (
                <img src={referenceImage} className="h-full object-cover" style={{ width: `${100 / (splitPosition / 100)}%`, maxWidth: 'none' }} alt="Reference" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Layers className="h-8 w-8 text-foreground/20" /></div>
              )}
            </div>
            <div className="absolute inset-y-0 z-20 w-1 bg-primary cursor-col-resize group-active:scale-x-150 transition-transform" style={{ left: `${splitPosition}%` }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-foreground flex items-center justify-center shadow-2xl">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>
            <input type="range" min="0" max="100" value={splitPosition} onChange={(e) => setSplitPosition(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-30" />
            <div className="absolute top-4 left-4 z-40 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-caption border border-border">Referência</div>
            <div className="absolute top-4 right-4 z-40 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-caption border border-border">Atual</div>
          </div>
        )}

        {viewMode === 'diff' && (
          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-zinc-900 flex items-center justify-center">
            {currentScreenshot && <img src={currentScreenshot} className="absolute inset-0 w-full opacity-30" alt="Base" />}
            {diffImage ? (
              <img src={diffImage} className="absolute inset-0 w-full z-10" alt="Heatmap diff" />
            ) : (
              <div className="text-center p-8">
                <AlertCircle className="h-12 w-12 text-foreground/10 mx-auto mb-4" />
                <p className="text-foreground/40 text-sm">Capture o screenshot atual e carregue uma referência para gerar o heatmap.</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 text-[10px] text-primary font-bold">
              MAGENTA = DESVIO DETECTADO
            </div>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-zinc-950 flex items-center justify-center">
            {currentScreenshot && <img src={currentScreenshot} className="absolute inset-0 w-full opacity-40 grayscale" alt="Base" />}
            {diffImage ? (
              <div className="absolute inset-0 z-10" style={{ filter: 'blur(8px) contrast(2) brightness(1.5)' }}>
                <img src={diffImage} className="w-full h-full object-contain mix-blend-screen" style={{ opacity: heatmapIntensity }} alt="Heatmap overlay" />
              </div>
            ) : (
              <div className="text-center p-8">
                <Zap className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                <p className="text-foreground/40 text-sm">Aguardando dados de comparação para gerar heatmap térmico.</p>
              </div>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
              <div className="flex items-center gap-2">
                <div className="h-2 w-10 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full" />
                <span className="text-[10px] text-foreground/40 font-bold">GRADIENTE DE DESVIO</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
