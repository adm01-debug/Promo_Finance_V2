import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="h-[450px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-warning" />
            Status Contas a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={statusContasPagar} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={50} 
                outerRadius={80} 
                paddingAngle={3}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusContasPagar.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
