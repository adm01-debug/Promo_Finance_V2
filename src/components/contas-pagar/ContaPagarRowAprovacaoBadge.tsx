import { ShieldCheck, ShieldX, ShieldAlert, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface SolicitacaoAprovacao {
  id: string;
  status: string;
  solicitado_em: string;
  solicitado_por: string;
  aprovado_em?: string | null;
  aprovado_por?: string | null;
  observacoes?: string | null;
  motivo_rejeicao?: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ContaPagarRowAprovacaoBadgeProps {
  estaAprovado: boolean;
  temSolicitacaoPendente: boolean;
  foiRejeitado: boolean;
  aguardandoSolicitacao: boolean;
  historico: SolicitacaoAprovacao[];
  profilesMap: Map<string, Profile>;
  valorMinimoAprovacao: number;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
}

const getStatusIcon = (statusAprovacao: string) => {
  switch (statusAprovacao) {
    case 'aprovada':
      return <ShieldCheck className="h-4 w-4 text-success mt-0.5" />;
    case 'rejeitada':
      return <ShieldX className="h-4 w-4 text-destructive mt-0.5" />;
    case 'pendente':
      return <Clock className="h-4 w-4 text-warning mt-0.5" />;
    default:
      return <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5" />;
  }
};

const getStatusLabel = (statusAprovacao: string) => {
  switch (statusAprovacao) {
    case 'aprovada': return 'Aprovada';
    case 'rejeitada': return 'Rejeitada';
    case 'pendente': return 'Aguardando Aprovação';
    default: return statusAprovacao;
  }
};

export function ContaPagarRowAprovacaoBadge({
  estaAprovado,
  temSolicitacaoPendente,
  foiRejeitado,
  aguardandoSolicitacao,
  historico,
  profilesMap,
  valorMinimoAprovacao,
  aprovado_por,
  aprovado_em,
}: ContaPagarRowAprovacaoBadgeProps) {
  const temHistorico = historico.length > 0;

  const getBadgeContent = () => {
    if (estaAprovado) {
      return (
        <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors">
          <ShieldCheck className="h-3 w-3" />
          Aprovado
        </Badge>
      );
    }
    if (temSolicitacaoPendente) {
      return (
        <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors animate-pulse">
          <Clock className="h-3 w-3" />
          Aguardando
        </Badge>
      );
    }
    if (foiRejeitado) {
      return (
        <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors">
          <ShieldX className="h-3 w-3" />
          Rejeitado
        </Badge>
      );
    }
    if (aguardandoSolicitacao) {
      return (
        <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors">
          <ShieldAlert className="h-3 w-3" />
          Requer
        </Badge>
      );
    }
    return (
      <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        {temHistorico ? 'Ver histórico' : '-'}
      </span>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded">
          {getBadgeContent()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Aprovação
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {temHistorico ? `${historico.length} registro(s)` : 'Nenhum registro'}
          </p>
        </div>

        <ScrollArea className="max-h-64">
          <div className="p-2 space-y-2">
            {estaAprovado && (
              <div className="p-2 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-success mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-success">Aprovado na Conta</p>
                    {aprovado_por && (
                      <p className="text-xs text-muted-foreground">
                        Por: {profilesMap.get(aprovado_por)?.full_name || profilesMap.get(aprovado_por)?.email || 'Usuário'}
                      </p>
                    )}
                    {aprovado_em && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(aprovado_em))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {historico.map((item, idx) => {
              const solicitante = profilesMap.get(item.solicitado_por);
              const aprovador = item.aprovado_por ? profilesMap.get(item.aprovado_por) : null;
              return (
                <div key={item.id || idx} className="p-2 rounded-lg bg-muted/30 border">
                  <div className="flex items-start gap-2">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{getStatusLabel(item.status)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Solicitado: {formatDate(new Date(item.solicitado_em))}
                      </p>
                      {solicitante && (
                        <p className="text-xs text-muted-foreground">
                          Por: {solicitante.full_name || solicitante.email}
                        </p>
                      )}
                      {item.aprovado_em && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.status === 'aprovada' ? 'Aprovado' : 'Respondido'}: {formatDate(new Date(item.aprovado_em))}
                          {aprovador && ` por ${aprovador.full_name || aprovador.email}`}
                        </p>
                      )}
                      {item.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{item.observacoes}"
                        </p>
                      )}
                      {item.motivo_rejeicao && (
                        <p className="text-xs text-destructive mt-1">
                          Motivo: {item.motivo_rejeicao}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {aguardandoSolicitacao && !temHistorico && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>Valor acima de {formatCurrency(valorMinimoAprovacao)}</p>
                <p className="text-xs">Requer aprovação antes do pagamento</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
