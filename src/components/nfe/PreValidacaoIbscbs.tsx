import { AlertTriangle } from 'lucide-react';
import type { AchadoValidacao } from '@/lib/nfe/pre-validar-ibscbs';

interface PreValidacaoIbscbsProps {
  achados: AchadoValidacao[];
}

/**
 * Lista em PT-BR as rejeicoes que o leiaute da NT 2025.002 devolveria depois do
 * envio (etapa 54 do plano RT/RFB): nota de regime regular sem o grupo, CST sem
 * cClassTrib, cClassTrib fora do catalogo vigente e vIBS diferente da soma das
 * parcelas. Informativo, porque a emissao ja esta bloqueada ate a homologacao
 * SEFAZ confirmar protocolo real.
 */
export function PreValidacaoIbscbs({ achados }: PreValidacaoIbscbsProps) {
  if (achados.length === 0) return null;

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        Pré-validação do grupo IBS/CBS
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
        {achados.map((achado) => (
          <li key={`${achado.regra}-${achado.nItem ?? 0}`}>
            <span className="font-mono text-xs">{achado.regra}</span> {achado.mensagem}
          </li>
        ))}
      </ul>
    </div>
  );
}
