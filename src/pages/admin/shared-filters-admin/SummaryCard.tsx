import { Card, CardContent } from '@/components/ui/card';

export function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-2xl font-bold mt-1 ${
            tone === 'warning' && value > 0 ? 'text-warning' : ''
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
