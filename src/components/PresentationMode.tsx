// ============================================
// MODO APRESENTAÇÃO - CORRIGIDO
// ============================================

'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Home
} from 'lucide-react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { cn } from '@/lib/utils';
import { useMindMapStore } from '@/store/mindmapStore';
import { Button } from './ui/Button';

const transformer = new Transformer();

interface PresentationModeProps {
  onExit: () => void;
}

export function PresentationMode({ onExit }: PresentationModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  
  const { markdown, mindMapData } = useMindMapStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);
  
  // Inicializar Markmap
  useEffect(() => {
    if (!svgRef.current || !markdown) return;
    
    const options = {
      autoFit: true,
      duration: 300,
      maxWidth: 300,
      colorFreezeLevel: 2,
      initialExpandLevel: -1,
      zoom: true,
      pan: true,
      color: (node: { state?: { depth: number } }) => {
        const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
        return colors[(node.state?.depth || 0) % colors.length];
      },
    };
    
    markmapRef.current = Markmap.create(svgRef.current, options);
    
    const { root } = transformer.transform(markdown);
    markmapRef.current.setData(root);
    
    setTimeout(() => {
      markmapRef.current?.fit();
    }, 200);
    
    return () => {
      markmapRef.current = null;
    };
  }, [markdown]);
  
  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen não suportado:', e);
    }
  }, []);
  
  // Monitorar mudanças no fullscreen
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);
  
  // Zoom
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.25, 3);
    setZoom(newZoom);
    markmapRef.current?.rescale(newZoom);
  }, [zoom]);
  
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    setZoom(newZoom);
    markmapRef.current?.rescale(newZoom);
  }, [zoom]);
  
  const handleFit = useCallback(() => {
    setZoom(1);
    markmapRef.current?.fit();
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onExit();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleFit();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, handleZoomIn, handleZoomOut, handleFit, toggleFullscreen, isFullscreen]);
  
  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);
  
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white"
    >
      {/* Mind Map */}
      <div className="absolute inset-0">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      
      {/* Controles superiores */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-gray-900/70 to-transparent"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {/* Título */}
              <div className="text-white">
                <h2 className="text-lg font-semibold">
                  {mindMapData?.title || 'Mind Map'}
                </h2>
                <p className="text-sm text-white/70">
                  Modo Apresentação
                </p>
              </div>
              
              {/* Ações */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleZoomOut} 
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white/80 text-sm min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleZoomIn} 
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/30 mx-2" />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleFit} 
                  className="text-white hover:bg-white/20"
                  title="Ajustar à tela"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleFullscreen} 
                  className="text-white hover:bg-white/20"
                  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                
                <div className="w-px h-6 bg-white/30 mx-2" />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onExit} 
                  className="text-white hover:bg-white/20"
                  title="Sair"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dicas de atalho */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/70 to-transparent"
          >
            <div className="flex items-center justify-center gap-6 text-xs text-white/70">
              <span>Arraste para mover</span>
              <span>Scroll para zoom</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">+</kbd> <kbd className="px-1.5 py-0.5 bg-white/20 rounded">-</kbd> Zoom</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">0</kbd> Ajustar</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">F</kbd> Tela cheia</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> Sair</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
