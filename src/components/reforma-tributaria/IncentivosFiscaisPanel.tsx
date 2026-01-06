// ============================================
// COMPONENTE: GESTÃO DE INCENTIVOS FISCAIS
// Interface para cadastrar/gerenciar incentivos
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Gift, TrendingUp, Calendar, DollarSign, Percent, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useIncentivosFiscais } from '@/hooks/useIncentivosFiscais';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  empresaId: string;
}

const TIPOS_INCENTIVO = [
  { value: 'reducao_aliquota', label: 'Redução de Alíquota' },
  { value: 'credito_presumido', label: 'Crédito Presumido' },
  { value: 'isencao', label: 'Isenção' },
  { value: 'diferimento', label: 'Diferimento' },
  { value: 'suspensao', label: 'Suspensão' },
  { value: 'zona_franca', label: 'Zona Franca' },
  { value: 'lei_rouanet', label: 'Lei Rouanet (Cultura)' },
  { value: 'lei_incentivo_esporte', label: 'Lei de Incentivo ao Esporte' },
  { value: 'padis', label: 'PADIS (Semicondutores)' },
  { value: 'reidi', label: 'REIDI (Infraestrutura)' },
];

export function IncentivosFiscaisPanel({ empresaId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo_incentivo: '',
    ano_inicio: new Date().getFullYear(),
    ano_fim: null as number | null,
    limite_percentual: null as number | null,
    limite_valor: null as number | null,
    numero_processo: '',
    ato_concessorio: '',
    ativo: true,
  });

  const { 
    incentivos = [], 
    resumo,
    isLoading, 
    criarIncentivo, 
    atualizarIncentivo, 
    excluirIncentivo,
    calcularEconomia 
  } = useIncentivosFiscais(empresaId);

  const handleSubmit = async () => {
    if (editando) {
      await atualizarIncentivo.mutateAsync({ id: editando, ...formData });
    } else {
      await criarIncentivo.mutateAsync({ ...formData, empresa_id: empresaId });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo_incentivo: '',
      ano_inicio: new Date().getFullYear(),
      ano_fim: null,
      limite_percentual: null,
      limite_valor: null,
      numero_processo: '',
      ato_concessorio: '',
      ativo: true,
    });
    setEditando(null);
    setDialogOpen(false);
  };

  const handleEdit = (incentivo: typeof incentivos[0]) => {
    setFormData({
      nome: incentivo.nome,
      tipo_incentivo: incentivo.tipo_incentivo,
      ano_inicio: incentivo.ano_inicio,
      ano_fim: incentivo.ano_fim,
      limite_percentual: incentivo.limite_percentual,
      limite_valor: incentivo.limite_valor,
      numero_processo: incentivo.numero_processo || '',
      ato_concessorio: incentivo.ato_concessorio || '',
      ativo: incentivo.ativo ?? true,
    });
    setEditando(incentivo.id);
    setDialogOpen(true);
  };

  const getTipoLabel = (tipo: string) => {
    return TIPOS_INCENTIVO.find(t => t.value === tipo)?.label || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Incentivos Fiscais</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie incentivos e benefícios fiscais da empresa
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Incentivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Incentivo' : 'Cadastrar Incentivo Fiscal'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Incentivo</Label>
                <Input
                  value={formData.nome}
                  onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Redução ICMS Exportação"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Incentivo</Label>
                <Select 
                  value={formData.tipo_incentivo} 
                  onValueChange={v => setFormData(prev => ({ ...prev, tipo_incentivo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_INCENTIVO.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ano Início</Label>
                  <Input
                    type="number"
                    value={formData.ano_inicio}
                    onChange={e => setFormData(prev => ({ ...prev, ano_inicio: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano Fim (opcional)</Label>
                  <Input
                    type="number"
                    value={formData.ano_fim || ''}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      ano_fim: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                    placeholder="Indefinido"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limite % (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.limite_percentual || ''}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      limite_percentual: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    placeholder="Ex: 4.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite R$ (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.limite_valor || ''}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      limite_valor: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    placeholder="Ex: 100000.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nº Processo</Label>
                <Input
                  value={formData.numero_processo}
                  onChange={e => setFormData(prev => ({ ...prev, numero_processo: e.target.value }))}
                  placeholder="Número do processo administrativo"
                />
              </div>

              <div className="space-y-2">
                <Label>Ato Concessório</Label>
                <Input
                  value={formData.ato_concessorio}
                  onChange={e => setFormData(prev => ({ ...prev, ato_concessorio: e.target.value }))}
                  placeholder="Ex: Decreto 12345/2025"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, ativo: v }))}
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={!formData.nome || !formData.tipo_incentivo}
                className="w-full"
              >
                {editando ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Incentivos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalAtivos}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Limite Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(resumo.valorLimiteTotal)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Utilizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.valorUtilizado)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.valorLimiteTotal - resumo.valorUtilizado)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lista de Incentivos */}
      <Card>
        <CardHeader>
          <CardTitle>Incentivos Cadastrados</CardTitle>
          <CardDescription>
            {incentivos.length} incentivo(s) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incentivos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum incentivo fiscal cadastrado</p>
              <p className="text-sm">Clique em "Novo Incentivo" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incentivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="text-right">Limite</TableHead>
                  <TableHead className="text-right">Utilizado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {incentivos.map((incentivo) => {
                    const utilizacao = incentivo.limite_valor 
                      ? ((incentivo.valor_utilizado_ano || 0) / incentivo.limite_valor) * 100 
                      : 0;
                    
                    return (
                      <motion.tr
                        key={incentivo.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{incentivo.nome}</p>
                            {incentivo.numero_processo && (
                              <p className="text-xs text-muted-foreground">
                                Proc. {incentivo.numero_processo}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTipoLabel(incentivo.tipo_incentivo)}</Badge>
                        </TableCell>
                        <TableCell>
                          {incentivo.ano_inicio}
                          {incentivo.ano_fim ? ` - ${incentivo.ano_fim}` : '+'}
                        </TableCell>
                        <TableCell className="text-right">
                          {incentivo.limite_valor 
                            ? formatCurrency(incentivo.limite_valor)
                            : incentivo.limite_percentual 
                              ? `${incentivo.limite_percentual}%`
                              : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <span>{formatCurrency(incentivo.valor_utilizado_ano || 0)}</span>
                            {incentivo.limite_valor && (
                              <Progress value={utilizacao} className="h-1" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {incentivo.ativo ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(incentivo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => excluirIncentivo.mutate(incentivo.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default IncentivosFiscaisPanel;
