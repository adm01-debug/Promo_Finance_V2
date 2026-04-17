import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, type LucideIcon } from 'lucide-react';

interface Modelo { id: string; nome: string; categoria: string; icon: LucideIcon }

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function RelatoriosModelos({ modelos }: { modelos: Modelo[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modelos.map((relatorio) => {
        const Icon = relatorio.icon;
        return (
          <motion.div key={relatorio.id} variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{relatorio.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{relatorio.categoria}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Visualizar
                    </Button>
                    <Button size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Gerar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
