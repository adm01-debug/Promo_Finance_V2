import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, Download, Calendar, Building2, 
  FileText, CheckCircle2, AlertCircle, Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExportacaoContabil, ConfigExportacao } from '@/hooks/useExportacaoContabil';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const formatosInfo = {
  SPED: {
    nome: 'SPED Contábil',
    descricao: 'Sistema Público de Escrituração Digital',
    icone: '📊',
    extensao: '.txt'
  },
  ECD: {
    nome: 'ECD',
    descricao: 'Escrituração Contábil Digital',
    icone: '📑',
    extensao: '.txt'
  },
  CSV: {
    nome: 'CSV Universal',
    descricao: 'Formato compatível com Excel e outros sistemas',
    icone: '📋',
    extensao: '.csv'
  },
  SICONTABIL: {
    nome: 'Sicontábil',
    descricao: 'Formato para sistemas Sicontábil',
    icone: '🏛️',
    extensao: '.txt'
  },
  DOMINIO: {
    nome: 'Domínio Sistemas',
    descricao: 'Formato para Domínio Contábil',
    icone: '💼',
    extensao: '.txt'
  }
};

export default function ExportacaoContabil() {
  const { exportar, exportando, getEstatisticasPeriodo, planoContas } = useExportacaoContabil();
  
  const mesAnterior = subMonths(new Date(), 1);
  const [config, setConfig] = useState<ConfigExportacao>({
    formato: 'SPED',
    periodo_inicio: format(startOfMonth(mesAnterior), 'yyyy-MM-dd'),
    periodo_fim: format(endOfMonth(mesAnterior), 'yyyy-MM-dd'),
    incluir_encerramento: false
  });

  const estatisticas = getEstatisticasPeriodo(config.periodo_inicio, config.periodo_fim);

  const handleExportar = () => {
    exportar(config);
  };

  const periodosPredefinidos = [
    { label: 'Mês Anterior', value: 'mes-anterior' },
    { label: 'Mês Atual', value: 'mes-atual' },
    { label: 'Último Trimestre', value: 'trimestre' },
    { label: 'Ano Atual', value: 'ano' }
  ];

  const aplicarPeriodo = (periodo: string) => {
    const hoje = new Date();
    let inicio: Date, fim: Date;

    switch (periodo) {
      case 'mes-anterior':
        const mesAnt = subMonths(hoje, 1);
        inicio = startOfMonth(mesAnt);
        fim = endOfMonth(mesAnt);
        break;
      case 'mes-atual':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case 'trimestre':
        inicio = startOfMonth(subMonths(hoje, 3));
        fim = endOfMonth(subMonths(hoje, 1));
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = hoje;
        break;
      default:
        return;
    }

    setConfig(prev => ({
      ...prev,
      periodo_inicio: format(inicio, 'yyyy-MM-dd'),
      periodo_fim: format(fim, 'yyyy-MM-dd')
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Integração Contábil
          </h2>
          <p className="text-muted-foreground">
            Exportação de lançamentos para sistemas contábeis
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {planoContas?.length || 0} contas cadastradas
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Configuração */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configurar Exportação</CardTitle>
            <CardDescription>
              Defina o período e formato de exportação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Formato */}
            <div>
              <Label className="mb-3 block">Formato de Exportação</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(formatosInfo).map(([key, info]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfig(prev => ({ ...prev, formato: key as any }))}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      config.formato === key 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{info.icone}</span>
                    <span className="text-sm font-medium block">{info.nome}</span>
                    <span className="text-xs text-muted-foreground">{info.extensao}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Período */}
            <div className="space-y-3">
              <Label>Período</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {periodosPredefinidos.map(p => (
                  <Button
                    key={p.value}
                    variant="outline"
                    size="sm"
                    onClick={() => aplicarPeriodo(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Data Início</Label>
                  <Input
                    type="date"
                    value={config.periodo_inicio}
                    onChange={(e) => setConfig(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={config.periodo_fim}
                    onChange={(e) => setConfig(prev => ({ ...prev, periodo_fim: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Opções adicionais */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Incluir lançamentos de encerramento</Label>
                <p className="text-sm text-muted-foreground">
                  Adiciona lançamentos de fechamento do período
                </p>
              </div>
              <Switch
                checked={config.incluir_encerramento}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, incluir_encerramento: checked }))
                }
              />
            </div>

            {/* Botão de Exportação */}
            <Button 
              onClick={handleExportar} 
              disabled={exportando}
              className="w-full"
              size="lg"
            >
              {exportando ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                  </motion.div>
                  Gerando arquivo...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Exportar {formatosInfo[config.formato].nome}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview e Estatísticas */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Preview do Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lançamentos</span>
                <span className="font-bold text-xl">{estatisticas.total_lancamentos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Débitos</span>
                <span className="font-medium text-red-600">
                  R$ {estatisticas.total_debitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Créditos</span>
                <span className="font-medium text-green-600">
                  R$ {estatisticas.total_creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contas Utilizadas</span>
                <span className="font-medium">{estatisticas.contas_utilizadas}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Formato Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{formatosInfo[config.formato].icone}</span>
                <div>
                  <h4 className="font-medium">{formatosInfo[config.formato].nome}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatosInfo[config.formato].descricao}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {formatosInfo[config.formato].extensao}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {estatisticas.total_lancamentos === 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Nenhum lançamento no período
                    </p>
                    <p className="text-sm text-amber-600">
                      Selecione outro período ou verifique os dados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
