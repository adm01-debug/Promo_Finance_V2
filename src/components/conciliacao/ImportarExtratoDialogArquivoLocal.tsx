import { motion } from 'framer-motion';
import { Upload, FileText, ShieldCheck, Link2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ImportarExtratoDialogArquivoLocalProps {
  activeTab: string;
  setActiveTab: import('react').Dispatch<import('react').SetStateAction<string>>;
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (files: FileList | null) => void;
  handleOpenFinanceConnect: () => Promise<void>;
}

export function ImportarExtratoDialogArquivoLocal({
  activeTab,
  setActiveTab,
  dragActive,
  handleDrag,
  handleDrop,
  handleFileSelect,
  handleOpenFinanceConnect,
}: ImportarExtratoDialogArquivoLocalProps) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="py-4"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="arquivo" className="gap-2">
            <FileText className="h-4 w-4" />
            Arquivo Local
          </TabsTrigger>
          <TabsTrigger value="open-finance" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Open Finance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arquivo">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/30'
            )}
            role="button"
            tabIndex={0}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('ofx-file-upload')?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('ofx-file-upload')?.click();
              }
            }}
          >
            <input
              id="ofx-file-upload"
              type="file"
              accept=".ofx,.ofc,.csv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <div
              className={cn(
                'h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all',
                dragActive
                  ? 'bg-primary text-primary-foreground scale-110'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <Upload className="h-8 w-8" />
            </div>
            <p className="font-medium text-foreground">
              {dragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo aqui'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-xs">
                .OFX
              </Badge>
              <Badge variant="outline" className="text-xs">
                .OFC
              </Badge>
              <Badge variant="outline" className="text-xs">
                .CSV
              </Badge>
              <Badge variant="outline" className="text-xs">
                .TXT
              </Badge>
              <Badge variant="outline" className="text-xs">
                .XLSX
              </Badge>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="open-finance">
          <div className="border border-primary/20 bg-primary/5 rounded-2xl p-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-lg">Conexão Bancária Direta</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                A conexão via Open Finance ainda não foi homologada: nenhuma instituição está
                conectada. Use o arquivo OFX, OFC ou CSV do banco na outra aba.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 py-4 opacity-50 grayscale hover:grayscale-0 transition-all">
              <Building2 className="h-6 w-6" />
              <Building2 className="h-6 w-6" />
              <Building2 className="h-6 w-6" />
              <Building2 className="h-6 w-6" />
            </div>
            {/* Antes este botão fingia conectar e inventava três transações, que a
                confirmação gravava em transacoes_bancarias. Fica desabilitado
                enquanto não houver provedor homologado. */}
            <Button
              onClick={handleOpenFinanceConnect}
              disabled
              title="Integração Open Finance ainda não homologada: nenhuma instituição pode ser conectada."
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Link2 className="h-4 w-4" /> Conectar via Open Finance
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {activeTab === 'arquivo' && (
        <div className="mt-4 p-3 rounded-lg bg-accent/30 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Formatos suportados:</p>
          <ul className="space-y-1 text-xs">
            <li>
              • <strong>OFX/OFC</strong> - Formato padrão de bancos brasileiros
            </li>
            <li>
              • <strong>CSV/TXT</strong> - Colunas: Data, Descrição, Valor, Tipo
            </li>
            <li>
              • <strong>XLSX/XLS</strong> - Colunas: Data, Descrição, Valor
            </li>
          </ul>
        </div>
      )}
    </motion.div>
  );
}
