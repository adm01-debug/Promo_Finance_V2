// ============================================
// COMPONENTE: EXPORTAÇÃO PARA CONTABILIDADE
// Formato compatível com Domínio, Fortes, etc.
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Settings, Calendar, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useExportacaoContabil, type ConfigExportacao } from '@/hooks/useExportacaoContabil';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SISTEMAS_CONTABEIS = [
  { id: 'SPED', nome: 'SPED Contábil (ECD)', formato: 'TXT', descricao: 'Bloco I - Lançamentos' },
  { id: 'ECD', nome: 'ECD', formato: 'TXT', descricao: 'Escrituração Contábil Digital' },
  { id: 'CSV', nome: 'CSV Genérico', formato: 'CSV', descricao: 'Layout flexível' },
  { id: 'SICONTABIL', nome: 'SICONTABIL', formato: 'TXT', descricao: 'Padrão SICONTABIL' },
  { id: 'DOMINIO', nome: 'Domínio Sistemas', formato: 'TXT', descricao: 'Formato Domínio' },
];

export function ExportacaoContabilPanel() {
  const [formato, setFormato] = useState<ConfigExportacao['formato']>('SPED');
  const [dataInicio, setDataInicio] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [incluirEncerramento, setIncluirEncerramento] = useState(false);

  const { exportar, exportando, getEstatisticasPeriodo, formatosDisponiveis } = useExportacaoContabil();

  const estatisticas = useMemo(() => 
    getEstatisticasPeriodo(dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0]),
    [dataInicio, dataFim, getEstatisticasPeriodo]
  );

  const sistemaAtual = SISTEMAS_CONTABEIS.find(s => s.id === formato);

  const handleExportar = async () => {
    await exportar({
      formato,
      periodo_inicio: dataInicio.toISOString().split('T')[0],
      periodo_fim: dataFim.toISOString().split('T')[0],
      incluir_encerramento: incluirEncerramento,
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
              <Select value={formato} onValueChange={(v: ConfigExportacao['formato']) => setFormato(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatosDisponiveis.map(f => (
                    <SelectItem key={f} value={f}>
                      <div className="flex items-center gap-2">
                        <span>{SISTEMAS_CONTABEIS.find(s => s.id === f)?.nome || f}</span>
                        <Badge variant="outline" className="text-xs">{SISTEMAS_CONTABEIS.find(s => s.id === f)?.formato || 'TXT'}</Badge>
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
                  <p className="text-sm font-medium">Lançamentos de Encerramento</p>
                  <p className="text-xs text-muted-foreground">Zeramento de resultado</p>
                </div>
                <Switch checked={incluirEncerramento} onCheckedChange={setIncluirEncerramento} />
              </div>
            </div>

            <Button onClick={handleExportar} className="w-full" disabled={exportando}>
              <Download className="mr-2 h-4 w-4" />
              {exportando ? 'Gerando...' : 'Exportar Arquivo'}
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
                  <div className="text-2xl font-bold">{estatisticas?.total_lancamentos || 0}</div>
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
                  <div className="text-2xl font-bold">{formatCurrency(estatisticas?.total_debitos || 0)}</div>
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
                  <div className="text-2xl font-bold">{formatCurrency(estatisticas?.total_creditos || 0)}</div>
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
              <RadioGroup value={formato} onValueChange={(v: ConfigExportacao['formato']) => setFormato(v)}>
                <div className="grid gap-4 md:grid-cols-2">
                  {SISTEMAS_CONTABEIS.map(sistema => (
                    <div
                      key={sistema.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        formato === sistema.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent bg-muted hover:border-muted-foreground/20'
                      }`}
                      onClick={() => setFormato(sistema.id as ConfigExportacao['formato'])}
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
                      {formato === sistema.id && (
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
