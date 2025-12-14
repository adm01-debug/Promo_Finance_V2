import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useContasPagar, useContasReceber, useContasBancarias } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';

interface BalancoPatrimonialProps {
  periodo: string;
  mes: number;
  ano: number;
  empresaId: string;
}

interface ContaBalanco {
  codigo: string;
  descricao: string;
  valor: number;
  nivel: number;
}

export const BalancoPatrimonial = ({ periodo, mes, ano, empresaId }: BalancoPatrimonialProps) => {
  const { data: contasReceber } = useContasReceber();
  const { data: contasPagar } = useContasPagar();
  const { data: contasBancarias } = useContasBancarias();

  const balanco = useMemo(() => {
    const dataRef = new Date(ano, mes + 1, 0);

    // Filtrar por empresa
    const bancosEmpresa = (contasBancarias || []).filter(
      cb => empresaId === 'todas' || cb.empresa_id === empresaId
    );

    const receberEmpresa = (contasReceber || []).filter(
      cr => empresaId === 'todas' || cr.empresa_id === empresaId
    );

    const pagarEmpresa = (contasPagar || []).filter(
      cp => empresaId === 'todas' || cp.empresa_id === empresaId
    );

    // ATIVO
    // Caixa e Bancos
    const caixaBancos = bancosEmpresa.reduce((acc, cb) => acc + cb.saldo_atual, 0);

    // Contas a Receber (pendentes)
    const contasReceberPendentes = receberEmpresa
      .filter(cr => cr.status === 'pendente' || cr.status === 'vencido')
      .reduce((acc, cr) => acc + cr.valor - (cr.valor_recebido || 0), 0);

    // Ativo Circulante
    const ativoCirculante = caixaBancos + contasReceberPendentes;

    // Ativo Não Circulante (simplificado - valor fixo para demonstração)
    const imobilizado = 50000;
    const ativoNaoCirculante = imobilizado;

    const totalAtivo = ativoCirculante + ativoNaoCirculante;

    // PASSIVO
    // Contas a Pagar (pendentes)
    const contasPagarPendentes = pagarEmpresa
      .filter(cp => cp.status === 'pendente' || cp.status === 'vencido')
      .reduce((acc, cp) => acc + cp.valor - (cp.valor_pago || 0), 0);

    // Obrigações Tributárias (simplificado)
    const obrigacoesTributarias = contasPagarPendentes * 0.1;

    // Passivo Circulante
    const passivoCirculante = contasPagarPendentes + obrigacoesTributarias;

    // Passivo Não Circulante (simplificado)
    const emprestimosLP = 0;
    const passivoNaoCirculante = emprestimosLP;

    // Patrimônio Líquido (diferença para fechar o balanço)
    const capitalSocial = 30000;
    const lucrosAcumulados = totalAtivo - passivoCirculante - passivoNaoCirculante - capitalSocial;
    const patrimonioLiquido = capitalSocial + lucrosAcumulados;

    const totalPassivo = passivoCirculante + passivoNaoCirculante + patrimonioLiquido;

    const ativo: ContaBalanco[] = [
      { codigo: '1', descricao: 'ATIVO TOTAL', valor: totalAtivo, nivel: 0 },
      { codigo: '1.1', descricao: 'ATIVO CIRCULANTE', valor: ativoCirculante, nivel: 1 },
      { codigo: '1.1.1', descricao: 'Caixa e Equivalentes', valor: caixaBancos, nivel: 2 },
      { codigo: '1.1.2', descricao: 'Contas a Receber', valor: contasReceberPendentes, nivel: 2 },
      { codigo: '1.2', descricao: 'ATIVO NÃO CIRCULANTE', valor: ativoNaoCirculante, nivel: 1 },
      { codigo: '1.2.1', descricao: 'Imobilizado', valor: imobilizado, nivel: 2 },
    ];

    const passivo: ContaBalanco[] = [
      { codigo: '2', descricao: 'PASSIVO TOTAL', valor: totalPassivo, nivel: 0 },
      { codigo: '2.1', descricao: 'PASSIVO CIRCULANTE', valor: passivoCirculante, nivel: 1 },
      { codigo: '2.1.1', descricao: 'Fornecedores', valor: contasPagarPendentes, nivel: 2 },
      { codigo: '2.1.2', descricao: 'Obrigações Tributárias', valor: obrigacoesTributarias, nivel: 2 },
      { codigo: '2.2', descricao: 'PASSIVO NÃO CIRCULANTE', valor: passivoNaoCirculante, nivel: 1 },
      { codigo: '2.2.1', descricao: 'Empréstimos LP', valor: emprestimosLP, nivel: 2 },
      { codigo: '3', descricao: 'PATRIMÔNIO LÍQUIDO', valor: patrimonioLiquido, nivel: 0 },
      { codigo: '3.1', descricao: 'Capital Social', valor: capitalSocial, nivel: 1 },
      { codigo: '3.2', descricao: 'Lucros/Prejuízos Acumulados', valor: lucrosAcumulados, nivel: 1 },
    ];

    return { 
      ativo, 
      passivo, 
      totalAtivo, 
      totalPassivo,
      ativoCirculante,
      ativoNaoCirculante,
      passivoCirculante,
      patrimonioLiquido,
      equilibrado: Math.abs(totalAtivo - totalPassivo) < 0.01
    };
  }, [contasReceber, contasPagar, contasBancarias, mes, ano, empresaId]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const renderConta = (conta: ContaBalanco, index: number, total: number) => (
    <motion.tr
      key={conta.codigo}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`
        border-t border-border/30 transition-colors hover:bg-muted/30
        ${conta.nivel === 0 ? 'font-bold bg-muted/30' : ''}
        ${conta.nivel === 1 ? 'font-semibold bg-muted/10' : ''}
      `}
    >
      <td className="p-3 text-sm text-muted-foreground">{conta.codigo}</td>
      <td className={`p-3 text-sm ${conta.nivel === 2 ? 'pl-10' : conta.nivel === 1 ? 'pl-6' : ''}`}>
        {conta.descricao}
      </td>
      <td className="p-3 text-sm text-right tabular-nums">
        {formatCurrency(conta.valor)}
      </td>
      <td className="p-3 text-sm text-right tabular-nums text-muted-foreground">
        {total > 0 ? ((conta.valor / total) * 100).toFixed(1) : 0}%
      </td>
    </motion.tr>
  );

  return (
    <div className="space-y-6">
      {/* Resumo Visual */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Ativo Total</div>
            <div className="text-2xl font-bold">{formatCurrency(balanco.totalAtivo)}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Circulante</span>
                <span>{((balanco.ativoCirculante / balanco.totalAtivo) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(balanco.ativoCirculante / balanco.totalAtivo) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 flex items-center justify-center">
          <CardContent className="pt-6 text-center">
            <Badge variant={balanco.equilibrado ? 'default' : 'destructive'} className="text-lg px-4 py-2">
              {balanco.equilibrado ? '✓ Equilibrado' : '✗ Divergência'}
            </Badge>
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Ativo</span>
              <ArrowRight className="h-4 w-4" />
              <span>Passivo + PL</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Passivo + PL</div>
            <div className="text-2xl font-bold">{formatCurrency(balanco.totalPassivo)}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Patrimônio Líquido</span>
                <span>{((balanco.patrimonioLiquido / balanco.totalPassivo) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(balanco.patrimonioLiquido / balanco.totalPassivo) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balanço Detalhado */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ativo */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-primary" />
              Ativo
            </CardTitle>
            <CardDescription>
              Posição em {meses[mes]} de {ano}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-xs">Cód.</th>
                    <th className="text-left p-3 font-semibold text-xs">Descrição</th>
                    <th className="text-right p-3 font-semibold text-xs">Valor</th>
                    <th className="text-right p-3 font-semibold text-xs">%</th>
                  </tr>
                </thead>
                <tbody>
                  {balanco.ativo.map((conta, index) => renderConta(conta, index, balanco.totalAtivo))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Passivo */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-destructive" />
              Passivo e Patrimônio Líquido
            </CardTitle>
            <CardDescription>
              Posição em {meses[mes]} de {ano}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-xs">Cód.</th>
                    <th className="text-left p-3 font-semibold text-xs">Descrição</th>
                    <th className="text-right p-3 font-semibold text-xs">Valor</th>
                    <th className="text-right p-3 font-semibold text-xs">%</th>
                  </tr>
                </thead>
                <tbody>
                  {balanco.passivo.map((conta, index) => renderConta(conta, index, balanco.totalPassivo))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
