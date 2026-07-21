import { Download, FileJson, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';
import { FilterPresetsManager } from '../FilterPresetsManager';
import type { ModoDemonstrativo } from './types';

interface EmpresaOption { id: string; nome_fantasia?: string | null; razao_social?: string | null }

export interface DreBalancoToolbarProps {
  modo: ModoDemonstrativo;
  fonte: FonteDemonstrativo;
  mes: number;
  ano: number;
  selectedEmpresaId: string;
  empresas: EmpresaOption[];
  onChangeModo: (v: ModoDemonstrativo) => void;
  onChangeFonte: (v: FonteDemonstrativo) => void;
  onChangeMes: (v: number) => void;
  onChangeEmpresa: (v: string) => void;
  onReset: () => void;
  onLoadPreset: (filters: Record<string, unknown>) => void;
  onExport: (format: 'pdf' | 'json') => void;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function DreBalancoToolbar({
  modo, fonte, mes, ano, selectedEmpresaId, empresas,
  onChangeModo, onChangeFonte, onChangeMes, onChangeEmpresa,
  onReset, onLoadPreset, onExport,
}: DreBalancoToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-card/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm relative overflow-hidden group/filter">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover/filter:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="flex items-center gap-3 relative z-10">
        <ToggleGroup type="single" value={modo} onValueChange={(v) => v && onChangeModo(v as ModoDemonstrativo)}
          className="bg-background/40 p-1 rounded-2xl border border-white/10">
          <ToggleGroupItem value="dre" className="rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-lg data-[state=on]:shadow-primary/20 transition-all px-6 font-black uppercase text-[10px] tracking-widest">DRE</ToggleGroupItem>
          <ToggleGroupItem value="balanco" className="rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-lg data-[state=on]:shadow-primary/20 transition-all px-6 font-black uppercase text-[10px] tracking-widest">Balanço</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup type="single" value={fonte} onValueChange={(v) => v && onChangeFonte(v as FonteDemonstrativo)}
          className="bg-background/40 p-1 rounded-2xl border border-white/10">
          <ToggleGroupItem value="competencia" className="rounded-xl data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground transition-all px-4 font-black uppercase text-[9px] tracking-tight">Competência</ToggleGroupItem>
          <ToggleGroupItem value="caixa" className="rounded-xl data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground transition-all px-4 font-black uppercase text-[9px] tracking-tight">Caixa</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="h-8 w-px bg-card/10 hidden md:block" />

      <div className="flex items-center gap-3 relative z-10">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Empresa</Label>
          <Select value={selectedEmpresaId} onValueChange={onChangeEmpresa}>
            <SelectTrigger className="h-12 w-[220px] rounded-2xl border-white/5 bg-card/5 font-bold">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
              <SelectItem value="todas">Consolidado (Todas)</SelectItem>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mês de Referência</Label>
          <Select value={String(mes)} onValueChange={(v) => onChangeMes(Number(v))}>
            <SelectTrigger className="h-12 w-[140px] rounded-2xl border-white/5 bg-card/5 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m} / {ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card/5 p-3 rounded-2xl border border-white/5 ml-auto">
        <FilterPresetsManager
          entityType="dre-balanco"
          empresaId={selectedEmpresaId}
          currentFilters={{ modo, fonte, mes, empresaId: selectedEmpresaId }}
          onLoadPreset={onLoadPreset}
        />

        <Button variant="outline" size="sm" onClick={onReset}
          className="h-10 rounded-xl border-white/10 bg-card/5 gap-2 px-4 font-bold text-muted-foreground hover:text-primary">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Restaurar</span>
        </Button>

        <div className="h-8 w-px bg-card/10" />
        <div className="flex flex-col items-end mr-3">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Governança Fiscal</span>
          <span className="text-[9px] font-bold text-primary">Nível de Auditoria: Máximo</span>
        </div>
        <div className="h-8 w-px bg-card/10" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-10 rounded-2xl font-black gap-2 border-white/10 bg-card/5 hover:bg-card/10 px-6 transition-all hover:translate-y-[-2px]">
              <Download className="h-4 w-4 text-primary" /> Exportar Livros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Selecionar Formato</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-card/5" />
            <DropdownMenuItem onClick={() => onExport('pdf')} className="rounded-xl gap-3 py-3 cursor-pointer">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <FileText className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Relatório Executivo (PDF)</span>
                <span className="text-[10px] opacity-50">Pronto para conselho/bancos</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('json')} className="rounded-xl gap-3 py-3 cursor-pointer">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileJson className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Dataset Estruturado (JSON)</span>
                <span className="text-[10px] opacity-50">Integração com BI & Auditoria</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
