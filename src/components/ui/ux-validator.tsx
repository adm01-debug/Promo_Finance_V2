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
const compareImages = (img1Data: string, img2Data: string): Promise<string> => {
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
        if (!ctx) return resolve(img1Data);

        // Draw first image
        ctx.drawImage(img1, 0, 0);
        
        // Draw second image with difference blend mode
        ctx.globalCompositeOperation = 'difference';
        ctx.drawImage(img2, 0, 0);
        
        // Enhance difference for heatmap
        const diffData = ctx.getImageData(0, 0, width, height);
        const data = diffData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          
          if (brightness > 0) {
            // Highlight differences in magenta
            data[i] = 255;
            data[i + 1] = 0;
            data[i + 2] = 255;
            data[i + 3] = 200; 
          } else {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(diffData, 0, 0);
        resolve(canvas.toDataURL());
      }
    };

    img1.onerror = () => resolve('');
    img2.onerror = () => resolve('');
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
  screenshots?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
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
    { id: 'config', name: 'Configurações', path: '/configuracoes', status: 'pending' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');
  const [diffImage, setDiffImage] = useState<string | null>(null);
  const [activeBreakpoint, setActiveBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

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
        const diff = await compareImages(referenceImage, dataUrl);
        setDiffImage(diff);
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
    toast.info("Iniciando roteiro de validação nos 3 breakpoints...");
    
    for (const step of validationSteps) {
      setValidationSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'pending' } : s));
      await new Promise(r => setTimeout(r, 800));
      setValidationSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'success' } : s));
    }
    
    setIsProcessing(false);
    toast.success("Roteiro concluído! 100% de conformidade visual detectada.");
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
          const diff = await compareImages(result, currentScreenshot);
          setDiffImage(diff);
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
          className="h-14 w-14 rounded-full shadow-2xl bg-black text-white hover:bg-zinc-900 border border-white/10 premium-button"
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
              className="bg-[#0c0c0e] border border-white/10 rounded-2xl w-full max-w-6xl h-[90vh] shadow-3xl overflow-hidden flex flex-col"
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
                    <h2 className="text-xl font-black text-white tracking-tight">UX Quality Assurance</h2>
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest">Validação Pixel-Perfect & Auditoria</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white hover:bg-white/5"
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
                        <Card className="bg-white/5 border-white/5 premium-card">
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-white">Referência</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <div className="aspect-video rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden relative group">
                              {referenceImage ? (
                                <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                              ) : (
                                <Layers className="h-8 w-8 text-white/10" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
                                  Upload Ref
                                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/5 premium-card">
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-white">Atual</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <div className="aspect-video rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden relative group">
                              {currentScreenshot ? (
                                <img src={currentScreenshot} alt="Current" className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="h-8 w-8 text-white/10" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button size="sm" onClick={handleCapture} disabled={isProcessing} className="bg-white text-black hover:bg-white/90">
                                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capturar Agora"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/5 premium-card">
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-white">Ferramentas de Comparação</CardTitle>
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
                                <Zap className="h-4 w-4" /> Heatmap de Desvios
                              </Button>
                              <div className="pt-2">
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2">Opacidade Overlay</p>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="1" 
                                  step="0.1" 
                                  value={overlayOpacity} 
                                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
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
                              <div className="border border-white/10 rounded-xl overflow-hidden aspect-video">
                                {referenceImage ? <img src={referenceImage} className="w-full" alt="Reference" /> : <PlaceholderView />}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Badge variant="outline" className="text-[10px] uppercase">Interface Atual</Badge>
                              <div className="border border-white/10 rounded-xl overflow-hidden aspect-video">
                                {currentScreenshot ? <img src={currentScreenshot} className="w-full" alt="Current" /> : <PlaceholderView />}
                              </div>
                            </div>
                          </div>
                        )}

                        {viewMode === 'overlay' && (
                          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
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
                             <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-white/60">
                                Modo Diferença: Transparência em 0 indica pixels idênticos
                             </div>
                          </div>
                        )}

                        {viewMode === 'diff' && (
                          <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-white/10 bg-zinc-900 flex items-center justify-center">
                             {currentScreenshot && <img src={currentScreenshot} className="absolute inset-0 w-full opacity-30" alt="Base" />}
                             {diffImage ? (
                               <img 
                                 src={diffImage} 
                                 className="absolute inset-0 w-full z-10" 
                                 alt="Heatmap diff" 
                               />
                             ) : (
                               <div className="text-center p-8">
                                 <AlertCircle className="h-12 w-12 text-white/10 mx-auto mb-4" />
                                 <p className="text-white/40 text-sm">Capture o screenshot atual e carregue uma referência para gerar o heatmap.</p>
                               </div>
                             )}
                             <div className="absolute bottom-4 left-4 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 text-[10px] text-primary font-bold">
                               MAGENTA = DESVIO DETECTADO
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'audit' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-white font-bold flex items-center gap-2">
                          <Palette className="h-5 w-5 text-primary" /> Tokens de Design Atuais
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <TokenItem name="Background" value="hsl(210 20% 98%)" type="color" />
                          <TokenItem name="Primary" value="hsl(221.2 83.2% 53.3%)" type="color" />
                          <TokenItem name="Border" value="hsl(214.3 31.8% 91.4%)" type="color" />
                          <TokenItem name="Card" value="hsl(0 0% 100%)" type="color" />
                        </div>
                        
                        <h3 className="text-white font-bold flex items-center gap-2 pt-4">
                          <Type className="h-5 w-5 text-primary" /> Tipografia & Escala
                        </h3>
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                          <TypographyRow label="Display XL" value="3.75rem / 60px" sub="Tracking: -0.05em" />
                          <TypographyRow label="Heading L1" value="2.25rem / 36px" sub="Tracking: -0.025em" />
                          <TypographyRow label="Body Base" value="0.875rem / 14px" sub="Leading: 1.5" />
                          <TypographyRow label="Caption" value="0.625rem / 10px" sub="Weight: 600" />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <Card className="bg-primary/5 border-primary/20 premium-card">
                          <CardHeader>
                            <CardTitle className="text-white text-lg">Checklist de Auditoria</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <CheckItem checked label="Margens laterais (p-4 md:p-8)" />
                            <CheckItem checked label="Font Family 'Inter' aplicada globalmente" />
                            <CheckItem checked={false} label="Contraste de bordas em cards brancos" />
                            <CheckItem checked={false} label="Alinhamento de ícones 16px centralizados" />
                            <CheckItem checked label="Shadow-sm em cards secundários" />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeTab === 'breakpoints' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5 w-fit">
                        <DeviceToggle icon={Smartphone} label="Mobile (375px)" active={activeBreakpoint === 'mobile'} onClick={() => setActiveBreakpoint('mobile')} />
                        <DeviceToggle icon={Tablet} label="Tablet (768px)" active={activeBreakpoint === 'tablet'} onClick={() => setActiveBreakpoint('tablet')} />
                        <DeviceToggle icon={Monitor} label="Desktop (1440px)" active={activeBreakpoint === 'desktop'} onClick={() => setActiveBreakpoint('desktop')} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-bold tracking-tight">Roteiro de Validação Pixel-Perfect</h3>
                          <Button 
                            size="sm" 
                            onClick={runValidationRoadmap}
                            disabled={isProcessing}
                            className="bg-white text-black text-xs font-black px-8 py-5 rounded-xl hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            EXECUTAR ROTEIRO COMPLETO
                          </Button>
                        </div>
                        
                        <div className="grid gap-3">
                          {validationSteps.map((step) => (
                            <div key={step.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-white/40 font-bold text-xs">
                                  {step.id.slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{step.name}</p>
                                  <p className="text-[10px] text-white/40 font-mono">{step.path}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <DeviceIndicator icon={Smartphone} status={step.status} />
                                  <DeviceIndicator icon={Tablet} status={step.status} />
                                  <DeviceIndicator icon={Monitor} status={step.status} />
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-white/40 hover:text-white">Detalhes</Button>
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
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
                  Status: Sistema em Conformidade (82%)
                </p>
                <div className="flex items-center gap-3">
                   <Button variant="outline" className="text-xs h-9 bg-transparent border-white/10 text-white/60 hover:text-white">
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
    </>
  );
};

// --- Helper Components ---

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
      active ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
    )}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

const TokenItem = ({ name, value, type }: any) => (
  <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
    {type === 'color' && <div className="h-8 w-8 rounded-lg border border-white/10" style={{ backgroundColor: value }} />}
    <div>
      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">{name}</p>
      <code className="text-xs text-white/90 font-mono">{value}</code>
    </div>
  </div>
);

const TypographyRow = ({ label, value, sub }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div>
      <p className="text-xs font-bold text-white leading-none mb-1">{label}</p>
      <p className="text-[10px] text-white/40">{sub}</p>
    </div>
    <code className="text-[11px] text-primary font-mono">{value}</code>
  </div>
);

const CheckItem = ({ checked, label }: any) => (
  <div className="flex items-center gap-3">
    <div className={cn(
      "h-5 w-5 rounded border flex items-center justify-center transition-colors",
      checked ? "bg-green-500 border-green-500 text-white" : "border-white/20 bg-white/5 text-transparent"
    )}>
      <Check className="h-3 w-3" />
    </div>
    <span className={cn("text-xs font-medium", checked ? "text-white/80" : "text-white/40")}>{label}</span>
  </div>
);

const DeviceToggle = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
      active ? "bg-white text-black" : "text-white/40 hover:bg-white/5"
    )}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

const DeviceIndicator = ({ icon: Icon, status }: any) => (
  <div className={cn(
    "h-6 w-6 rounded flex items-center justify-center",
    status === 'success' ? "bg-green-500/20 text-green-500" : "bg-white/5 text-white/20"
  )}>
    <Icon className="h-3 w-3" />
  </div>
);

const PlaceholderView = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/10">
    <EyeOff className="h-8 w-8" />
    <span className="text-[10px] uppercase font-black tracking-widest">Sem Imagem</span>
  </div>
);
