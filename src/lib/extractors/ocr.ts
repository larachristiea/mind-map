// ============================================
// EXTRATOR OCR - TESSERACT.JS
// ============================================

import { createWorker, Worker } from 'tesseract.js';
import type { ExtractionResult, ExtractedStructure } from '@/types';
import { cleanExtractedText } from '@/lib/utils';

let ocrWorker: Worker | null = null;

/**
 * Inicializa o worker do Tesseract
 */
async function initWorker(
  onProgress?: (progress: number, message: string) => void
): Promise<Worker> {
  if (ocrWorker) return ocrWorker;
  
  onProgress?.(5, 'Inicializando OCR...');
  
  const worker = await createWorker('por+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const progress = Math.round(m.progress * 100);
        onProgress?.(10 + progress * 0.8, `Reconhecendo texto... ${progress}%`);
      }
    },
  });
  
  ocrWorker = worker;
  return worker;
}

/**
 * Converte PDF para imagens usando Canvas
 */
async function pdfToImages(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ImageData[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  
  const images: ImageData[] = [];
  
  for (let i = 1; i <= numPages; i++) {
    onProgress?.(5 + (i / numPages) * 20, `Convertendo página ${i} de ${numPages}...`);
    
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // Escala 2x para melhor OCR
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    images.push(imageData);
  }
  
  return images;
}

/**
 * Converte imagem de arquivo para ImageData
 */
async function imageFileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Estrutura texto do OCR
 */
function structureOcrText(text: string): ExtractedStructure[] {
  const lines = text.split('\n').filter(l => l.trim());
  const structures: ExtractedStructure[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Detectar tipo de linha
    let level = 3;
    let type: ExtractedStructure['type'] = 'paragraph';
    
    // Títulos em maiúsculas
    if (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      level = 1;
      type = 'heading';
    }
    // Numeração de seção
    else if (/^\d+[.)]\s+/.test(trimmed)) {
      level = 2;
      type = 'numbered';
    }
    // Sub-numeração
    else if (/^\d+\.\d+/.test(trimmed)) {
      level = 3;
      type = 'numbered';
    }
    // Bullets
    else if (/^[-•*]\s+/.test(trimmed)) {
      level = 4;
      type = 'bullet';
    }
    // Letras
    else if (/^[a-z][.)]\s+/i.test(trimmed)) {
      level = 4;
      type = 'bullet';
    }
    
    structures.push({
      level,
      content: trimmed,
      type,
    });
  }
  
  return structures;
}

/**
 * Executa OCR em um PDF escaneado
 */
export async function extractWithOcr(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(0, 'Preparando OCR...');
  
  const worker = await initWorker(onProgress);
  
  let images: ImageData[];
  
  // Verificar se é PDF ou imagem direta
  if (file.type === 'application/pdf') {
    images = await pdfToImages(file, onProgress);
  } else if (file.type.startsWith('image/')) {
    images = [await imageFileToImageData(file)];
  } else {
    throw new Error('Formato não suportado para OCR');
  }
  
  const allText: string[] = [];
  const allStructures: ExtractedStructure[] = [];
  
  onProgress?.(30, 'Processando com OCR...');
  
  for (let i = 0; i < images.length; i++) {
    const progressBase = 30 + (i / images.length) * 60;
    onProgress?.(progressBase, `OCR página ${i + 1} de ${images.length}...`);
    
    // Criar canvas temporário para o Tesseract
    const canvas = document.createElement('canvas');
    canvas.width = images[i].width;
    canvas.height = images[i].height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(images[i], 0, 0);
    
    const { data } = await worker.recognize(canvas);
    
    if (data.text.trim()) {
      allText.push(data.text);
      allStructures.push(...structureOcrText(data.text));
    }
  }
  
  onProgress?.(95, 'Finalizando...');
  
  const fullText = cleanExtractedText(allText.join('\n\n'));
  
  return {
    text: fullText,
    structure: allStructures,
    metadata: {
      name: file.name,
      size: file.size,
      type: 'pdf',
      pages: images.length,
    },
    usedOCR: true,
  };
}

/**
 * Converte resultado OCR para Markdown
 */
export function ocrToMarkdown(result: ExtractionResult): string {
  if (result.structure.length === 0) {
    // Sem estrutura, criar básica
    const paragraphs = result.text.split(/\n\n+/).filter(p => p.trim());
    const lines: string[] = [];
    
    if (paragraphs.length > 0) {
      lines.push(`# ${paragraphs[0].substring(0, 60)}`);
      lines.push('');
    }
    
    for (let i = 1; i < paragraphs.length; i++) {
      lines.push(`- ${paragraphs[i].trim()}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  const lines: string[] = [];
  
  for (const struct of result.structure) {
    if (struct.type === 'heading') {
      const prefix = '#'.repeat(Math.min(struct.level, 6));
      lines.push(`${prefix} ${struct.content}`);
    } else if (struct.type === 'bullet' || struct.type === 'numbered') {
      const content = struct.content
        .replace(/^[-•*]\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .replace(/^[a-z][.)]\s+/i, '');
      lines.push(`- ${content}`);
    } else {
      lines.push(`- ${struct.content}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Libera recursos do worker
 */
export async function terminateOcrWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}
