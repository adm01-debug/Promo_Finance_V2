import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Match } from './types';

interface MatchCardProps {
  match: Match;
  children: React.ReactNode;
}

export function MatchCard({ match, children }: MatchCardProps) {
  return (
    <Card className={`border-l-4 ${
      match.confidence > 0.9 ? 'border-l-green-500' :
      match.confidence > 0.7 ? 'border-l-yellow-500' :
      'border-l-red-500'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Match #{match.id}</h3>
          <span className="text-sm text-muted-foreground">
            {new Date(match.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
