import { Progress } from '@/components/ui/progress';

interface ConfidenceScoreProps {
  confidence: number;
}

export function ConfidenceScore({ confidence }: ConfidenceScoreProps) {
  const percentage = Math.round(confidence * 100);
  
  const getColorClass = () => {
    if (confidence > 0.9) return 'text-green-600';
    if (confidence > 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLabel = () => {
    if (confidence > 0.9) return 'Alta confiança';
    if (confidence > 0.7) return 'Média confiança';
    return 'Baixa confiança';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Confiança do Match</span>
        <span className={`text-sm font-bold ${getColorClass()}`}>
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className={`text-xs ${getColorClass()}`}>{getLabel()}</p>
    </div>
  );
}
