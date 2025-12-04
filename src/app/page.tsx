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
    <div className="min-h-screen gradient-bg">
      <Header 
        svgRef={svgRef} 
        containerRef={containerRef}
        mindmapRef={mindmapRef}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                >
                  Transforme documentos em{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
                    Mind Maps
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-gray-600 max-w-2xl mx-auto"
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
                    className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {activeTab === 'text' ? (
                    <MarkdownEditor />
                  ) : (
                    <DragDropEditor />
                  )}
                </div>
                
                {/* Preview */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
      <footer className="py-8 text-center text-sm text-gray-500">
        <p>
          Feito por{' '}
          <a 
            href="https://instagram.com/larachristiea" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
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
