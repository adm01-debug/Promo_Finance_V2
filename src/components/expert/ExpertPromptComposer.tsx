import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { ChevronDown, ChevronUp, FileUp, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DocumentAnalyzer } from './DocumentAnalyzer';

interface ExpertPromptComposerProps {
  input: string;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  showDocumentUpload: boolean;
  onInputChange: (value: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onShowDocumentUploadChange: (open: boolean) => void;
  onDocumentAnalysisComplete: (analysis: string) => void;
}

export function ExpertPromptComposer({
  input,
  isLoading,
  textareaRef,
  showDocumentUpload,
  onInputChange,
  onInputKeyDown,
  onSubmit,
  onShowDocumentUploadChange,
  onDocumentAnalysisComplete,
}: ExpertPromptComposerProps) {
  return (
    <div className="p-4 border-t bg-card/50">
      <div className="max-w-3xl mx-auto">
        <Collapsible open={showDocumentUpload} onOpenChange={onShowDocumentUploadChange}>
          <div className="flex items-center gap-2 mb-3">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileUp className="h-4 w-4" />
                Analisar Documento
                {showDocumentUpload ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <span className="text-xs text-muted-foreground">
              Upload de PDF, planilhas ou imagens para análise
            </span>
          </div>
          <CollapsibleContent className="mb-3">
            <DocumentAnalyzer onAnalysisComplete={onDocumentAnalysisComplete} />
          </CollapsibleContent>
        </Collapsible>
        <form onSubmit={onSubmit}>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Digite sua pergunta para o EXPERT..."
              className="min-h-[60px] max-h-[200px] pr-14 resize-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 h-10 w-10 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Pressione Enter para enviar ou Shift+Enter para nova linha
          </p>
        </form>
      </div>
    </div>
  );
}
