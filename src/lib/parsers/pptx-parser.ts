// ============================================
// MIND MAP - PPTX Parser
// Parser para arquivos PowerPoint
// ============================================

import type { ExtractionResult, TextBlock } from '@/types';
import JSZip from 'jszip';
import { sanitizeText, stripHtml } from '@/lib/utils/helpers';
import { detectStructure } from '@/lib/converters/structure-detector';

interface SlideContent {
  slideNumber: number;
  title: string;
  content: string[];
  hasImages: boolean;
}

/**
 * Extrai texto de um elemento XML
 */
function extractTextFromXml(xml: string): string[] {
  const texts: string[] = [];
  
  // Regex para extrair texto de tags <a:t>
  const textRegex = /<a:t>([^<]*)<\/a:t>/g;
  let match;
  
  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1].trim();
    if (text) texts.push(text);
  }
  
  return texts;
}

/**
 * Verifica se slide tem imagens
 */
function slideHasImages(xml: string): boolean {
  return xml.includes('<p:pic') || 
         xml.includes('<a:blip') ||
         xml.includes('image');
}

/**
 * Extrai conteúdo de um slide
 */
async function parseSlide(
  zip: JSZip,
  slideNumber: number
): Promise<SlideContent | null> {
  const slidePath = `ppt/slides/slide${slideNumber}.xml`;
  const slideFile = zip.file(slidePath);
  
  if (!slideFile) return null;

  const xml = await slideFile.async('string');
  const allTexts = extractTextFromXml(xml);
  
  if (allTexts.length === 0) {
    return {
      slideNumber,
      title: `Slide ${slideNumber}`,
      content: [],
      hasImages: slideHasImages(xml),
    };
  }

  // Primeiro texto geralmente é o título
  const title = allTexts[0];
  const content = allTexts.slice(1);

  return {
    slideNumber,
    title,
    content,
    hasImages: slideHasImages(xml),
  };
}

/**
 * Converte slides para markdown estruturado
 */
function slidesToMarkdown(slides: SlideContent[]): string {
  let md = '';
  
  for (const slide of slides) {
    // Título do slide como H2
    md += `## ${slide.title}\n`;
    
    // Conteúdo como lista
    for (const item of slide.content) {
      md += `- ${item}\n`;
    }
    
    md += '\n';
  }
  
  return md;
}

/**
 * Processa arquivo PPTX
 */
export async function parsePptx(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(10, 'Descompactando apresentação...');
  
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Encontra todos os slides
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  const totalSlides = slideFiles.length;
  const slides: SlideContent[] = [];
  let hasImages = false;

  onProgress?.(20, `Processando ${totalSlides} slides...`);

  for (let i = 0; i < totalSlides; i++) {
    const slideContent = await parseSlide(zip, i + 1);
    
    if (slideContent) {
      slides.push(slideContent);
      if (slideContent.hasImages) hasImages = true;
    }
    
    const progress = 20 + ((i / totalSlides) * 60);
    onProgress?.(progress, `Slide ${i + 1} de ${totalSlides}...`);
  }

  onProgress?.(85, 'Estruturando conteúdo...');

  // Gera texto e markdown
  const markdown = slidesToMarkdown(slides);
  const structure = detectStructure(markdown);

  onProgress?.(100, 'Concluído!');

  return {
    text: markdown,
    structure,
    hasImages,
    pageCount: totalSlides,
  };
}

export default parsePptx;
