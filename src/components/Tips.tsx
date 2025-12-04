// ============================================
// COMPONENTE TIPS - DICAS PARA MELHOR RESULTADO
// ============================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, CheckCircle, FileText, ListTree, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const tips = [
  {
    icon: FileText,
    title: 'Use Markdown (.md)',
    description: 'Arquivos .md já vêm estruturados e geram os melhores resultados automaticamente.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Hash,
    title: 'Use títulos com #',
    description: 'Organize seu conteúdo com # para título principal, ## para subtítulos, etc.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: ListTree,
    title: 'Use bullets e listas',
    description: 'Itens com - ou * viram automaticamente nós do mind map.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: CheckCircle,
    title: 'Indente para hierarquia',
    description: 'Use 2 espaços ou Tab para criar subitens dentro de outros itens.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

const exampleMarkdown = `# Título Principal

## Tópico 1
- Item A
- Item B
  - Subitem B.1
  - Subitem B.2

## Tópico 2
- Item C
- Item D`;

export function Tips() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExample, setShowExample] = useState(false);
  
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {/* Header colapsável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-amber-900">Dicas para melhores resultados</p>
            <p className="text-sm text-amber-700">Como estruturar seu arquivo para mind maps perfeitos</p>
          </div>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-amber-600 transition-transform',
          isExpanded && 'transform rotate-180'
        )} />
      </button>
      
      {/* Conteúdo expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white border border-t-0 border-gray-200 rounded-b-xl">
              {/* Grid de dicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn('p-4 rounded-lg', tip.bg)}
                  >
                    <div className="flex items-start gap-3">
                      <tip.icon className={cn('w-5 h-5 mt-0.5', tip.color)} />
                      <div>
                        <p className="font-medium text-gray-900">{tip.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{tip.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Exemplo */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowExample(!showExample)}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  {showExample ? 'Ocultar exemplo' : 'Ver exemplo de Markdown ideal'}
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform',
                    showExample && 'transform rotate-180'
                  )} />
                </button>
                
                <AnimatePresence>
                  {showExample && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4"
                    >
                      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
                        <code>{exampleMarkdown}</code>
                      </pre>
                      <p className="text-xs text-gray-500 mt-2">
                        Este formato gera um mind map com estrutura hierárquica clara.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
