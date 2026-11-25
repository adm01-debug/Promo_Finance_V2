import { motion } from 'framer-motion';
import { Building2, Calendar, CalendarIcon, Zap, LayoutGrid, Download, Wallet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { itemVariants } from './BI.helpers';

import type { Dispatch, SetStateAction } from 'react';
interface BIFuturistaConteudoProps {
  futuristicMode: boolean;
  empresaId: string;
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  setFuturisticMode: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setEmpresaId: import('react').Dispatch<import('react').SetStateAction<string>>;
  filters: { centroCustoId: string; contaBancariaId: string };
  setFilters: import('react').Dispatch<
    import('react').SetStateAction<{
      centroCustoId: string;
      contaBancariaId: string;
    }>
  >;
  centrosCusto: {
    ativo: boolean | null;
    codigo: string | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    orcamento_previsto: number | null;
    orcamento_realizado: number | null;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  contasBancarias: import('@/hooks/financial/types').ContaBancariaComRegras[];
  usarPeriodoCustom: boolean;
  periodo: string;
  setUsarPeriodoCustom: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setPeriodo: import('react').Dispatch<import('react').SetStateAction<string>>;
  setDataInicio: Dispatch<SetStateAction<Date | undefined>>;
  setDataFim: Dispatch<SetStateAction<Date | undefined>>;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
}

export function BIFuturistaConteudo({
  futuristicMode,
  empresaId,
  empresas,
  setFuturisticMode,
  setEmpresaId,
  filters,
  setFilters,
  centrosCusto,
  contasBancarias,
  usarPeriodoCustom,
  periodo,
  setUsarPeriodoCustom,
  setPeriodo,
  setDataInicio,
  setDataFim,
  dataInicio,
  dataFim,
}: BIFuturistaConteudoProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10"
    >
      <div>
        <h1
          className={cn(
            'text-3xl font-bold tracking-tight flex items-center gap-3',
            futuristicMode
              ? 'text-foreground drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]'
              : 'bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'
          )}
        >
          Business Intelligence
          {empresaId !== 'todas' && (
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-widest border-primary/30 text-primary"
            >
              CNPJ: {empresas.find((e) => e.id === empresaId)?.cnpj}
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground">Visão executiva consolidada para gestão estratégica</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-white/5 mr-2">
          <Label
            htmlFor="futuristic-mode"
            className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Zap
              className={cn(
                'w-3 h-3 transition-colors',
                futuristicMode ? 'text-primary fill-primary' : 'text-muted-foreground'
              )}
            />
            BI FUTURISTA
          </Label>
          <Switch
            id="futuristic-mode"
            checked={futuristicMode}
            onCheckedChange={setFuturisticMode}
            className="scale-90"
          />
        </div>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="w-[200px] bg-background/50 backdrop-blur-sm border-border">
            <Building2 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Empresas</SelectItem>
            {empresas
              .filter((e) => e.ativo)
              .map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome_fantasia || empresa.razao_social}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={filters?.centroCustoId || 'todos'}
          onValueChange={(val) => setFilters((f) => ({ ...f, centroCustoId: val }))}
        >
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border">
            <LayoutGrid className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Centro de Custo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Centros</SelectItem>
            {centrosCusto?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters?.contaBancariaId || 'todos'}
          onValueChange={(val) => setFilters((f) => ({ ...f, contaBancariaId: val }))}
        >
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border">
            <Wallet className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Conta Bancária" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Contas</SelectItem>
            {contasBancarias?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={usarPeriodoCustom ? 'custom' : periodo}
          onValueChange={(val) => {
            if (val === 'custom') {
              setUsarPeriodoCustom(true);
            } else {
              setUsarPeriodoCustom(false);
              setPeriodo(val);
              setDataInicio(undefined);
              setDataFim(undefined);
            }
          }}
        >
          <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm border-border">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {usarPeriodoCustom && (
          <div className="flex items-center gap-2">
            {[
              { state: dataInicio, setter: setDataInicio, label: 'Início' },
              { state: dataFim, setter: setDataFim, label: 'Fim' },
            ].map((item) => (
              <Popover key={item.label}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[130px] justify-start text-left font-normal bg-background/50 backdrop-blur-sm border-border',
                      !item.state && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {item.state ? format(item.state, 'dd/MM/yyyy') : item.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={item.state}
                    onSelect={item.setter}
                    autoFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-background/50 backdrop-blur-sm border-border gap-2"
        >
          <Download className="w-4 h-4" /> Exportar BI
        </Button>
      </div>
    </motion.div>
  );
}
