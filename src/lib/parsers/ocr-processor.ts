// ============================================
// MIND MAP - OCR Processor
// Extrai texto de imagens usando Tesseract.js
// ============================================

import { createWorker, Worker } from 'tesseract.js';
import { sanitizeText } from '@/lib/utils/helpers';
import { detectStructure } from '@/lib/converters/structure-detector';
import type { ExtractionResult, TextBlock } from '@/types';

let worker: Worker | null = null;

/**
 * Inicializa worker do Tesseract
 */
async function initWorker(
  onProgress?: (progress: number, message: string) => void
): Promise<Worker> {
  if (worker) return worker;

  onProgress?.(5, 'Carregando motor OCR...');
  
  worker = await createWorker('por+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const progress = Math.round(m.progress * 50) + 30;
        onProgress?.(progress, 'Reconhecendo texto...');
      }
    },
  });

  return worker;
}

/**
 * Converte PDF para imagens (canvas)
 */
async function pdfToImages(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<HTMLCanvasElement[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  onProgress?.(10, 'Convertendo PDF para imagens...');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const canvases: HTMLCanvasElement[] = [];
  const pageCount = pdf.numPages;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Alta resolução para OCR
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    canvases.push(canvas);
    
    const progress = 10 + ((i / pageCount) * 15);
    onProgress?.(progress, `Página ${i} de ${pageCount}...`);
  }

  return canvases;
}

/**
 * Processa imagem com OCR
 */
async function processImage(
  image: HTMLCanvasElement | File | Blob,
  worker: Worker
): Promise<string> {
  const result = await worker.recognize(image);
  return result.data.text;
}

/**
 * Processa PDF escaneado com OCR
 */
export async function processPdfWithOcr(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  // Inicializa OCR
  const tesseractWorker = await initWorker(onProgress);
  
  // Converte PDF para imagens
  const canvases = await pdfToImages(file, onProgress);
  
  onProgress?.(30, 'Iniciando reconhecimento de texto...');
  
  let fullText = '';
  
  for (let i = 0; i < canvases.length; i++) {
    const text = await processImage(canvases[i], tesseractWorker);
    fullText += text + '\n\n';
    
    const progress = 30 + ((i / canvases.length) * 55);
    onProgress?.(progress, `OCR página ${i + 1} de ${canvases.length}...`);
  }

  onProgress?.(90, 'Estruturando conteúdo...');

  const cleanText = sanitizeText(fullText);
  const structure = detectStructure(cleanText);

  onProgress?.(100, 'OCR concluído!');

  return {
    text: cleanText,
    structure,
    hasImages: false,
    pageCount: canvases.length,
  };
}

/**
 * Processa imagem única com OCR
 */
export async function processImageWithOcr(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  const tesseractWorker = await initWorker(onProgress);
  
  onProgress?.(30, 'Reconhecendo texto na imagem...');
  
  const text = await processImage(file, tesseractWorker);
  const cleanText = sanitizeText(text);
  const structure = detectStructure(cleanText);

  onProgress?.(100, 'OCR concluído!');

  return {
    text: cleanText,
    structure,
    hasImages: false,
    pageCount: 1,
  };
}

/**
 * Limpa recursos do worker
 */
export async function terminateOcrWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

export default { processPdfWithOcr, processImageWithOcr, terminateOcrWorker };
