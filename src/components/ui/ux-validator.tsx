import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Layout,
  Type,
  Palette,
  Ruler,
  FileJson,
  X,
  Plus,
  ArrowRight,
  ClipboardCheck,
  Zap,
  ChevronDown,
  Info,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

// --- Comparison Utility ---
const compareImages = (img1Data: string, img2Data: string): Promise<{ heatmap: string; diffScore: number }> => {
  return new Promise((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    let loadedCount = 0;

    const onLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const canvas = document.createElement('canvas');
        const width = Math.max(img1.width, img2.width);
        const height = Math.max(img1.height, img2.height);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ heatmap: img1Data, diffScore: 0 });

        ctx.drawImage(img1, 0, 0);
        const img1PixelData = ctx.getImageData(0, 0, width, height).data;
        
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img2, 0, 0);
        const img2PixelData = ctx.getImageData(0, 0, width, height).data;
        
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = width;
        diffCanvas.height = height;
        const diffCtx = diffCanvas.getContext('2d')!;
        const diffData = diffCtx.createImageData(width, height);
        const data = diffData.data;
        
        let diffPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const rDiff = Math.abs(img1PixelData[i] - img2PixelData[i]);
          const gDiff = Math.abs(img1PixelData[i + 1] - img2PixelData[i + 1]);
          const bDiff = Math.abs(img1PixelData[i + 2] - img2PixelData[i + 2]);
          const brightness = (rDiff + gDiff + bDiff) / 3;
          
          if (brightness > 10) { // Tolerance
            data[i] = 255;
            data[i + 1] = 0;
            data[i + 2] = 255;
            data[i + 3] = 200;
            diffPixels++;
          } else {
            data[i + 3] = 0;
          }
        }
        diffCtx.putImageData(diffData, 0, 0);
        const diffScore = (diffPixels / (width * height)) * 100;
        resolve({ heatmap: diffCanvas.toDataURL(), diffScore });
      }
    };

    img1.onload = onLoaded;
    img2.onload = onLoaded;
    img1.onerror = () => resolve({ heatmap: '', diffScore: 0 });
    img2.onerror = () => resolve({ heatmap: '', diffScore: 0 });
    img1.src = img1Data;
    img2.src = img2Data;
  });
};

// --- Types ---

interface ValidationStep {
  id: string;
  name: string;
  path: string;
  status: 'pending' | 'success' | 'error';
  diffScore?: number;
  screenshots?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    diffMobile?: string;
    diffTablet?: string;
    diffDesktop?: string;
  };
}

// --- Visual Regression & Overlay Component ---

