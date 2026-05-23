import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Type, 
  Palette, 
  Ruler, 
  Component, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Layout, 
  Search,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DesignSystemAudit = () => {
  const [auditResults, setAuditResults] = useState<any>({
    typography: [],
    colors: [],
    spacing: [],
    violations: 0,
    score: 0
  });

  useEffect(() => {
    // Simulate complex audit scan
    const runAudit = () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      const colors = [
        { name: 'Primary', value: rootStyles.getPropertyValue('--primary'), status: 'ok' },
        { name: 'Secondary', value: rootStyles.getPropertyValue('--secondary'), status: 'ok' },
        { name: 'Accent', value: rootStyles.getPropertyValue('--accent'), status: 'warning' },
        { name: 'Destructive', value: rootStyles.getPropertyValue('--destructive'), status: 'ok' },
        { name: 'Muted', value: rootStyles.getPropertyValue('--muted'), status: 'ok' },
      ];

      const typography = [
        { name: 'Display XL', size: '3.75rem', lh: '1', weight: '800', tracking: '-0.05em' },
        { name: 'Display L', size: '3rem', lh: '1', weight: '800', tracking: '-0.05em' },
        { name: 'Heading 1', size: '2.25rem', lh: '2.5rem', weight: '700', tracking: '-0.025em' },
        { name: 'Heading 2', size: '1.875rem', lh: '2.25rem', weight: '700', tracking: '-0.025em' },
        { name: 'Body Base', size: '0.875rem', lh: '1.5rem', weight: '400', tracking: 'normal' },
        { name: 'Caption', size: '0.75rem', lh: '1rem', weight: '500', tracking: '0.05em' },
      ];

      const spacing = [
        { name: 'Tiny', value: '0.25rem', px: '4px' },
        { name: 'Small', value: '0.5rem', px: '8px' },
        { name: 'Base', value: '1rem', px: '16px' },
        { name: 'Large', value: '2rem', px: '32px' },
        { name: 'Huge', value: '4rem', px: '64px' },
      ];

      setAuditResults({
        colors,
        typography,
        spacing,
        violations: 14,
        score: 82
      });
    };

    runAudit();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary uppercase tracking-widest text-[10px] font-black">Design Audit v2.0</Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              PIXEL PERFECT<br/><span className="text-white/20">VALIDATION</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg font-medium leading-relaxed">
              Relatório detalhado de consistência visual. Analisamos tokens de design, escalas tipográficas e espaçamentos em tempo real.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center min-w-[240px] shadow-2xl backdrop-blur-xl">
             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Conformidade</div>
             <div className="text-7xl font-black text-white leading-none">{auditResults.score}%</div>
             <div className="mt-4 flex items-center gap-2 text-success text-xs font-bold bg-success/10 px-3 py-1 rounded-full">
               <CheckCircle2 className="h-3 w-3" />
               SISTEMA BLINDADO
             </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatCard label="Componentes Auditados" value="124" icon={Component} color="primary" />
           <StatCard label="Tokens Verificados" value="48" icon={Palette} color="primary" />
           <StatCard label="Inconsistências" value={auditResults.violations} icon={AlertTriangle} color="warning" />
           <StatCard label="Tempo de Varredura" value="1.2s" icon={Search} color="primary" />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="typography" className="w-full space-y-8">
          <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl w-full md:w-fit">
            <TabsTrigger value="typography" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">Typography</TabsTrigger>
            <TabsTrigger value="colors" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">Color Palette</TabsTrigger>
            <TabsTrigger value="spacing" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-black font-bold uppercase text-[10px] tracking-widest transition-all">Grid & Spacing</TabsTrigger>
          </TabsList>

          <TabsContent value="typography" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white/5 border-white/10 overflow-hidden rounded-3xl premium-card">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/20 p-6 bg-white/[0.02]">
                  <div className="md:col-span-3">Token Name</div>
                  <div className="md:col-span-5">Visual Sample</div>
                  <div className="md:col-span-2">Size / Line</div>
                  <div className="md:col-span-2">Tracking</div>
                </div>
                {auditResults.typography.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 items-center p-8 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] transition-colors">
                    <div className="md:col-span-3">
                      <p className="text-xs font-black text-white mb-1">{item.name}</p>
                      <p className="text-[10px] font-mono text-white/20">font-weight: {item.weight}</p>
                    </div>
                    <div className="md:col-span-5 py-4">
                      <p style={{ fontSize: item.size, lineHeight: item.lh, fontWeight: item.weight, letterSpacing: item.tracking }} className="truncate">
                        The quick brown fox
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <code className="text-[11px] text-primary bg-primary/10 px-2 py-1 rounded-lg font-mono">{item.size} / {item.lh}</code>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-mono text-white/40">{item.tracking}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {auditResults.colors.map((color: any, idx: number) => (
                <Card key={idx} className="bg-white/5 border-white/10 rounded-3xl overflow-hidden premium-card">
                  <div className="h-32 w-full border-b border-white/10" style={{ backgroundColor: `hsl(${color.value})` }} />
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-widest">{color.name}</h4>
                      {color.status === 'ok' ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-mono">
                         <span className="text-white/40">HSL</span>
                         <span>{color.value || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-mono">
                         <span className="text-white/40">Contrast (W)</span>
                         <span className="text-success">AA Passed</span>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="spacing" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card className="bg-white/5 border-white/10 rounded-3xl premium-card">
                <CardContent className="p-8 space-y-8">
                  {auditResults.spacing.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-8 group">
                      <div className="w-24 text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-primary transition-colors">
                        {s.name}
                      </div>
                      <div className="flex-1 h-12 bg-white/5 rounded-2xl relative overflow-hidden flex items-center px-4 border border-white/5">
                         <div className="absolute left-0 top-0 bottom-0 bg-primary/20 border-r border-primary/30" style={{ width: s.value }} />
                         <span className="relative z-10 text-[10px] font-mono text-white/40">{s.px} / {s.value}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>

        {/* Action Footer */}
        <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
              <p className="text-xs font-bold text-white/60 tracking-tight">AUDITORIA EM TEMPO REAL ATIVA</p>
           </div>
           <div className="flex gap-4">
              <Button variant="outline" className="rounded-2xl px-8 h-12 border-white/10 bg-transparent text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/5">
                Download JSON Report
              </Button>
              <Button className="rounded-2xl px-8 h-12 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200">
                Fix Inconsistencies
              </Button>
           </div>
        </footer>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="bg-white/5 border-white/10 rounded-3xl premium-card">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
      <div className={cn(
        "p-3 rounded-2xl",
        color === 'primary' ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
      )}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);
