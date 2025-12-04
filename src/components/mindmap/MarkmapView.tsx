// ============================================
// Mind Map - MarkmapView Component
// Visualização do mind map com controles
// ============================================

'use client';

import { useEffect, useCallback } from 'react';
import { useMarkmap } from '@/hooks';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Presentation 
} from 'lucide-react';

interface MarkmapViewProps {
  markdown: string;
}

export function MarkmapView({ markdown }: MarkmapViewProps) {
  const { setPresentationMode } = useAppStore();
  const { 
    svgRef, 
    isReady, 
    fit, 
    zoomIn, 
    zoomOut, 
    resetZoom 
  } = useMarkmap({ markdown, autoFit: true });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
        }
      }
      
      // F key for fullscreen/presentation
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setPresentationMode(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom, setPresentationMode]);

  return (
    <div className="h-full flex flex-col">
      {/* Header com controles */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
        <h3 className="font-semibold text-[rgb(var(--foreground))]">
          Preview
        </h3>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={zoomOut}
            title="Diminuir zoom (Ctrl -)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={zoomIn}
            title="Aumentar zoom (Ctrl +)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fit}
            title="Ajustar à tela (Ctrl 0)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-[rgb(var(--border))] mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setPresentationMode(true)}
            title="Modo apresentação (F)"
          >
            <Presentation className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Markmap container */}
      <div className="flex-1 relative overflow-hidden bg-[rgb(var(--secondary))]/30">
        {!markdown ? (
          <div className="absolute inset-0 flex items-center justify-center text-[rgb(var(--muted-foreground))]">
            <p>Adicione conteúdo para visualizar o mapa mental</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="markmap w-full h-full"
          />
        )}

        {/* Loading state */}
        {markdown && !isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--card))]/80">
            <div className="animate-spin w-8 h-8 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Footer com dicas */}
      <div className="px-4 py-2 border-t border-[rgb(var(--border))] bg-[rgb(var(--secondary))]/30">
        <p className="text-xs text-[rgb(var(--muted-foreground))] text-center">
          Arraste para mover • Scroll para zoom • Clique nos nós para expandir/colapsar • <kbd className="px-1 py-0.5 bg-[rgb(var(--secondary))] rounded text-[10px]">F</kbd> apresentação
        </p>
      </div>
    </div>
  );
}

export default MarkmapView;
