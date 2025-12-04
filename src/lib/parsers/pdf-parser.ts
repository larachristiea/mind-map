// ============================================
// MIND MAP - PDF Parser
// Parser para arquivos PDF com suporte a OCR
// ============================================

import type { ExtractionResult } from '@/types';
import { sanitizeText } from '@/lib/utils/helpers';
import { detectStructure } from '@/lib/converters/structure-detector';

// Carrega PDF.js dinamicamente
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Configura worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

interface PageContent {
  text: string;
  hasImages: boolean;
}

/**
 * Extrai texto de uma página do PDF
 */
async function extractPageText(page: any): Promise<PageContent> {
  const textContent = await page.getTextContent();
  const operatorList = await page.getOperatorList();
  
  // Verifica se tem imagens
  const hasImages = operatorList.fnArray.some(
    (fn: number) => fn === pdfjsLib!.OPS.paintImageXObject || 
                    fn === pdfjsLib!.OPS.paintJpegXObject
  );

  // Extrai texto com posicionamento
  let lastY: number | null = null;
  let text = '';
  
  for (const item of textContent.items) {
    if ('str' in item) {
      const currentY = item.transform[5];
      
      // Nova linha se mudou posição Y significativamente
      if (lastY !== null && Math.abs(currentY - lastY) > 5) {
        text += '\n';
      } else if (lastY !== null && text && !text.endsWith(' ')) {
        text += ' ';
      }
      
      text += item.str;
      lastY = currentY;
    }
  }

  return { text, hasImages };
}

/**
 * Processa arquivo PDF
 */
export async function parsePdf(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  const pdfjs = await loadPdfJs();
  
  onProgress?.(10, 'Carregando PDF...');
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  const pageCount = pdf.numPages;
  let fullText = '';
  let hasImages = false;

  onProgress?.(20, `Extraindo texto de ${pageCount} páginas...`);

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await extractPageText(page);
    
    fullText += content.text + '\n\n';
    if (content.hasImages) hasImages = true;
    
    const progress = 20 + ((i / pageCount) * 60);
    onProgress?.(progress, `Processando página ${i} de ${pageCount}...`);
  }

  const cleanText = sanitizeText(fullText);
  
  // Verifica se extraiu texto suficiente
  const hasEnoughText = cleanText.replace(/\s/g, '').length > 50;

  onProgress?.(90, 'Estruturando conteúdo...');

  const structure = detectStructure(cleanText);

  onProgress?.(100, 'Concluído!');

  return {
    text: cleanText,
    structure,
    hasImages: hasImages && !hasEnoughText, // Marca para OCR se tem imagens sem texto
    pageCount,
  };
}

export default parsePdf;
