// ============================================
// PÁGINA PRINCIPAL - CORRIGIDA
// ============================================

'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMindMapStore } from '@/store/mindmapStore';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { Tips } from '@/components/Tips';
import { EditorTabs } from '@/components/EditorTabs';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { DragDropEditor } from '@/components/DragDropEditor';
import { MindmapPreview, MindmapPreviewRef } from '@/components/MindmapPreview';
import { PresentationMode } from '@/components/PresentationMode';
import { Particles } from '@/components/Particles';

export default function Home() {
  const { processingStatus, activeTab, mindMapData } = useMindMapStore();
  const [showPresentation, setShowPresentation] = useState(false);
  
  // Ref para o MindmapPreview - usado para exportação
  const mindmapRef = useRef<MindmapPreviewRef>(null);
  
  const isReady = processingStatus === 'ready' && mindMapData !== null;
  
  // Criar refs derivadas para o Header
  const svgRef = {
    current: mindmapRef.current?.getSvgElement() ?? null
  } as React.RefObject<SVGSVGElement>;
  
  const containerRef = {
    current: mindmapRef.current?.getContainerElement() ?? null
  } as React.RefObject<HTMLDivElement>;
  
  return (
    <div className="min-h-screen animated-hero-bg">
      <Particles />

      <Header
        svgRef={svgRef}
        containerRef={containerRef}
        mindmapRef={mindmapRef}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {!isReady ? (
            // Tela de Upload
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-12"
            >
              {/* Hero */}
              <div className="text-center mb-12">
                {/* Logo Comeia */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 flex justify-center"
                >
                  <svg width="240" height="120" viewBox="0 0 1074 622" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Hexágono */}
                    <path d="M859.5 155.5L1024 248.5V434.5L859.5 527.5L695 434.5V248.5L859.5 155.5Z" fill="#FFD700"/>
                    {/* Texto "comeia" */}
                    <text x="10" y="450" fontFamily="Arial, sans-serif" fontSize="280" fontWeight="bold" fill="#FFD700">comeia</text>
                  </svg>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-bold text-white mb-4"
                >
                  Transforme documentos em{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
                    Mind Maps
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-gray-300 max-w-2xl mx-auto"
                >
                  Carregue um PDF, apresentação ou texto e veja a mágica acontecer.
                  Edite, organize e exporte seu mapa mental interativo.
                </motion.p>
              </div>
              
              {/* Upload */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <FileUpload />
              </motion.div>
              
              {/* Dicas */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Tips />
              </motion.div>
              
              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  {
                    title: 'Múltiplos Formatos',
                    description: 'PDF, PowerPoint, TXT e Markdown',
                  },
                  {
                    title: 'OCR Automático',
                    description: 'Reconhece texto em documentos escaneados',
                  },
                  {
                    title: 'Edição Completa',
                    description: 'Editor de texto e drag & drop visual',
                  },
                  {
                    title: 'Preview em Tempo Real',
                    description: 'Veja as mudanças instantaneamente',
                  },
                  {
                    title: 'Modo Apresentação',
                    description: 'Apresente com navegação por nós',
                  },
                  {
                    title: 'Exportação Flexível',
                    description: 'SVG, PNG e PDF paginado',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="p-6 glass-card rounded-xl"
                  >
                    <h3 className="font-semibold text-gold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            // Workspace
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between mb-4">
                <EditorTabs />
              </div>
              
              {/* Main Content - FORÇAR 2 COLUNAS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '600px' }}>
                {/* Editor */}
                <div className="glass-card rounded-xl overflow-hidden">
                  {activeTab === 'text' ? (
                    <MarkdownEditor />
                  ) : (
                    <DragDropEditor />
                  )}
                </div>

                {/* Preview */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <MindmapPreview
                    ref={mindmapRef}
                    onEnterPresentation={() => setShowPresentation(true)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 relative z-10">
        <p>
          Feito por{' '}
          <a
            href="https://instagram.com/larachristiea"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-light transition-colors hover:underline"
          >
            @larachristiea
          </a>
        </p>
      </footer>
      
      {/* Presentation Mode */}
      <AnimatePresence>
        {showPresentation && (
          <PresentationMode onExit={() => setShowPresentation(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
