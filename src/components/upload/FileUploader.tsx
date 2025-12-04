// ============================================
// MIND MAP - FileUploader Component
// ============================================

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, FileImage, Presentation, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFileProcessor } from '@/hooks';
import { isValidFile, formatFileSize, getFileType } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';

const FILE_TYPES = [
  { ext: 'MD', icon: FileCode, color: 'text-[rgb(var(--mm-node-2))]', label: 'Markdown' },
  { ext: 'PDF', icon: FileText, color: 'text-[rgb(var(--mm-node-1))]', label: 'PDF' },
  { ext: 'PPTX', icon: Presentation, color: 'text-[rgb(var(--mm-node-3))]', label: 'PowerPoint' },
  { ext: 'TXT', icon: FileText, color: 'text-[rgb(var(--mm-node-4))]', label: 'Texto' },
];

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { processFile } = useFileProcessor();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!isValidFile(file)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, TXT, PPTX ou MD.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('Arquivo muito grande. Limite de 50MB.');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;
    await processFile(selectedFile);
  }, [selectedFile, processFile]);

  const getFileIcon = (file: File) => {
    const type = getFileType(file.name);
    const fileType = FILE_TYPES.find(ft => ft.ext.toLowerCase() === type);
    const Icon = fileType?.icon || FileText;
    return <Icon className={cn('w-8 h-8', fileType?.color || 'text-[rgb(var(--muted-foreground))]')} />;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'upload-zone p-12 text-center cursor-pointer',
          isDragging && 'drag-over'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.pptx,.ppt,.md,.markdown"
          onChange={handleInputChange}
          className="hidden"
        />

        {selectedFile ? (
          // Arquivo selecionado
          <div className="animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--secondary))] rounded-2xl flex items-center justify-center">
              {getFileIcon(selectedFile)}
            </div>
            <p className="text-lg font-medium text-[rgb(var(--foreground))] mb-1">
              {selectedFile.name}
            </p>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-6">
              {formatFileSize(selectedFile.size)}
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                Trocar arquivo
              </Button>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProcess();
                }}
              >
                Processar arquivo
              </Button>
            </div>
          </div>
        ) : (
          // Estado inicial
          <div>
            <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--primary))]/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-[rgb(var(--primary))]" />
            </div>
            <p className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-6">
              PDF, TXT, PPTX ou MD • Máximo 50MB
            </p>
            
            {/* File type badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              {FILE_TYPES.map(({ ext, icon: Icon, color, label }) => (
                <div
                  key={ext}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--secondary))] rounded-full"
                >
                  <Icon className={cn('w-4 h-4', color)} />
                  <span className="text-xs font-medium text-[rgb(var(--foreground))]">{ext}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recomendação MD */}
      <div className="mt-4 p-4 bg-[rgb(var(--mm-node-2))]/10 rounded-lg border border-[rgb(var(--mm-node-2))]/20">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-[rgb(var(--mm-node-2))]" />
          <div>
            <p className="text-sm font-medium text-[rgb(var(--foreground))]">
              Recomendado: Envie um arquivo .md
            </p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              Markdown já estruturado gera mapas mentais perfeitos automaticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUploader;
