// ============================================
// COMPONENTE: EXPORTAÇÃO SPED/EFD
// Geração de arquivos oficiais
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { gerarEFD_IBS_CBS, gerarEFD_Contribuicoes, downloadArquivoSPED, validarArquivoSPED } from '@/lib/sped-generator';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';

type TipoArquivo = 'efd-ibs-cbs' | 'efd-contribuicoes' | 'dctf' | 'per-dcomp';

const TIPOS_ARQUIVO = [
  { 
    id: 'efd-ibs-cbs' as TipoArquivo, 
    nome: 'EFD-IBS/CBS', 
    descricao: 'Escrituração Fiscal Digital dos novos tributos',
    disponivel: true,
  },
  { 
    id: 'efd-contribuicoes' as TipoArquivo, 
    nome: 'EFD-Contribuições', 
    descricao: 'PIS/COFINS (tributos residuais)',
    disponivel: true,
  },
  { 
    id: 'dctf' as TipoArquivo, 
    nome: 'DCTF', 
    descricao: 'Declaração de Débitos e Créditos',
    disponivel: false,
  },
  { 
    id: 'per-dcomp' as TipoArquivo, 
    nome: 'PER/DCOMP', 
    descricao: 'Pedido de Restituição/Compensação',
    disponivel: false,
  },
];

