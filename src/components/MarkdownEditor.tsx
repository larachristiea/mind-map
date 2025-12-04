// ============================================
// COMPONENTE MARKDOWN EDITOR
// ============================================

'use client';

import { useCallback, useRef, useState } from 'react';
import { useMindMapStore } from '@/store/mindmapStore';
import { createMindMapData } from '@/lib/markdown/parser';
import { debounce } from '@/lib/utils';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export function MarkdownEditor() {
  const { markdown, setMarkdown, setMindMapData, file } = useMindMapStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTips, setShowTips] = useState(false);
  
  // Detectar se tem separador
  const hasSeparator = markdown?.match(/^(-{3,}|_{3,})$/m);
  const separatorCount = markdown?.match(/^(-{3,}|_{3,})$/gm)?.length || 0;
  
  // Debounce da atualização do mind map
  const updateMindMap = useCallback(
    debounce((md: string) => {
      const data = createMindMapData(md, file?.name.replace(/\.[^.]+$/, '') || 'Mind Map');
      setMindMapData(data);
    }, 300),
    [setMindMapData, file]
  );
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMarkdown(value);
    updateMindMap(value);
  }, [setMarkdown, updateMindMap]);
  
  // Suporte a Tab para indentação
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        const lineStart = markdown.lastIndexOf('\n', start - 1) + 1;
        const lineContent = markdown.substring(lineStart, end);
        
        if (lineContent.startsWith('  ')) {
          const newValue = markdown.substring(0, lineStart) + lineContent.substring(2) + markdown.substring(end);
          setMarkdown(newValue);
          updateMindMap(newValue);
          
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 2);
          });
        }
      } else {
        const newValue = markdown.substring(0, start) + '  ' + markdown.substring(end);
        setMarkdown(newValue);
        updateMindMap(newValue);
        
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    }
  }, [markdown, setMarkdown, updateMindMap]);
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-500 font-medium">Editor Markdown</span>
        <div className="flex-1" />
        
        {hasSeparator && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {separatorCount + 1} páginas no PDF
          </span>
        )}
        
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Dicas
          {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      
      {/* Painel de dicas */}
      {showTips && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-blue-50 text-xs text-gray-600 space-y-2">
          <p className="font-medium text-gray-700">Dicas de formatação:</p>
          <ul className="space-y-1 ml-4">
            <li><code className="bg-white px-1 rounded"># Título</code> - Nó principal</li>
            <li><code className="bg-white px-1 rounded">## Subtítulo</code> - Nó secundário</li>
            <li><code className="bg-white px-1 rounded">- Item</code> - Lista (subnó)</li>
            <li><code className="bg-white px-1 rounded">Tab</code> - Indentar (criar subnível)</li>
          </ul>
          <div className="pt-2 border-t border-blue-200">
            <p className="font-medium text-blue-700">Exportar em múltiplas páginas:</p>
            <p className="mt-1">Use <code className="bg-white px-1.5 py-0.5 rounded font-mono">---</code> em uma linha separada para dividir o conteúdo em páginas diferentes no PDF.</p>
          </div>
        </div>
      )}
      
      {/* Editor */}
      <div className="flex-1 overflow-auto min-h-0">
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`# Título do Mind Map

## Tópico 1
- Item A
- Item B
  - Subitem B.1

## Tópico 2
- Item C
- Item D`}
          className="w-full h-full p-4 font-mono text-sm text-gray-800 bg-white resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>
      
      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-400">
          {markdown.split('\n').length} linhas
        </span>
        <span className="text-xs text-gray-400">
          Tab indentar • --- quebra página
        </span>
        <span className="text-xs text-gray-400">
          {markdown.length} chars
        </span>
      </div>
    </div>
  );
}
