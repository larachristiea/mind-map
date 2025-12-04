// ============================================
// EXTRATOR DE PDF - CORRIGIDO v2
// ============================================

import type { ExtractionResult, ExtractedStructure } from '@/types';
import { cleanExtractedText } from '@/lib/utils';

// Worker do PDF.js será carregado dinamicamente
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

/**
 * Inicializa o PDF.js (sem worker - funciona no browser)
 */
async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  
  const pdfjs = await import('pdfjs-dist');
  
  // Usar CDN para o worker (mais confiável)
  pdfjs.GlobalWorkerOptions.workerSrc = 
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  
  pdfjsLib = pdfjs;
  return pdfjs;
}

/**
 * Detecta se o PDF é baseado em imagem (escaneado)
 */
async function isPdfImageBased(pdf: any): Promise<boolean> {
  try {
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    const textLength = textContent.items
      .map((item: any) => item.str || '')
      .join('')
      .trim()
      .length;
    
    return textLength < 50;
  } catch {
    return true;
  }
}

/**
 * Extrai texto de uma página
 */
async function extractPageText(
  page: any
): Promise<{ text: string; structures: ExtractedStructure[] }> {
  const textContent = await page.getTextContent();
  const structures: ExtractedStructure[] = [];
  
  let currentParagraph = '';
  let lastY = -1;
  let lastFontSize = 0;
  
  for (const item of textContent.items) {
    const str = item.str;
    const transform = item.transform;
    
    if (!str || str.trim() === '') continue;
    
    const y = transform ? transform[5] : 0;
    const fontSize = transform ? Math.abs(transform[0]) : 12;
    
    // Detectar quebra de parágrafo
    if (lastY !== -1 && Math.abs(y - lastY) > fontSize * 1.5) {
      if (currentParagraph.trim()) {
        const level = detectHeadingLevel(currentParagraph, lastFontSize);
        structures.push({
          level,
          content: currentParagraph.trim(),
          type: level < 3 ? 'heading' : 'paragraph',
        });
      }
      currentParagraph = '';
    }
    
    currentParagraph += str + ' ';
    lastY = y;
    lastFontSize = fontSize;
  }
  
  // Adicionar último parágrafo
  if (currentParagraph.trim()) {
    const level = detectHeadingLevel(currentParagraph, lastFontSize);
    structures.push({
      level,
      content: currentParagraph.trim(),
      type: level < 3 ? 'heading' : 'paragraph',
    });
  }
  
  const text = structures.map(s => s.content).join('\n\n');
  return { text, structures };
}

/**
 * Detecta nível de heading
 */
function detectHeadingLevel(text: string, fontSize: number): number {
  const trimmed = text.trim();
  
  if (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return 1;
  }
  
  if (fontSize > 16) return 1;
  if (fontSize > 14) return 2;
  
  if (/^\d+\.\s+[A-Z]/.test(trimmed)) return 2;
  if (/^\d+\.\d+\s+/.test(trimmed)) return 3;
  if (/^\d+\.\d+\.\d+\s+/.test(trimmed)) return 4;
  if (/^[-•*]\s+/.test(trimmed)) return 4;
  
  return 3;
}

/**
 * Estrutura o texto em Markdown
 */
function structureToMarkdown(structures: ExtractedStructure[]): string {
  const lines: string[] = [];
  
  for (const struct of structures) {
    const prefix = '#'.repeat(Math.min(struct.level, 6));
    
    if (struct.type === 'heading' && struct.level <= 3) {
      lines.push(`${prefix} ${struct.content}`);
    } else if (struct.type === 'bullet') {
      lines.push(`- ${struct.content}`);
    } else if (struct.type === 'numbered') {
      lines.push(`1. ${struct.content}`);
    } else {
      if (/^[-•*]\s+/.test(struct.content)) {
        lines.push(`- ${struct.content.replace(/^[-•*]\s+/, '')}`);
      } else if (/^\d+[.)]\s+/.test(struct.content)) {
        lines.push(`- ${struct.content.replace(/^\d+[.)]\s+/, '')}`);
      } else {
        lines.push(`- ${struct.content}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Extrai texto e estrutura de um PDF
 */
export async function extractFromPdf(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(5, 'Inicializando...');
  
  const pdfjs = await initPdfJs();
  
  onProgress?.(10, 'Carregando PDF...');
  
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress?.(20, 'Analisando documento...');
  
  let pdf;
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch (e) {
    console.error('Erro ao carregar PDF:', e);
    throw new Error('Não foi possível carregar o PDF.');
  }
  
  const numPages = pdf.numPages;
  
  // Verificar se é PDF de imagem
  const isImageBased = await isPdfImageBased(pdf);
  
  if (isImageBased) {
    return {
      text: '',
      structure: [],
      metadata: {
        name: file.name,
        size: file.size,
        type: 'pdf',
        pages: numPages,
      },
      usedOCR: true,
    };
  }
  
  const allStructures: ExtractedStructure[] = [];
  let allText = '';
  
  for (let i = 1; i <= numPages; i++) {
    onProgress?.(20 + (i / numPages) * 70, `Extraindo página ${i} de ${numPages}...`);
    
    try {
      const page = await pdf.getPage(i);
      const { text, structures } = await extractPageText(page);
      
      allText += text + '\n\n';
      allStructures.push(...structures);
    } catch (e) {
      console.warn(`Erro na página ${i}:`, e);
    }
  }
  
  onProgress?.(95, 'Finalizando...');
  
  return {
    text: cleanExtractedText(allText),
    structure: allStructures,
    metadata: {
      name: file.name,
      size: file.size,
      type: 'pdf',
      pages: numPages,
    },
    usedOCR: false,
  };
}

/**
 * Converte resultado para Markdown
 */
export function pdfToMarkdown(result: ExtractionResult): string {
  if (result.structure.length === 0) {
    const paragraphs = result.text.split(/\n\n+/);
    const lines: string[] = [];
    
    if (paragraphs.length > 0) {
      lines.push(`# ${paragraphs[0].substring(0, 80)}`);
      lines.push('');
    }
    
    for (let i = 1; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (p) {
        if (p.length < 60 && p === p.toUpperCase()) {
          lines.push(`## ${p}`);
        } else {
          lines.push(`- ${p.substring(0, 200)}`);
        }
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }
  
  return structureToMarkdown(result.structure);
}
