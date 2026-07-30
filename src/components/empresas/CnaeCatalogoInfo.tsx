import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ResolucaoCnae } from '@/hooks/useCnaes';

export interface CnaeCatalogoInfoProps {
  resolucao: ResolucaoCnae;
  /** Quantidade de dígitos já digitados — usada para silenciar o aviso enquanto incompleto. */
  digitos: number;
}

/**
 * Feedback do catálogo fiscal para o CNAE informado.
 *
 * Explicita o estado "não catalogado" em vez de deixar o motor cair em
 * fallback conservador silencioso: o usuário precisa saber que o anexo do
 * Simples e as presunções de IRPJ/CSLL serão estimados, não derivados.
 */
export function CnaeCatalogoInfo({ resolucao, digitos }: CnaeCatalogoInfoProps) {
  const { registro, naoCatalogado, carregando } = resolucao;

  if (digitos < 7) return null;

  if (carregando) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Consultando catálogo fiscal…
      </p>
    );
  }

  if (naoCatalogado) {
    return (
      <p className="flex items-start gap-1.5 text-xs text-warning">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          CNAE não catalogado. O motor usará parâmetros conservadores para anexo do Simples,
          presunção de IRPJ/CSLL e RAT — revise os campos abaixo manualmente.
        </span>
      </p>
    );
  }

  if (!registro) return null;

  return (
    <div className="space-y-1.5">
      <p className="flex items-start gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>{registro.descricao}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {registro.vedado_simples ? (
          <Badge variant="destructive" className="text-[10px]">Vedado ao Simples</Badge>
        ) : (
          registro.anexo_simples && (
            <Badge variant="secondary" className="text-[10px]">Anexo {registro.anexo_simples}</Badge>
          )
        )}
        {registro.sujeito_fator_r && (
          <Badge variant="outline" className="text-[10px]">Sujeito ao Fator R</Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          RAT {(registro.rat_padrao * 100).toFixed(0)}%
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          Presunção IRPJ {(registro.presuncao_irpj * 100).toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}
