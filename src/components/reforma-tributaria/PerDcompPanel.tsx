// ============================================
// COMPONENTE: PER/DCOMP DIGITAL
// Pedido de Restituição e Compensação
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import usePerDcomp, { TipoPedido, TipoCreditoOrigem } from '@/hooks/usePerDcomp';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { PerDcompStats } from './per-dcomp/PerDcompStats';
import { PerDcompTable } from './per-dcomp/PerDcompTable';
import { PerDcompFormDialog, type PerDcompFormData } from './per-dcomp/PerDcompFormDialog';

const INITIAL_FORM: PerDcompFormData = {
  tipo: 'dcomp',
  tipo_credito_origem: 'saldo_negativo',
  tributo_origem: 'cbs',
  competencia_origem: format(new Date(), 'yyyy-MM'),
  valor_original: 0,
  tributo_destino: '',
  competencia_destino: '',
  justificativa: '',
};

export function PerDcompPanel() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PerDcompFormData>(INITIAL_FORM);

  const { data: empresas = [] } = useAllEmpresas();
  const {
    pedidos,
    estatisticas,
    criarPedido,
    transmitirPedido,
    cancelarPedido,
    TRIBUTOS_VALIDOS,
    TIPOS_CREDITO_ORIGEM,
  } = usePerDcomp(empresaId || undefined);

  const { creditos } = useCreditosTributarios(empresaId || undefined);
  const creditosDisponiveis = creditos.filter(c => c.status === 'disponivel');

  const handleCriarPedido = () => {
    if (!empresaId) return;

    criarPedido.mutate({
      empresa_id: empresaId,
      tipo: formData.tipo,
      tipo_credito_origem: formData.tipo_credito_origem,
      tributo_origem: formData.tributo_origem,
      competencia_origem: formData.competencia_origem,
      valor_original: formData.valor_original,
      tributo_destino: formData.tipo === 'dcomp' ? formData.tributo_destino : undefined,
      competencia_destino: formData.tipo === 'dcomp' ? formData.competencia_destino : undefined,
      justificativa: formData.justificativa,
      creditos_ids: [],
      status: 'rascunho',
    });

    setDialogOpen(false);
    setFormData(INITIAL_FORM);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            PER/DCOMP Digital
          </CardTitle>
          <CardDescription>
            Pedido Eletrônico de Restituição e Declaração de Compensação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-48">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button disabled={!empresaId} onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>

            <PerDcompFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCriarPedido}
              TRIBUTOS_VALIDOS={TRIBUTOS_VALIDOS}
              TIPOS_CREDITO_ORIGEM={TIPOS_CREDITO_ORIGEM}
            />
          </div>
        </CardContent>
      </Card>

      {empresaId && (
        <>
          <PerDcompStats estatisticas={estatisticas} />

          {creditosDisponiveis.length > 0 && (
            <Card className="border-success/20 bg-success/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Créditos Disponíveis para Compensação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {creditosDisponiveis.slice(0, 5).map((credito) => (
                    <div key={credito.id} className="p-3 bg-card rounded-lg border">
                      <p className="font-medium">{credito.tipo_tributo}</p>
                      <p className="text-sm text-muted-foreground">{credito.competencia_origem}</p>
                      <p className="text-lg font-bold text-success">
                        {formatCurrency(credito.saldo_disponivel || 0)}
                      </p>
                    </div>
                  ))}
                  {creditosDisponiveis.length > 5 && (
                    <div className="p-3 flex items-center text-muted-foreground">
                      +{creditosDisponiveis.length - 5} mais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <PerDcompTable
            pedidos={pedidos}
            onTransmitir={(id) => transmitirPedido.mutate(id)}
            onCancelar={(id) => cancelarPedido.mutate(id)}
          />
        </>
      )}
    </div>
  );
}

export default PerDcompPanel;
