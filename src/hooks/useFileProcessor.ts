// ============================================
// HOOK PARA PROCESSAR ARQUIVOS
// ============================================

import { useCallback, useState } from 'react';
import { useMindMapStore } from '@/store/mindmapStore';
import { extractFromPdf, pdfToMarkdown } from '@/lib/extractors/pdf';
import { extractFromPptx, pptxToMarkdown } from '@/lib/extractors/pptx';
import { extractFromTxt, extractFromMd, txtToMarkdown } from '@/lib/extractors/txt';
import { extractFromDocx, docxToMarkdown } from '@/lib/extractors/docx';
import { extractWithOcr, ocrToMarkdown } from '@/lib/extractors/ocr';
import { createMindMapData } from '@/lib/markdown/parser';
import { getFileType } from '@/lib/utils';
import type { SupportedFileType, ExtractionResult } from '@/types';

export function useFileProcessor() {
  const [error, setError] = useState<string | null>(null);
  
  const {
    setFile,
    setFileType,
    setProcessingStatus,
    setProcessingProgress,
    setRawText,
    setMarkdown,
    setMindMapData,
  } = useMindMapStore();
  
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setFile(file);
    
    // Verificar formatos antigos não suportados
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'ppt') {
      setError('Formato .ppt (PowerPoint antigo) não suportado. Por favor, salve como .pptx');
      setProcessingStatus('error');
      return;
    }
    if (ext === 'doc') {
      setError('Formato .doc (Word antigo) não suportado. Por favor, salve como .docx');
      setProcessingStatus('error');
      return;
    }
    
    // Detectar tipo
    const type = getFileType(file.name) as SupportedFileType | null;
    if (!type) {
      setError('Formato de arquivo não suportado. Use: PDF, PPTX, DOCX, TXT ou MD');
      setProcessingStatus('error');
      return;
    }
    
    setFileType(type);
    setProcessingStatus('extracting');
    
    const onProgress = (progress: number, message: string) => {
      setProcessingProgress(progress, message);
    };
    
    try {
      let result: ExtractionResult;
      let markdown: string;
      
      switch (type) {
        case 'pdf':
          result = await extractFromPdf(file, onProgress);
          
          // Verificar se precisa de OCR
          if (result.usedOCR && result.text === '') {
            setProcessingStatus('ocr');
            setProcessingProgress(0, 'Iniciando OCR...');
            result = await extractWithOcr(file, onProgress);
            markdown = ocrToMarkdown(result);
          } else {
            markdown = pdfToMarkdown(result);
          }
          break;
          
        case 'pptx':
          result = await extractFromPptx(file, onProgress);
          markdown = pptxToMarkdown(result);
          
          // Avisar se usou OCR
          if (result.usedOCR) {
            console.log('PPTX processado com OCR (slides baseados em imagens)');
          }
          break;
          
        case 'txt':
          result = await extractFromTxt(file, onProgress);
          markdown = txtToMarkdown(result);
          break;
          
        case 'md':
          result = await extractFromMd(file, onProgress);
          markdown = result.text; // MD já é markdown
          break;
          
        case 'docx':
          result = await extractFromDocx(file, onProgress);
          markdown = docxToMarkdown(result);
          break;
          
        default:
          throw new Error('Tipo de arquivo não implementado');
      }
      
      // Validar se extraiu algum conteúdo
      if (!markdown || markdown.trim().length < 10) {
        throw new Error('Não foi possível extrair conteúdo do arquivo. Verifique se o arquivo não está vazio ou corrompido.');
      }
      
      // Salvar dados
      setRawText(result.text);
      setMarkdown(markdown);
      
      // Criar estrutura do mind map
      const mindMapData = createMindMapData(
        markdown,
        file.name.replace(/\.[^.]+$/, '')
      );
      setMindMapData(mindMapData);
      
      setProcessingStatus('ready');
      setProcessingProgress(100, 'Concluído!');
      
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      const message = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      setError(message);
      setProcessingStatus('error');
    }
  }, [
    setFile,
    setFileType,
    setProcessingStatus,
    setProcessingProgress,
    setRawText,
    setMarkdown,
    setMindMapData,
  ]);
  
  const reset = useCallback(() => {
    setError(null);
    useMindMapStore.getState().reset();
  }, []);
  
  return {
    processFile,
    reset,
    error,
  };
}
