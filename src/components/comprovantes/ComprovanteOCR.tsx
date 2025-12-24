import { useState, useRef } from 'react';
import { Camera, FileUp, Loader2, CheckCircle, AlertTriangle, X, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface DadosExtraidos {
  tipo?: string;
  valor?: number;
  data?: string;
  beneficiario?: string;
  pagador?: string;
  banco?: string;
  autenticacao?: string;
  descricao?: string;
}

interface ComprovanteAnalisado {
  id: string;
  name: string;
  status: 'uploading' | 'analyzing' | 'complete' | 'error';
  dadosExtraidos?: DadosExtraidos;
  analiseCompleta?: string;
}

interface ComprovanteOCRProps {
  onDadosExtraidos?: (dados: DadosExtraidos, analise: string) => void;
  onVincularPagamento?: (dados: DadosExtraidos) => void;
}

export function ComprovanteOCR({ onDadosExtraidos, onVincularPagamento }: ComprovanteOCRProps) {
  const [comprovantes, setComprovantes] = useState<ComprovanteAnalisado[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  const extrairDadosDoTexto = (analise: string): DadosExtraidos => {
    const dados: DadosExtraidos = {};
    
    // Extrair valor
    const valorMatch = analise.match(/R\$\s*([\d.,]+)/i) || 
                       analise.match(/valor[:\s]*([\d.,]+)/i);
    if (valorMatch) {
      dados.valor = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Extrair data
    const dataMatch = analise.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dataMatch) {
      const [dia, mes, ano] = dataMatch[1].split('/');
      dados.data = `${ano}-${mes}-${dia}`;
    }

    // Extrair tipo de comprovante
    if (analise.toLowerCase().includes('pix')) dados.tipo = 'PIX';
    else if (analise.toLowerCase().includes('ted')) dados.tipo = 'TED';
    else if (analise.toLowerCase().includes('doc')) dados.tipo = 'DOC';
    else if (analise.toLowerCase().includes('boleto')) dados.tipo = 'Boleto';
    else if (analise.toLowerCase().includes('transferência')) dados.tipo = 'Transferência';
    else dados.tipo = 'Comprovante';

    // Extrair autenticação
    const autMatch = analise.match(/autenticação[:\s]*([A-Z0-9]+)/i) ||
                     analise.match(/código[:\s]*([A-Z0-9]+)/i);
    if (autMatch) {
      dados.autenticacao = autMatch[1];
    }

    return dados;
  };

  const processFiles = async (files: File[]) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`Tipo não suportado: ${file.name}. Use PNG, JPG ou PDF.`);
        continue;
      }

      const id = crypto.randomUUID();
      const comprovante: ComprovanteAnalisado = {
        id,
        name: file.name,
        status: 'uploading',
      };

      setComprovantes(prev => [...prev, comprovante]);

      try {
        const base64 = await fileToBase64(file);
        
        setComprovantes(prev => 
          prev.map(c => c.id === id ? { ...c, status: 'analyzing' } : c)
        );

        const { data, error } = await supabase.functions.invoke('analyze-document', {
          body: { 
            fileName: file.name,
            fileType: file.type,
            fileContent: base64,
          }
        });

        if (error) throw error;

        const analise = data.analysis || '';
        const dadosExtraidos = extrairDadosDoTexto(analise);
        
        setComprovantes(prev => 
          prev.map(c => c.id === id ? { 
            ...c, 
            status: 'complete', 
            dadosExtraidos,
            analiseCompleta: analise
          } : c)
        );

        onDadosExtraidos?.(dadosExtraidos, analise);
        toast.success(`Comprovante analisado com sucesso!`);

      } catch (error) {
        console.error('Erro ao analisar comprovante:', error);
        setComprovantes(prev => 
          prev.map(c => c.id === id ? { ...c, status: 'error' } : c)
        );
        toast.error(`Erro ao analisar "${file.name}"`);
      }
    }
  };

  const removeComprovante = (id: string) => {
    setComprovantes(prev => prev.filter(c => c.id !== id));
  };

  const getStatusIcon = (status: ComprovanteAnalisado['status']) => {
    switch (status) {
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          OCR de Comprovantes
        </CardTitle>
        <CardDescription>
          Envie fotos ou PDFs de comprovantes para extração automática de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
        >
          <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Arraste comprovantes aqui ou use os botões abaixo
          </p>
          
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Câmera
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Arquivo
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Lista de Comprovantes */}
        {comprovantes.length > 0 && (
          <div className="space-y-3">
            {comprovantes.map((comp) => (
              <Card key={comp.id} className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{comp.name}</p>
                      {getStatusIcon(comp.status)}
                    </div>

                    {(comp.status === 'uploading' || comp.status === 'analyzing') && (
                      <Progress 
                        className="h-1.5 mt-2" 
                        value={comp.status === 'uploading' ? 30 : 70} 
                      />
                    )}

                    {comp.status === 'complete' && comp.dadosExtraidos && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {comp.dadosExtraidos.tipo && (
                            <Badge variant="secondary">
                              {comp.dadosExtraidos.tipo}
                            </Badge>
                          )}
                          {comp.dadosExtraidos.valor && (
                            <Badge variant="default" className="bg-emerald-500">
                              {formatCurrency(comp.dadosExtraidos.valor)}
                            </Badge>
                          )}
                          {comp.dadosExtraidos.data && (
                            <Badge variant="outline">
                              {formatDate(comp.dadosExtraidos.data)}
                            </Badge>
                          )}
                        </div>

                        {comp.dadosExtraidos.autenticacao && (
                          <p className="text-xs text-muted-foreground">
                            Autenticação: {comp.dadosExtraidos.autenticacao}
                          </p>
                        )}

                        {onVincularPagamento && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => onVincularPagamento(comp.dadosExtraidos!)}
                          >
                            Vincular a Pagamento
                          </Button>
                        )}
                      </div>
                    )}

                    {comp.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">
                        Não foi possível analisar este comprovante
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeComprovante(comp.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
