// ============================================
// COMPONENTE FILE UPLOAD - LOADING CORRIGIDO
// ============================================

'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, FileSpreadsheet, File, CheckCircle2, Loader2 } from 'lucide-react';
import { cn, formatFileSize, isFileSupported } from '@/lib/utils';
import { useFileProcessor } from '@/hooks/useFileProcessor';
import { useMindMapStore } from '@/store/mindmapStore';

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { processFile, error } = useFileProcessor();
  const { processingStatus, processingProgress, processingMessage, file } = useMindMapStore();
  
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && isFileSupported(files[0])) {
      processFile(files[0]);
    }
  }, [processFile]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = '';
  }, [processFile]);
  
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'pptx':
      case 'ppt':
        return <FileSpreadsheet className="w-8 h-8 text-orange-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-8 h-8 text-blue-600" />;
      case 'md':
        return <FileText className="w-8 h-8 text-purple-500" />;
      case 'txt':
        return <File className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };
  
  // Qualquer status que não seja idle, ready ou error = processando
  const isProcessing = !['idle', 'ready', 'error'].includes(processingStatus);
  const isOcr = processingStatus === 'ocr' || processingMessage?.toLowerCase().includes('ocr');
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Área de Drop */}
      <motion.div
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#3b82f6' : '#e5e7eb',
        }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 transition-colors',
          isDragging ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300',
          isProcessing && 'pointer-events-none'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md,.markdown,.pptx,.docx"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          {isProcessing ? (
            // Estado de processamento
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              {/* Progress Ring */}
              <div className="relative w-20 h-20 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  {/* Progress circle */}
                  <circle
                    className="text-brand-600 transition-all duration-300"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (processingProgress / 100) * 264}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>
                {/* Percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-700">
                    {Math.round(processingProgress)}%
                  </span>
                </div>
              </div>
              
              {/* File name */}
              {file && (
                <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                  {getFileIcon(file.name)}
                  <span className="text-sm text-gray-600 max-w-[200px] truncate">
                    {file.name}
                  </span>
                </div>
              )}
              
              {/* Status message */}
              <div className="flex items-center gap-2 text-gray-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">
                  {processingMessage || 'Processando...'}
                </span>
              </div>
              
              {/* OCR hint */}
              {isOcr && (
                <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                  Reconhecendo texto nas imagens...
                </p>
              )}
              
              {/* General hint */}
              <p className="text-xs text-gray-400 mt-3">
                Isso pode levar alguns segundos
              </p>
            </motion.div>
          ) : processingStatus === 'ready' && file ? (
            // Estado de sucesso
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <div className="flex items-center gap-3 mb-2">
                {getFileIcon(file.name)}
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <p className="text-sm text-green-600 font-medium">Processado com sucesso!</p>
              <p className="text-xs text-gray-400 mt-2">Arraste outro arquivo para substituir</p>
            </motion.div>
          ) : (
            // Estado inicial
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-brand-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Arraste seu arquivo aqui
              </p>
              <p className="text-gray-500 mb-4">
                ou <span className="text-brand-600 font-medium">clique para selecionar</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 bg-white rounded border">PDF</span>
                <span className="px-2 py-1 bg-white rounded border">PPTX</span>
                <span className="px-2 py-1 bg-white rounded border">DOCX</span>
                <span className="px-2 py-1 bg-white rounded border">TXT</span>
                <span className="px-2 py-1 bg-white rounded border border-blue-200 bg-blue-50 text-blue-600">
                  MD (recomendado)
                </span>
              </div>
              
              {/* Aviso sobre limitações */}
              <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 max-w-md">
                <p className="font-medium mb-1">Dica para melhores resultados:</p>
                <p>Arquivos com <strong>texto digitado</strong> funcionam melhor. PPTs/PDFs feitos só com imagens podem não ser lidos corretamente.</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