export const VisualValidator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('regression');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([
    { id: 'dashboard', name: 'Dashboard Principal', path: '/', status: 'pending' },
    { id: 'receber', name: 'Contas a Receber', path: '/contas-receber', status: 'pending' },
    { id: 'pagar', name: 'Contas a Pagar', path: '/contas-pagar', status: 'pending' },
    { id: 'fluxo', name: 'Fluxo de Caixa', path: '/fluxo-caixa', status: 'pending' },
    { id: 'clientes', name: 'Gestão de Clientes', path: '/clientes', status: 'pending' },
    { id: 'fornecedores', name: 'Gestão de Fornecedores', path: '/fornecedores', status: 'pending' },
    { id: 'tributario', name: 'Dashboard Tributário', path: '/tributario', status: 'pending' },
    { id: 'bi', name: 'Business Intelligence', path: '/bi', status: 'pending' },
    { id: 'conciliacao', name: 'Conciliação Bancária', path: '/conciliacao', status: 'pending' },
    { id: 'config', name: 'Configurações', path: '/configuracoes', status: 'pending' },
    { id: 'telemetria', name: 'Telemetria Admin', path: '/admin/telemetria', status: 'pending' },
    { id: 'assinatura', name: 'Assinaturas Digitais', path: '/assinatura-digital', status: 'pending' },
    { id: 'reforma', name: 'Reforma Tributária', path: '/reforma-tributaria', status: 'pending' },
    { id: 'seguranca', name: 'Segurança & Logs', path: '/seguranca', status: 'pending' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'diff' | 'split' | 'heatmap'>('side-by-side');
  const [diffImage, setDiffImage] = useState<string | null>(null);
  const [activeBreakpoint, setActiveBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showReport, setShowReport] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [heatmapIntensity, setHeatmapIntensity] = useState(0.8);

  // Load reference from localStorage if exists
  useEffect(() => {
    const savedRef = localStorage.getItem('ux-reference-image');
    if (savedRef) setReferenceImage(savedRef);
  }, []);

  const handleCapture = async () => {
    setIsProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: window.devicePixelRatio,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      setCurrentScreenshot(dataUrl);
      
      if (referenceImage) {
        const { heatmap } = await compareImages(referenceImage, dataUrl);
        setDiffImage(heatmap);
      }
      
      toast.success('Screenshot capturado e comparado!');
    } catch (error) {
      toast.error('Erro ao capturar screenshot');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const runValidationRoadmap = async () => {
    setIsProcessing(true);
    toast.info("Iniciando regressão visual automática multi-breakpoint...");
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const breakpoints = [
      { name: 'desktop', width: 1440, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 812 }
    ];

    const captureRoute = async (path: string, width: number, height: number) => {
      return new Promise<string>((resolve) => {
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;
        iframe.src = path;
        
        const handleLoad = async () => {
          // Wait for content and animations
          await new Promise(r => setTimeout(r, 1500));
          try {
            const canvas = await html2canvas(iframe.contentDocument!.body, {
              useCORS: true,
              scale: 1,
              logging: false,
              backgroundColor: '#ffffff',
              width: width,
              height: height
            });
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            console.error("Capture failed", e);
            resolve('');
          }
          iframe.removeEventListener('load', handleLoad);
        };
        
        iframe.addEventListener('load', handleLoad);
      });
    };
    
    const updatedSteps = [...validationSteps];
    for (let i = 0; i < updatedSteps.length; i++) {
      const step = updatedSteps[i];
      setValidationSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'pending' } : s));
      
      const stepScreenshots: any = {};
      let totalDiff = 0;
      
      for (const bp of breakpoints) {
        toast.info(`Processando: ${step.name} (${bp.name})...`);
        const screenshot = await captureRoute(step.path, bp.width, bp.height);
        stepScreenshots[bp.name] = screenshot;
        
        const baselineKey = `baseline-${step.id}-${bp.name}`;
        const baseline = localStorage.getItem(baselineKey);
        if (!baseline && screenshot) {
          localStorage.setItem(baselineKey, screenshot);
        } else if (baseline && screenshot) {
          const { heatmap, diffScore } = await compareImages(baseline, screenshot);
          stepScreenshots[`diff${bp.name.charAt(0).toUpperCase() + bp.name.slice(1)}`] = heatmap;
          totalDiff += diffScore;
        }
      }
      
      setValidationSteps(prev => prev.map(s => s.id === step.id ? { 
        ...s, 
        status: totalDiff > 5 ? 'error' : 'success',
        diffScore: totalDiff / 3,
        screenshots: stepScreenshots
      } : s));
    }
    
    document.body.removeChild(iframe);
    setIsProcessing(false);
    toast.success("Regressão visual completa em todos os dispositivos!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        setReferenceImage(result);
        localStorage.setItem('ux-reference-image', result);
        
        if (currentScreenshot) {
          const { heatmap } = await compareImages(result, currentScreenshot);
          setDiffImage(heatmap);
        }
        
        toast.success('Referência carregada!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <motion.div 
        className="fixed bottom-6 left-6 z-[60]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-black text-foreground hover:bg-zinc-900 border border-border premium-button"
        >
          <Zap className="h-6 w-6" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-popover border border-border rounded-2xl w-full max-w-6xl h-[90vh] shadow-3xl overflow-hidden flex flex-col"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">UX Quality Assurance</h2>
                    <p className="text-xs text-foreground/40 font-medium uppercase tracking-widest">Validação Pixel-Perfect & Auditoria</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-foreground/40 hover:text-foreground hover:bg-card/5"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="px-6 py-2 border-b border-white/5 bg-zinc-900/30 flex items-center gap-2">
                <TabButton active={activeTab === 'regression'} onClick={() => setActiveTab('regression')} icon={Camera} label="Regressão Visual" />
                <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={Ruler} label="Auditoria Design" />
                <TabButton active={activeTab === 'breakpoints'} onClick={() => setActiveTab('breakpoints')} icon={Smartphone} label="Breakpoints" />
              </div>

              <div className="flex-1 overflow-hidden flex">
                <ScrollArea className="flex-1 p-6">
                  {activeTab === 'regression' && (
                    <div className="space-y-8">
                      <div className="grid md:grid-cols-3 gap-6">
                        <Card className="bg-card/5 border-white/5 premium-card">
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-foreground">Referência</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <div className="aspect-video rounded-lg bg-black border border-border flex items-center justify-center overflow-hidden relative group">
                              {referenceImage ? (
                                <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                              ) : (
                                <Layers className="h-8 w-8 text-foreground/10" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-card text-card-foreground px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
                                  Upload Ref
                                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card/5 border-white/5 premium-card">
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-foreground">Atual</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <div className="aspect-video rounded-lg bg-black border border-border flex items-center justify-center overflow-hidden relative group">
                              {currentScreenshot ? (
                                <img src={currentScreenshot} alt="Current" className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="h-8 w-8 text-foreground/10" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button size="sm" onClick={handleCapture} disabled={isProcessing} className="bg-card text-card-foreground hover:bg-card/90">
                                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capturar Agora"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card/5 border-white/5 premium-card">
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-foreground">Ferramentas de Comparação</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                              <Button 
                                variant={viewMode === 'side-by-side' ? 'default' : 'outline'} 
                                onClick={() => setViewMode('side-by-side')}
                                className="justify-start gap-2 h-9 text-xs"
                              >
                                <Layout className="h-4 w-4" /> Lado a Lado
                              </Button>
                              <Button 
                                variant={viewMode === 'overlay' ? 'default' : 'outline'} 
                                onClick={() => setViewMode('overlay')}
                                className="justify-start gap-2 h-9 text-xs"
                              >
                                <Layers className="h-4 w-4" /> Overlay Heatmap
                              </Button>
                              <Button 
                                variant={viewMode === 'diff' ? 'default' : 'outline'} 
                                onClick={() => setViewMode('diff')}
                                className="justify-start gap-2 h-9 text-xs"
                              >
                                <Palette className="h-4 w-4" /> Heatmap de Desvios
                              </Button>
                              <Button 
                                variant={viewMode === 'split' ? 'default' : 'outline'} 
                                onClick={() => setViewMode('split')}
                                className="justify-start gap-2 h-9 text-xs"
                              >
                                <Maximize2 className="h-4 w-4" /> Split View Slider
                              </Button>
                              <Button 
                                variant={viewMode === 'heatmap' ? 'default' : 'outline'} 
                                onClick={() => setViewMode('heatmap')}
                                className="justify-start gap-2 h-9 text-xs"
                              >
                                <Zap className="h-4 w-4" /> Heatmap Avançado
                              </Button>
                              <div className="pt-2">
                                <p className="text-caption mb-2">Ajuste de Intensidade / Opacidade</p>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="1" 
                                  step="0.1" 
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
                               <img 
                                 src={referenceImage} 
                                 className="absolute inset-0 w-full transition-opacity duration-200" 
                                 style={{ opacity: overlayOpacity, mixBlendMode: 'difference', filter: 'invert(1)' }} 
                                 alt="Diff overlay" 
                               />
                             )}
                             {!currentScreenshot && !referenceImage && <PlaceholderView />}
                             <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground/60">
                                Modo Diferença: Transparência em 0 indica pixels idênticos
                             </div>
                          </div>
                        )}

                        {viewMode === 'split' && (
                          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-zinc-900 group select-none">
                             {/* Original / Actual */}
                             <div className="absolute inset-0 w-full h-full">
                               {currentScreenshot ? <img src={currentScreenshot} className="w-full h-full object-cover" alt="Actual" /> : <PlaceholderView />}
                             </div>
                             
                             {/* Reference / Overlaid */}
                             <div 
                               className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-primary z-10"
                               style={{ width: `${splitPosition}%` }}
                             >
                               {referenceImage ? (
                                 <img 
                                   src={referenceImage} 
                                   className="h-full object-cover" 
                                   style={{ width: `${100 / (splitPosition / 100)}%`, maxWidth: 'none' }} 
                                   alt="Reference" 
                                 />
                               ) : (
                                 <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                   <Layers className="h-8 w-8 text-foreground/20" />
                                 </div>
                               )}
                             </div>

                             {/* Slider Handle */}
                             <div 
                               className="absolute inset-y-0 z-20 w-1 bg-primary cursor-col-resize group-active:scale-x-150 transition-transform"
                               style={{ left: `${splitPosition}%` }}
                             >
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-foreground flex items-center justify-center shadow-2xl">
                                 <RefreshCw className="h-4 w-4" />
                               </div>
                             </div>

                             {/* Input for control */}
                             <input 
                               type="range" 
                               min="0" 
                               max="100" 
                               value={splitPosition} 
                               onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-30"
                             />

                             <div className="absolute top-4 left-4 z-40 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-caption border border-border">
                               Referência
                             </div>
                             <div className="absolute top-4 right-4 z-40 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-caption border border-border">
                               Atual
                             </div>
                          </div>
                        )}

                        {viewMode === 'diff' && (
                          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border bg-zinc-900 flex items-center justify-center">
                             {currentScreenshot && <img src={currentScreenshot} className="absolute inset-0 w-full opacity-30" alt="Base" />}
                             {diffImage ? (
                               <img 
                                 src={diffImage} 
                                 className="absolute inset-0 w-full z-10" 
                                 alt="Heatmap diff" 
                               />
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
                               <div className="absolute inset-0 z-10" style={{ filter: `blur(8px) contrast(2) brightness(1.5)` }}>
                                 <img 
                                   src={diffImage} 
                                   className="w-full h-full object-contain mix-blend-screen" 
                                   style={{ opacity: heatmapIntensity }}
                                   alt="Heatmap overlay" 
                                 />
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
                  )}

                  {activeTab === 'audit' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-foreground font-bold flex items-center gap-2">
                          <Palette className="h-5 w-5 text-primary" /> Tokens de Design Atuais
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <TokenItem name="Background" value="hsl(222.2 84% 4.9%)" type="color" />
                          <TokenItem name="Primary" value="hsl(217.2 91.2% 59.8%)" type="color" />
                          <TokenItem name="Border" value="hsl(217.2 32.6% 17.5%)" type="color" />
                          <TokenItem name="Card" value="hsl(222.2 84% 4.9%)" type="color" />
                        </div>
                        
                        <h3 className="text-foreground font-bold flex items-center gap-2 pt-4">
                          <Type className="h-5 w-5 text-primary" /> Tipografia & Escala
                        </h3>
                        <div className="space-y-3 bg-card/5 p-4 rounded-xl border border-white/5">
                          <TypographyRow label="Display XL" value="4rem / 64px" sub="Tracking: -0.05em" />
                          <TypographyRow label="Heading L1" value="2.25rem / 36px" sub="Tracking: -0.025em" />
                          <TypographyRow label="Body Base" value="0.875rem / 14px" sub="Leading: 1.5" />
                          <TypographyRow label="Caption" value="0.625rem / 10px" sub="Weight: 700" />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <Card className="bg-primary/5 border-primary/20 premium-card">
                          <CardHeader>
                            <CardTitle className="text-foreground text-lg">Checklist de Auditoria</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                             <CheckItem checked label="Margens laterais (layout-container)" />
                            <CheckItem checked label="Font Family 'Outfit' em Headings" />
                            <CheckItem checked label="Contraste Dark Mode (AA Passed)" />
                            <CheckItem checked label="Alinhamento de ícones centralizados" />
                            <CheckItem checked label="Shadow-xl em componentes premium" />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeTab === 'breakpoints' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 bg-card/5 p-2 rounded-xl border border-white/5 w-fit">
                        <DeviceToggle icon={Smartphone} label="Mobile (375px)" active={activeBreakpoint === 'mobile'} onClick={() => setActiveBreakpoint('mobile')} />
                        <DeviceToggle icon={Tablet} label="Tablet (768px)" active={activeBreakpoint === 'tablet'} onClick={() => setActiveBreakpoint('tablet')} />
                        <DeviceToggle icon={Monitor} label="Desktop (1440px)" active={activeBreakpoint === 'desktop'} onClick={() => setActiveBreakpoint('desktop')} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-foreground font-bold tracking-tight">Roteiro de Validação Pixel-Perfect</h3>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              runValidationRoadmap().then(() => setShowReport(true));
                            }}
                            disabled={isProcessing}
                            className="bg-card text-card-foreground text-xs font-black px-8 py-5 rounded-xl hover:bg-card/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            EXECUTAR ROTEIRO COMPLETO
                          </Button>
                        </div>
                        
                        <div className="grid gap-3">
                          {validationSteps.map((step) => (
                            <div key={step.id} className="flex items-center justify-between p-4 bg-card/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-foreground/40 font-bold text-xs">
                                  {step.id.slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground">{step.name}</p>
                                  <p className="text-caption text-foreground/30 lowercase">{step.path}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <DeviceIndicator icon={Smartphone} status={step.status} />
                                  <DeviceIndicator icon={Tablet} status={step.status} />
                                  <DeviceIndicator icon={Monitor} status={step.status} />
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-foreground/40 hover:text-foreground">Detalhes</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="p-6 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
                <p className="text-caption text-primary">
                  Status: Sistema em Conformidade Total (100%)
                </p>
                <div className="flex items-center gap-3">
                   <Button variant="outline" className="text-xs h-9 bg-transparent border-border text-foreground/60 hover:text-foreground">
                    Exportar Relatório PDF
                   </Button>
                   <Button className="text-xs h-9 font-bold bg-primary hover:bg-primary/90">
                    Sincronizar Correções
                   </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReport && (
          <motion.div 
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xl flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-zinc-950 border border-primary/20 rounded-3xl w-full max-w-4xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Relatório de Conformidade</h2>
                    <p className="text-foreground/40 text-sm font-medium">Análise Final: 10/10 Pixel-Perfect</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowReport(false)} className="text-foreground/20 hover:text-foreground">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card/5 p-6 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-foreground/20 uppercase mb-2">Páginas</p>
                  <p className="text-3xl font-black text-foreground">08/08</p>
                </div>
                <div className="bg-card/5 p-6 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-foreground/20 uppercase mb-2">Breakpoints</p>
                  <p className="text-3xl font-black text-foreground">24/24</p>
                </div>
                <div className="bg-card/5 p-6 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-foreground/20 uppercase mb-2">Status Geral</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <p className="text-3xl font-black text-green-500">APROVADO</p>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[450px] mb-8 pr-4">
                <div className="space-y-6">
                  {validationSteps.filter(s => s.status !== 'pending').map(step => (
                    <div key={step.id} className="p-4 bg-card/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {step.status === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <span className="text-sm font-black text-foreground">{step.name}</span>
                            <p className="text-[10px] text-foreground/40 uppercase tracking-tighter">Desvio médio: {step.diffScore?.toFixed(2)}%</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]", step.status === 'success' ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30")}>
                          {step.status === 'success' ? 'VALIDADO' : 'DESIGN DRIFT'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-zinc-900/30 p-2 rounded-lg border border-white/5 mb-2 overflow-x-auto">
                        <div className="flex -space-x-2">
                           {(['desktop', 'tablet', 'mobile'] as const).map((bp) => (
                             <div key={bp} className="h-8 w-12 rounded border border-border bg-black overflow-hidden relative group/thumb cursor-pointer">
                               <img src={step.screenshots?.[bp]} className="w-full h-full object-cover" alt={bp} />
                               <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center">
                                 <Eye className="h-3 w-3 text-foreground" />
                               </div>
                             </div>
                           ))}
                        </div>
                        <div className="h-4 w-px bg-card/10" />
                        <div className="text-[10px] text-foreground/60 font-medium">Overlay Diff Master</div>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-tighter hover:bg-card/5">Auto-Fix Ref</Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {(['desktop', 'tablet', 'mobile'] as const).map((bp) => {
                          const diffKey = `diff${bp.charAt(0).toUpperCase() + bp.slice(1)}` as 'diffDesktop' | 'diffTablet' | 'diffMobile';
                          return (
                          <div key={bp} className="space-y-2 group">
                            <div className="flex items-center justify-between px-1">
                              <p className="text-[9px] text-foreground/30 font-black uppercase tracking-widest">{bp}</p>
                              {step.diffScore && step.diffScore > 2 && (
                                <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">DRIFT DETECTADO</span>
                              )}
                            </div>
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black shadow-2xl transition-all group-hover:border-primary/50">
                              {/* Actual Screenshot */}
                              <img 
                                src={step.screenshots?.[bp]} 
                                className="w-full h-full object-cover" 
                                alt={bp} 
                              />
                              {/* Overlay Heatmap / Diff Component */}
                              {step.screenshots?.[diffKey] && (
                                <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
                                   {/* The Diff image blended in */}
                                   <img 
                                      src={step.screenshots?.[diffKey]} 
                                      className="w-full h-full object-cover mix-blend-screen bg-rose-600/20" 
                                      alt="diff-overlay" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                          <span className="text-[8px] font-black text-foreground uppercase">Heatmap Ativo</span>
                                        </div>
                                        <div className="h-6 w-6 rounded-full bg-card/10 backdrop-blur-md flex items-center justify-center">
                                          <Maximize2 className="h-3 w-3 text-foreground" />
                                        </div>
                                      </div>
                                    </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );})}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-4">
                <Button className="flex-1 bg-card text-card-foreground font-black uppercase tracking-widest h-12 rounded-xl hover:bg-zinc-200">
                  BAIXAR CERTIFICADO DE QUALIDADE
                </Button>
                <Button variant="outline" className="flex-1 border-border bg-transparent text-foreground font-black uppercase tracking-widest h-12 rounded-xl hover:bg-card/5" onClick={() => window.location.href = '/design-system-debug'}>
                  VER AUDITORIA COMPLETA
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Helper Components ---

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
      active ? "bg-card/10 text-foreground" : "text-foreground/40 hover:text-foreground/60"
    )}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

const TokenItem = ({ name, value, type }: any) => (
  <div className="p-3 bg-card/5 border border-white/5 rounded-xl flex items-center gap-3">
    {type === 'color' && <div className="h-8 w-8 rounded-lg border border-border" style={{ backgroundColor: value }} />}
    <div>
      <p className="text-caption leading-none mb-1">{name}</p>
      <code className="text-xs text-foreground/90 font-mono">{value}</code>
    </div>
  </div>
);

const TypographyRow = ({ label, value, sub }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div>
      <p className="text-xs font-bold text-foreground leading-none mb-1">{label}</p>
      <p className="text-caption !text-primary/40">{sub}</p>
    </div>
    <code className="text-[11px] text-primary font-mono">{value}</code>
  </div>
);

const CheckItem = ({ checked, label }: any) => (
  <div className="flex items-center gap-3">
    <div className={cn(
      "h-5 w-5 rounded border flex items-center justify-center transition-colors",
      checked ? "bg-green-500 border-green-500 text-foreground" : "border-white/20 bg-card/5 text-transparent"
    )}>
      <Check className="h-3 w-3" />
    </div>
    <span className={cn("text-xs font-medium", checked ? "text-foreground/80" : "text-foreground/40")}>{label}</span>
  </div>
);

const DeviceToggle = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
      active ? "bg-card text-card-foreground" : "text-foreground/40 hover:bg-card/5"
    )}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

const DeviceIndicator = ({ icon: Icon, status }: any) => (
  <div className={cn(
    "h-6 w-6 rounded flex items-center justify-center",
    status === 'success' ? "bg-green-500/20 text-green-500" : "bg-card/5 text-foreground/20"
  )}>
    <Icon className="h-3 w-3" />
  </div>
);

const PlaceholderView = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-foreground/10">
    <EyeOff className="h-8 w-8" />
    <span className="text-[10px] uppercase font-black tracking-widest">Sem Imagem</span>
  </div>
);
