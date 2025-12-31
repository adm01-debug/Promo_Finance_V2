import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function FontSizeControl() {
  const [fontSize, setFontSize] = useState(16);
  
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);
  
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setFontSize(f => Math.max(12, f - 2))}
        aria-label="Diminuir fonte"
      >
        A-
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setFontSize(16)}
        aria-label="Fonte padrão"
      >
        A
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setFontSize(f => Math.min(24, f + 2))}
        aria-label="Aumentar fonte"
      >
        A+
      </Button>
    </div>
  );
}
