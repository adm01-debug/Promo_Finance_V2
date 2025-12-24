import { ReactNode } from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
  className?: string;
  highlightClassName?: string;
}

export function HighlightText({ 
  text, 
  searchTerm, 
  className = '',
  highlightClassName = 'bg-warning/30 text-warning-foreground rounded px-0.5 font-medium'
}: HighlightTextProps) {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className={highlightClassName}>{part}</mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Hook para usar highlight em listas
export function useSearchHighlight(searchTerm: string) {
  const highlight = (text: string): ReactNode => {
    if (!searchTerm.trim()) return text;
    return <HighlightText text={text} searchTerm={searchTerm} />;
  };
  
  return { highlight, searchTerm };
}
