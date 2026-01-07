import { useState } from 'react';
import { Plus, Repeat, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { InteractivePageWrapper, PrimaryActionButton } from '@/components/wrappers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PagamentoRecorrenteForm } from '@/components/pagamentos-recorrentes/PagamentoRecorrenteForm';
import { PagamentosRecorrentesList } from '@/components/pagamentos-recorrentes/PagamentosRecorrentesList';

export default function PagamentosRecorrentes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/contas-pagar">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <Repeat className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <span className="truncate">Pagamentos Recorrentes</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                Automatize suas despesas fixas
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:h-10 sm:px-4 sm:text-sm flex-shrink-0">
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Novo Recorrente</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Criar Pagamento Recorrente</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Configure um pagamento automático
              </DialogDescription>
            </DialogHeader>
            <PagamentoRecorrenteForm
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-lg">Como funciona?</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Pagamentos recorrentes geram contas automaticamente. Pause, reative ou exclua a qualquer momento.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de pagamentos recorrentes */}
      <PagamentosRecorrentesList />
    </motion.div>
  );
}
