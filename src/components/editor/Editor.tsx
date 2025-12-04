// ============================================
// Mind Map - Editor Component
// Editor principal com tabs texto/visual
// ============================================

'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { TextEditor } from './TextEditor';
import { DragDropEditor } from './DragDropEditor';
import { Code, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

type EditorMode = 'text' | 'visual';

export function Editor() {
  const [mode, setMode] = useState<EditorMode>('text');
  const { markdown, setMarkdown, document } = useAppStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header com tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[rgb(var(--foreground))]">
            Editor
          </h3>
          <span className="text-xs text-[rgb(var(--muted-foreground))] bg-[rgb(var(--secondary))] px-2 py-0.5 rounded">
            {document?.originalFileName}
          </span>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center bg-[rgb(var(--secondary))] rounded-lg p-1">
          <button
            onClick={() => setMode('text')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === 'text'
                ? 'bg-[rgb(var(--card))] text-[rgb(var(--foreground))] shadow-sm'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
            )}
          >
            <Code className="w-4 h-4" />
            Texto
          </button>
          <button
            onClick={() => setMode('visual')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              mode === 'visual'
                ? 'bg-[rgb(var(--card))] text-[rgb(var(--foreground))] shadow-sm'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
            )}
          >
            <LayoutList className="w-4 h-4" />
            Visual
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'text' ? (
          <TextEditor 
            value={markdown} 
            onChange={setMarkdown} 
          />
        ) : (
          <DragDropEditor 
            markdown={markdown} 
            onChange={setMarkdown} 
          />
        )}
      </div>
    </div>
  );
}

export default Editor;