export function ExportacaoSPED() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));
  const [tipoArquivo, setTipoArquivo] = useState<TipoArquivo>('efd-ibs-cbs');
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const { data: empresas = [] } = useAllEmpresas();
  const { operacoes } = useOperacoesTributaveis(empresaId || undefined);
  const { creditos } = useCreditosTributarios(empresaId || undefined);
  const { apuracoes } = useApuracoesTributarias(empresaId || undefined);

  const empresaSelecionada = empresas.find(e => e.id === empresaId);
  const apuracaoCompetencia = apuracoes.find(a => a.competencia === competencia);

  const handleGerarArquivo = async () => {
    if (!empresaSelecionada) {
      toast.error('Selecione uma empresa');
      return;
    }

    setGerando(true);
    setProgresso(10);

    try {
      // Simular processamento
      await new Promise(r => setTimeout(r, 500));
      setProgresso(30);

      const dadosEmpresa = {
        cnpj: empresaSelecionada.cnpj,
        razaoSocial: empresaSelecionada.razao_social,
        inscricaoEstadual: empresaSelecionada.inscricao_estadual || undefined,
        uf: empresaSelecionada.estado || 'SP',
      };

      // Filtrar operações da competência
      const operacoesCompetencia = operacoes.filter(op => {
        const dataOp = op.data_operacao.substring(0, 7);
        return dataOp === competencia;
      });

      // Filtrar créditos da competência
      const creditosCompetencia = creditos.filter(c => c.competencia_origem === competencia);

      setProgresso(60);

      let conteudo: string;
      let nomeArquivo: string;

      if (tipoArquivo === 'efd-ibs-cbs') {
        const apuracao = apuracaoCompetencia || {
          competencia,
          cbs_debitos: 0,
          cbs_creditos: 0,
          cbs_a_pagar: 0,
          ibs_debitos: 0,
          ibs_creditos: 0,
          ibs_a_pagar: 0,
          is_debitos: 0,
          is_a_pagar: 0,
        };

        conteudo = gerarEFD_IBS_CBS(
          dadosEmpresa,
          competencia,
          operacoesCompetencia.map(op => ({
            ...op,
            cbs_aliquota: op.cbs_aliquota || 0,
            cbs_valor: op.cbs_valor || 0,
            ibs_aliquota: op.ibs_aliquota || 0,
            ibs_valor: op.ibs_valor || 0,
            is_aliquota: op.is_aliquota || 0,
            is_valor: op.is_valor || 0,
          })),
          creditosCompetencia.map(c => ({
            ...c,
            aliquota: c.aliquota || 0,
          })),
          apuracao
        );

        nomeArquivo = `EFD_IBS_CBS_${empresaSelecionada.cnpj.replace(/\D/g, '')}_${competencia.replace('-', '')}.txt`;
      } else {
        conteudo = gerarEFD_Contribuicoes(
          dadosEmpresa,
          competencia,
          operacoesCompetencia.map(op => ({
            ...op,
            cbs_aliquota: op.cbs_aliquota || 0,
            cbs_valor: op.cbs_valor || 0,
            ibs_aliquota: op.ibs_aliquota || 0,
            ibs_valor: op.ibs_valor || 0,
            is_aliquota: op.is_aliquota || 0,
            is_valor: op.is_valor || 0,
          })),
          creditosCompetencia.map(c => ({
            ...c,
            aliquota: c.aliquota || 0,
          }))
        );

        nomeArquivo = `EFD_CONTRIBUICOES_${empresaSelecionada.cnpj.replace(/\D/g, '')}_${competencia.replace('-', '')}.txt`;
      }

      setProgresso(90);

      // Validar arquivo
      const validacao = validarArquivoSPED(conteudo);
      
      if (!validacao.valido) {
        toast.warning('Arquivo gerado com avisos', {
          description: validacao.erros.join('; '),
        });
      }

      // Download
      downloadArquivoSPED(conteudo, nomeArquivo);
      setProgresso(100);

      toast.success('Arquivo SPED gerado com sucesso', {
        description: nomeArquivo,
      });
    } catch (error: unknown) {
      toast.error('Erro ao gerar arquivo');
      logger.error('Erro ao gerar SPED:', error);
    } finally {
      setGerando(false);
      setProgresso(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportação SPED/EFD
          </CardTitle>
          <CardDescription>
            Gere arquivos no formato oficial para transmissão ao Fisco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label>Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Arquivo</Label>
              <Select value={tipoArquivo} onValueChange={(v) => setTipoArquivo(v as TipoArquivo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ARQUIVO.filter(t => t.disponivel).map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {empresaId && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>Dados disponíveis para exportação</AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <span className="text-muted-foreground">Operações:</span>
                    <span className="ml-2 font-medium">
                      {operacoes.filter(o => o.data_operacao.startsWith(competencia)).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créditos:</span>
                    <span className="ml-2 font-medium">
                      {creditos.filter(c => c.competencia_origem === competencia).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Apuração:</span>
                    <span className="ml-2 font-medium">
                      {apuracaoCompetencia ? 'Disponível' : 'Não encontrada'}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {gerando && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gerando arquivo...</span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} />
            </div>
          )}

          <Button
            onClick={handleGerarArquivo}
            disabled={!empresaId || gerando}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Gerar e Baixar Arquivo SPED
          </Button>
        </CardContent>
      </Card>

      {/* Tipos de arquivo disponíveis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIPOS_ARQUIVO.map((tipo) => (
          <Card 
            key={tipo.id} 
            className={`cursor-pointer transition-all ${
              tipoArquivo === tipo.id ? 'ring-2 ring-primary' : ''
            } ${!tipo.disponivel ? 'opacity-50' : ''}`}
            onClick={() => tipo.disponivel && setTipoArquivo(tipo.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{tipo.nome}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tipo.descricao}
                  </p>
                </div>
                {tipo.disponivel ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Badge variant="secondary">Em breve</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações do Layout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">EFD-IBS/CBS</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Layout versão 018 (LC 214/2025)</li>
                <li>• Bloco 0: Identificação</li>
                <li>• Bloco C: Documentos de Mercadorias</li>
                <li>• Bloco D: Documentos de Serviços</li>
                <li>• Bloco M: Apuração IBS/CBS/IS</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">EFD-Contribuições</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Layout versão 006</li>
                <li>• PIS/COFINS residual (até 2033)</li>
                <li>• Regime não-cumulativo</li>
                <li>• Bloco A: Serviços</li>
                <li>• Bloco M: Apuração</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExportacaoSPED;
