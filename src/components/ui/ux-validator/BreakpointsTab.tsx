import { Loader2, Monitor, Smartphone, Tablet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceIndicator, DeviceToggle } from './helpers';
import type { Breakpoint, ValidationStep } from './types';

interface Props {
  activeBreakpoint: Breakpoint;
  setActiveBreakpoint: (bp: Breakpoint) => void;
  validationSteps: ValidationStep[];
  isProcessing: boolean;
  onRunRoadmap: () => void;
}

export function BreakpointsTab({ activeBreakpoint, setActiveBreakpoint, validationSteps, isProcessing, onRunRoadmap }: Props) {
  return (
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
            onClick={onRunRoadmap}
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
  );
}
