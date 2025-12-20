import { useState, useRef } from 'react';
import { FileUp, Loader2, FileText, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DocumentAnalyzerProps {
  onAnalysisComplete: (analysis: string) => void;
}

interface AnalyzedDocument {
  name: string;
  type: string;
  size: number;
  analysis?: string;
  status: 'uploading' | 'analyzing' | 'complete' | 'error';
}

export function DocumentAnalyzer({ onAnalysisComplete }: DocumentAnalyzerProps) {
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    const validTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'text/plain', 'image/png', 'image/jpeg'];
    
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`Tipo de arquivo não suportado: ${file.name}`);
        continue;
      }

      const doc: AnalyzedDocument = {
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'uploading',
      };

      setDocuments(prev => [...prev, doc]);

      try {
        // Convert file to base64
        const base64 = await fileToBase64(file);
        
        setDocuments(prev => 
          prev.map(d => d.name === file.name ? { ...d, status: 'analyzing' } : d)
        );

        // Send to edge function for analysis
        const { data, error } = await supabase.functions.invoke('analyze-document', {
          body: { 
            fileName: file.name,
            fileType: file.type,
            fileContent: base64,
          }
        });

        if (error) throw error;

        const analysis = data.analysis || 'Análise concluída sem resultados específicos.';
        
        setDocuments(prev => 
          prev.map(d => d.name === file.name ? { ...d, status: 'complete', analysis } : d)
        );

        // Notify parent with analysis
        onAnalysisComplete(`📄 **Análise do documento "${file.name}":**\n\n${analysis}`);
        toast.success(`Documento "${file.name}" analisado com sucesso!`);

      } catch (error) {
        console.error('Error analyzing document:', error);
        setDocuments(prev => 
          prev.map(d => d.name === file.name ? { ...d, status: 'error' } : d)
        );
        toast.error(`Erro ao analisar "${file.name}"`);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const removeDocument = (name: string) => {
    setDocuments(prev => prev.filter(d => d.name !== name));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: AnalyzedDocument['status']) => {
    switch (status) {
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (status: AnalyzedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return 'Enviando...';
      case 'analyzing':
        return 'Analisando...';
      case 'complete':
        return 'Concluído';
      case 'error':
        return 'Erro';
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arraste documentos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Excel, CSV, imagens (até 10MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <Card key={`${doc.name}-${index}`} className="p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(doc.status)}
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  {(doc.status === 'uploading' || doc.status === 'analyzing') && (
                    <Progress className="h-1 mt-2" value={doc.status === 'uploading' ? 30 : 70} />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.name)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
