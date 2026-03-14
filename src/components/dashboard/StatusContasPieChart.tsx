import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
} from 'recharts';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface StatusData {
  name: string;
  value: number;
  fill: string;
}

interface StatusContasPieChartProps {
  statusContasPagar: StatusData[];
}

export function StatusContasPieChart({ statusContasPagar }: StatusContasPieChartProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-[450px] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <PieChartIcon className="h-4 w-4 text-warning" />
            </div>
            Status Contas a Pagar
          </CardTitle>
          <CardDescription>Distribuição por status</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={statusContasPagar} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="45%" 
                innerRadius={55} 
                outerRadius={90} 
                paddingAngle={4}
                strokeWidth={2}
                stroke="hsl(var(--card))"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusContasPagar.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
