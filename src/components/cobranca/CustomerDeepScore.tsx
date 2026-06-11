import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ShieldCheck, 
  TrendingUp, ExternalLink, 
  History, Info, BrainCircuit
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CustomerDeepScoreProps {
  score: number;
  serasaScore?: number;
  boaVistaScore?: number;
  riscoComportamental?: string;
  lastUpdate?: string;
}

export function CustomerDeepScore({ 
  score, 
  serasaScore = 0, 
  boaVistaScore = 0, 
  riscoComportamental = "Neutro",
  lastUpdate
}: CustomerDeepScoreProps) {
  
  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-success";
    if (val >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (val: number) => {
    if (val >= 80) return <Badge className="bg-success/10 text-success border-success/20">Excelente</Badge>;
    if (val >= 50) return <Badge className="bg-warning/10 text-warning border-warning/20">Atenção</Badge>;
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Alto Risco</Badge>;
  };

  const getExternalScoreColor = (val: number) => {
    if (val >= 800) return "bg-success";
    if (val >= 500) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Deep Score 360°</CardTitle>
              <CardDescription className="text-xs">Análise de crédito multicamadas</CardDescription>
            </div>
          </div>
          {getScoreBadge(score)}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Score Principal */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
             <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * score) / 100}
                  className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${getScoreColor(score)}`}>{score}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Global</span>
              </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-success" />
            <span>+5 pts este mês</span>
          </div>
        </div>

        {/* Scores Externos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Serasa</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black">{serasaScore}</span>
              <span className="text-[10px] text-muted-foreground mb-1">/ 1000</span>
            </div>
            <Progress value={serasaScore / 10} className={`h-1.5 ${getExternalScoreColor(serasaScore)}`} />
          </div>

          <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Boa Vista</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black">{boaVistaScore}</span>
              <span className="text-[10px] text-muted-foreground mb-1">/ 1000</span>
            </div>
            <Progress value={boaVistaScore / 10} className={`h-1.5 ${getExternalScoreColor(boaVistaScore)}`} />
          </div>
        </div>

        {/* Análise Comportamental IA */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <BrainCircuit className="h-4 w-4" />
            Behavioral Insight (IA)
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {riscoComportamental || "O cliente demonstra um padrão de pagamento estável, com tendência a liquidar faturas entre o 2º e 4º dia após o vencimento."}
          </p>
          <div className="flex items-center justify-between pt-1">
             <div className="flex items-center gap-1">
                <History className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Última atualização: {lastUpdate || "Hoje"}</span>
             </div>
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-primary/50" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] w-48">Análise baseada em 24 meses de histórico interno + bureaus de crédito externos.</p>
                  </TooltipContent>
                </Tooltip>
             </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
