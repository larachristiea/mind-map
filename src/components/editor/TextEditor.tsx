// ============================================
// MIND MAP - TextEditor Component
// Editor de texto Markdown
// ============================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextEditor({ value, onChange }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [lineCount, setLineCount] = useState(1);

  // Atualiza contador de linhas
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(lines);
  }, [value]);

  // Sincroniza scroll
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 150);
  }, [onChange]);

  // Handle Tab key
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Reposiciona cursor
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-12 bg-[rgb(var(--secondary))] border-r border-[rgb(var(--border))] overflow-hidden select-none"
      >
        <div className="editor-line-numbers py-4 px-2 text-right">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-[1.6em]">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="flex-1 editor-textarea p-4 bg-[rgb(var(--background))] resize-none focus:outline-none"
        placeholder={`# Título Principal

## Seção 1
- Item A
  - Subitem A1
  - Subitem A2
- Item B

## Seção 2
- Item C
- Item D`}
        spellCheck={false}
      />
    </div>
  );
}
