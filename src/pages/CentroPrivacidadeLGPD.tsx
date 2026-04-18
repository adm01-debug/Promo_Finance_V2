import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  FileDown,
  Eye,
  Trash2,
  Edit3,
  UserX,
  Loader2,
  Download,
} from "lucide-react";
import {
  useSolicitacoesLGPD,
  type TipoSolicitacaoLGPD,
} from "@/hooks/useSolicitacoesLGPD";

const TIPOS: Array<{
  value: TipoSolicitacaoLGPD;
  label: string;
  icon: React.ElementType;
  desc: string;
}> = [
  {
    value: "acesso",
    label: "Acesso aos dados",
    icon: Eye,
    desc: "Receba uma cópia de todos os dados pessoais que mantemos sobre você.",
  },
  {
    value: "portabilidade",
    label: "Portabilidade",
    icon: FileDown,
    desc: "Exporte seus dados em formato CSV estruturado para uso em outro serviço.",
  },
  {
    value: "exclusao",
    label: "Exclusão",
    icon: Trash2,
    desc: "Solicite a exclusão dos seus dados pessoais (anonimização irreversível).",
  },
  {
    value: "retificacao",
    label: "Retificação",
    icon: Edit3,
    desc: "Corrija dados pessoais incorretos ou desatualizados.",
  },
  {
    value: "anonimizacao",
    label: "Anonimização",
    icon: UserX,
    desc: "Mantenha o histórico mas remova identificadores pessoais.",
  },
];

function statusVariant(status: string) {
  if (status === "atendida") return "default";
  if (status === "rejeitada") return "destructive";
  if (status === "em_analise") return "secondary";
  return "outline";
}

export function CentroPrivacidadeLGPD() {
  const [tipo, setTipo] = useState<TipoSolicitacaoLGPD>("acesso");
  const [justificativa, setJustificativa] = useState("");
  const { data: solicitacoes, isLoading, criar, processar } = useSolicitacoesLGPD();

  const handleCriar = () => {
    criar.mutate(
      { tipo, justificativa: justificativa || undefined },
      {
        onSuccess: () => {
          setJustificativa("");
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Centro de Privacidade
          </h1>
          <p className="text-muted-foreground">
            Exerça seus direitos como titular de dados (LGPD - Lei 13.709/2018)
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TIPOS.map((t) => (
          <Card key={t.value} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <t.icon className="h-4 w-4 text-primary" />
                {t.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova solicitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Tipo de direito</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoSolicitacaoLGPD)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Justificativa (opcional)
            </label>
            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva sua solicitação..."
              maxLength={1000}
              rows={3}
            />
          </div>
          <Button onClick={handleCriar} disabled={criar.isPending}>
            {criar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar solicitação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (solicitacoes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma solicitação registrada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {(solicitacoes ?? []).map((s) => {
                const tipoInfo = TIPOS.find((t) => t.value === s.tipo);
                const Icon = tipoInfo?.icon ?? Shield;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-md border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{tipoInfo?.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                      {s.url_dump && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={s.url_dump} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" /> Dump
                          </a>
                        </Button>
                      )}
                      {s.status === "aberta" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processar.mutate(s.id)}
                          disabled={processar.isPending}
                        >
                          {processar.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Processar"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CentroPrivacidadeLGPD;
