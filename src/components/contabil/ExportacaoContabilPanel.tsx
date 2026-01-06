// ============================================
// COMPONENTE: EXPORTAÇÃO PARA CONTABILIDADE
// Formato compatível com Domínio, Fortes, etc.
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, Settings, Calendar, Building2, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useExportacaoContabil } from '@/hooks/useExportacaoContabil';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  empresaId: string;
}

const SISTEMAS_CONTABEIS = [
  { 
    id: 'dominio', 
    nome: 'Domínio Sistemas', 
    formato: 'TXT',
    descricao: 'Formato padrão para importação no Domínio Contábil'
  },
  { 
    id: 'fortes', 
    nome: 'Fortes Contábil', 
    formato: 'CSV',
    descricao: 'Layout de integração Fortes AC'
  },
  { 
    id: 'sicontabil', 
    nome: 'SICONTABIL', 
    formato: 'TXT',
    descricao: 'Padrão SICONTABIL para lançamentos'
  },
  { 
    id: 'sped', 
    nome: 'SPED Contábil (ECD)', 
    formato: 'TXT',
    descricao: 'Bloco I - Lançamentos Contábeis'
  },
  { 
    id: 'csv_generico', 
    nome: 'CSV Genérico', 
    formato: 'CSV',
    descricao: 'Layout flexível para outros sistemas'
  },
  { 
    id: 'excel', 
    nome: 'Excel', 
    formato: 'XLSX',
    descricao: 'Planilha formatada com filtros'
  },
];

export function ExportacaoContabilPanel({ empresaId }: Props) {
  const [sistemaId, setSistemaId] = useState('dominio');
  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [incluirEncerramento, setIncluirEncerramento] = useState(false);
  const [incluirAbertura, setIncluirAbertura] = useState(false);
  const [agruparPorConta, setAgruparPorConta] = useState(false);

  const { 
    exportar, 
    isExportando, 
    estatisticas,
    getEstatisticasPeriodo 
  } = useExportacaoContabil(empresaId);

  const sistemaAtual = SISTEMAS_CONTABEIS.find(s => s.id === sistemaId);

  const handleExportar = async () => {
    await exportar({
      sistema: sistemaId,
      dataInicio,
      dataFim,
      incluirEncerramento,
      incluirAbertura,
      agruparPorConta,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Exportação para Contabilidade
        </h2>
        <p className="text-sm text-muted-foreground">
          Gere arquivos compatíveis com os principais sistemas contábeis
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuração */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Sistema */}
            <div className="space-y-2">
              <Label>Sistema Contábil</Label>
              <Select value={sistemaId} onValueChange={setSistemaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SISTEMAS_CONTABEIS.map(sistema => (
                    <SelectItem key={sistema.id} value={sistema.id}>
                      <div className="flex items-center gap-2">
                        <span>{sistema.nome}</span>
                        <Badge variant="outline" className="text-xs">{sistema.formato}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sistemaAtual && (
                <p className="text-xs text-muted-foreground">{sistemaAtual.descricao}</p>
              )}
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(dataInicio, 'dd/MM/yy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dataInicio}
                      onSelect={d => d && setDataInicio(d)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(dataFim, 'dd/MM/yy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dataFim}
                      onSelect={d => d && setDataFim(d)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Opções */}
            <div className="space-y-4">
              <Label>Opções</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Lançamentos de Abertura</p>
                  <p className="text-xs text-muted-foreground">Incluir saldos iniciais</p>
                </div>
                <Switch checked={incluirAbertura} onCheckedChange={setIncluirAbertura} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Lançamentos de Encerramento</p>
                  <p className="text-xs text-muted-foreground">Zeramento de resultado</p>
                </div>
                <Switch checked={incluirEncerramento} onCheckedChange={setIncluirEncerramento} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Agrupar por Conta</p>
                  <p className="text-xs text-muted-foreground">Consolidar lançamentos</p>
                </div>
                <Switch checked={agruparPorConta} onCheckedChange={setAgruparPorConta} />
              </div>
            </div>

            <Button onClick={handleExportar} className="w-full" disabled={isExportando}>
              <Download className="mr-2 h-4 w-4" />
              {isExportando ? 'Gerando...' : 'Exportar Arquivo'}
            </Button>
          </CardContent>
        </Card>

        {/* Preview e Estatísticas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Lançamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas?.totalLancamentos || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Débitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(estatisticas?.totalDebitos || 0)}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(estatisticas?.totalCreditos || 0)}</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Formatos Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sistemas Compatíveis</CardTitle>
              <CardDescription>
                Selecione o sistema contábil para exportar no formato correto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={sistemaId} onValueChange={setSistemaId}>
                <div className="grid gap-4 md:grid-cols-2">
                  {SISTEMAS_CONTABEIS.map(sistema => (
                    <div
                      key={sistema.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        sistemaId === sistema.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent bg-muted hover:border-muted-foreground/20'
                      }`}
                      onClick={() => setSistemaId(sistema.id)}
                    >
                      <RadioGroupItem value={sistema.id} id={sistema.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={sistema.id} className="font-medium cursor-pointer">
                            {sistema.nome}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {sistema.formato}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {sistema.descricao}
                        </p>
                      </div>
                      {sistemaId === sistema.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">📋 Dados Exportados:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Lançamentos contábeis do período</li>
                    <li>Contas a pagar e receber</li>
                    <li>Movimentações bancárias</li>
                    <li>Notas fiscais emitidas/recebidas</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">⚠️ Atenção:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Verifique o plano de contas antes de importar</li>
                    <li>Confira o código de centro de custo</li>
                    <li>Valide os históricos padrão</li>
                    <li>Faça backup antes da importação</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ExportacaoContabilPanel;
