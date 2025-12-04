// ============================================
// Mind Map - PresentationMode Component
// Modo apresentação em tela cheia
// ============================================

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useMarkmap, useFullscreen } from '@/hooks';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  RotateCcw,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PresentationModeProps {
  markdown: string;
}

export function PresentationMode({ markdown }: PresentationModeProps) {
  const { setPresentationMode } = useAppStore();
  const { 
    svgRef, 
    markmapRef,
    isReady, 
    fit, 
    zoomIn, 
    zoomOut,
  } = useMarkmap({ markdown, autoFit: true });
  
  const { 
    isFullscreen, 
    elementRef, 
    enterFullscreen, 
    exitFullscreen 
  } = useFullscreen();

  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // Mouse movement shows controls
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimer();
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [resetControlsTimer, controlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setPresentationMode(false);
          break;
        case 'f':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            enterFullscreen();
          }
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          fit();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          // Could implement node navigation here
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          // Could implement node navigation here
          break;
      }
      resetControlsTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPresentationMode, isFullscreen, enterFullscreen, exitFullscreen, zoomIn, zoomOut, fit, resetControlsTimer]);

  // Enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();
    return () => {
      exitFullscreen();
    };
  }, []);

  return (
    <div 
      ref={elementRef}
      className="presentation-mode"
      onMouseMove={resetControlsTimer}
    >
      {/* Mind Map */}
      <svg
        ref={svgRef}
        className="markmap w-full h-full"
      />

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top bar - Exit button */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 z-10"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPresentationMode(false)}
                className="shadow-lg"
              >
                <X className="w-4 h-4 mr-2" />
                Sair (ESC)
              </Button>
            </motion.div>

            {/* Bottom controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="presentation-controls"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={zoomOut}
                title="Diminuir zoom (-)"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={zoomIn}
                title="Aumentar zoom (+)"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>

              <div className="w-px h-6 bg-[rgb(var(--border))]" />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fit}
                title="Ajustar à tela (0)"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>

              <div className="w-px h-6 bg-[rgb(var(--border))]" />

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => isFullscreen ? exitFullscreen() : enterFullscreen()}
                title="Tela cheia (F)"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
            </motion.div>

            {/* Help tooltip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs text-[rgb(var(--muted-foreground))] bg-[rgb(var(--card))]/90 px-3 py-1.5 rounded-full"
            >
              Arraste para mover • Scroll para zoom • Clique nos nós para expandir
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--background))]">
          <div className="animate-spin w-12 h-12 border-3 border-[rgb(var(--primary))] border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

export default PresentationMode;
