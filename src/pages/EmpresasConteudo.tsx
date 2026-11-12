import { motion } from 'framer-motion';
import { MoreVertical, Edit, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Empresa } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { itemVariants } from './Empresas.helpers';

interface EmpresasConteudoProps {
  empresasFiltradas: {
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
  getEmpresaStats: (empresaId: string) => {
    saldoTotal: number;
    contasBancarias: number;
    aReceber: number;
    aPagar: number;
    titulosReceber: number;
    titulosPagar: number;
  };
  selectedEmpresa: string;
  copyToClipboard: (text: string) => void;
  formatCNPJ: (cnpj: string) => string;
  setSelectedEmpresa: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  handleOpenDialog: (empresa?: Empresa) => void;
  handleToggleAtivo: (empresa: Empresa) => Promise<void>;
}

export function EmpresasConteudo({
  empresasFiltradas,
  getEmpresaStats,
  selectedEmpresa,
  copyToClipboard,
  formatCNPJ,
  setSelectedEmpresa,
  handleOpenDialog,
  handleToggleAtivo,
}: EmpresasConteudoProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-border/60">
              <TableHead className="font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Empresa
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                CNPJ
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Saldo
              </TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                A Receber
              </TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                A Pagar
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresasFiltradas.map((empresa) => {
              const stats = getEmpresaStats(empresa.id);
              return (
                <TableRow
                  key={empresa.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    !empresa.ativo && 'opacity-50',
                    selectedEmpresa === empresa.id && 'bg-primary/5'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold',
                          empresa.ativo
                            ? 'text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                        style={
                          empresa.ativo ? { background: 'var(--gradient-primary)' } : undefined
                        }
                      >
                        {(empresa.nome_fantasia || empresa.razao_social).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {empresa.nome_fantasia || empresa.razao_social}
                        </p>
                        {empresa.nome_fantasia && (
                          <p className="text-[11px] text-muted-foreground">
                            {empresa.razao_social}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] cursor-pointer"
                      onClick={() => copyToClipboard(empresa.cnpj ?? '')}
                    >
                      {formatCNPJ(empresa.cnpj ?? '')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={empresa.ativo ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px]',
                        empresa.ativo && 'bg-success/15 text-success border-success/30'
                      )}
                    >
                      {empresa.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-bold text-sm',
                      stats.saldoTotal >= 0 ? 'text-foreground' : 'text-destructive'
                    )}
                  >
                    {formatCurrency(stats.saldoTotal)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm text-success">
                    {formatCurrency(stats.aReceber)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm text-destructive">
                    {formatCurrency(stats.aPagar)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Selecionar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleAtivo(empresa)}
                          className={empresa.ativo ? 'text-destructive' : 'text-success'}
                        >
                          {empresa.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}
