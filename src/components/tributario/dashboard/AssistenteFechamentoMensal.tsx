// ============================================
// COMPONENT: AssistenteFechamentoMensal (P10)
// Wizard de checklist + execução
// ============================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Lock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFechamentoTributario } from "@/hooks/useFechamentoTributario";

interface Props {
  empresaId: string;
  ano: number;
  mes: number;
  isAdmin?: boolean;
}

export function AssistenteFechamentoMensal({ empresaId, ano, mes, isAdmin }: Props) {
  const { fechamento, executar, executando, ultimoResultado } = useFechamentoTributario(empresaId, ano, mes);
  const [observacoes, setObservacoes] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [showForce, setShowForce] = useState(false);

  const checks = (ultimoResultado?.checks ?? (fechamento?.checklist as typeof ultimoResultado.checks)) ?? [];
  const status = (ultimoResultado?.status ?? fechamento?.status) as string | undefined;
  const isFechado = status === "fechado";
  const criticalFails = checks.filter((c) => c.critical && !c.ok);

  const handleExecutar = async (forcar = false) => {
    await executar({
      empresa_id: empresaId,
      ano, mes,
      observacoes: observacoes || undefined,
      forcar,
      justificativa: forcar ? justificativa : undefined,
    });
    setShowForce(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFechado ? <Lock className="h-5 w-5 text-success" /> : <ShieldAlert className="h-5 w-5 text-primary" />}
          Assistente de Fechamento Mensal — {String(mes).padStart(2, "0")}/{ano}
          {status && (
            <Badge variant={isFechado ? "default" : status === "em_revisao" ? "destructive" : "secondary"}>
              {status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {checks.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-md border bg-card"
                >
                  {c.ok
                    ? <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    : c.critical
                      ? <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      : <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.detail}</div>
                  </div>
                  {c.critical && !c.ok && (
                    <Badge variant="destructive" className="text-xs">crítico</Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {ultimoResultado?.message && !isFechado && (
          <Alert variant="destructive">
            <AlertTitle>Bloqueado</AlertTitle>
            <AlertDescription>{ultimoResultado.message}</AlertDescription>
          </Alert>
        )}

        {!isFechado && (
          <>
            <Textarea
              placeholder="Observações do fechamento (opcional)..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleExecutar(false)} disabled={executando}>
                {executando && <Loader2 className="h-4 w-4 animate-spin" />}
                Validar e fechar período
              </Button>
              {criticalFails.length > 0 && isAdmin && (
                <Button variant="destructive" onClick={() => setShowForce((v) => !v)}>
                  Forçar fechamento (admin)
                </Button>
              )}
            </div>

            {showForce && (
              <div className="space-y-2 p-3 border border-destructive/30 rounded-md bg-destructive/5">
                <div className="text-sm font-medium text-destructive">
                  Justificativa obrigatória para fechamento forçado
                </div>
                <Textarea
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Descreva por que o fechamento está sendo forçado mesmo com falhas críticas..."
                  rows={3}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!justificativa.trim() || executando}
                  onClick={() => handleExecutar(true)}
                >
                  Confirmar fechamento forçado
                </Button>
              </div>
            )}
          </>
        )}

        {isFechado && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Período fechado</AlertTitle>
            <AlertDescription>
              Score conformidade:{" "}
              <strong>{Number(fechamentoData?.score_conformidade ?? 0).toFixed(0)}/100</strong>
              {" • "}Total apurado:{" "}
              <strong>R$ {Number(fechamentoData?.total_apurado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
