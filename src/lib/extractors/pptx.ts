// ============================================
// EXTRATOR DE PPTX COM OCR MELHORADO
// ============================================

import JSZip from 'jszip';
import type { ExtractionResult, ExtractedStructure } from '@/types';
import { cleanExtractedText } from '@/lib/utils';

interface SlideContent {
  title: string;
  bullets: string[];
  slideNumber: number;
}

/**
 * Extrai texto de tags <a:t> no XML
 */
function extractTextFromXml(xml: string): string[] {
  const matches: string[] = [];
  const textPattern = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let match;
  
  while ((match = textPattern.exec(xml)) !== null) {
    if (match[1] && match[1].trim()) {
      matches.push(match[1].trim());
    }
  }
  
  return matches;
}

/**
 * Analisa um slide XML e extrai conteúdo estruturado
 */
function parseSlideXml(xml: string, slideNumber: number): SlideContent {
  const content: SlideContent = {
    title: '',
    bullets: [],
    slideNumber,
  };
  
  try {
    const titleMatch = xml.match(/<p:sp[^>]*>[\s\S]*?<p:ph[^>]*type="(?:title|ctrTitle)"[^>]*\/>[\s\S]*?<\/p:sp>/i);
    if (titleMatch) {
      const titleTexts = extractTextFromXml(titleMatch[0]);
      content.title = titleTexts.join(' ');
    }
    
    const bodyMatches = xml.match(/<p:sp[^>]*>[\s\S]*?<p:ph[^>]*type="body"[^>]*\/>[\s\S]*?<\/p:sp>/gi);
    if (bodyMatches) {
      for (const body of bodyMatches) {
        const paragraphs = body.split(/<a:p[^>]*>/);
        for (const p of paragraphs) {
          const texts = extractTextFromXml(p);
          const bulletText = texts.join(' ').trim();
          if (bulletText && bulletText !== content.title) {
            content.bullets.push(bulletText);
          }
        }
      }
    }
    
    if (!content.title && content.bullets.length === 0) {
      const allTexts = extractTextFromXml(xml);
      if (allTexts.length > 0) {
        content.title = allTexts[0];
        content.bullets = allTexts.slice(1).filter(t => t !== content.title);
      }
    }
  } catch (e) {
    console.warn('Erro ao parsear slide:', e);
  }
  
  return content;
}

/**
 * Pré-processa imagem para melhorar OCR
 * - Converte para grayscale
 * - Aumenta contraste
 * - Aplica threshold (binarização)
 */
async function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }
      
      // Aumentar resolução para melhor OCR
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Desenhar imagem escalada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Pegar dados da imagem
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Converter para grayscale e aumentar contraste
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Aumentar contraste
        const contrast = 1.5;
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
        let newGray = factor * (gray - 128) + 128;
        
        // Clamp
        newGray = Math.max(0, Math.min(255, newGray));
        
        // Binarização suave (threshold adaptativo)
        const threshold = 140;
        if (newGray < threshold) {
          newGray = 0; // Preto
        } else {
          newGray = 255; // Branco
        }
        
        data[i] = newGray;
        data[i + 1] = newGray;
        data[i + 2] = newGray;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

/**
 * Extrai imagens do PPTX para OCR
 */
async function extractImagesFromPptx(
  zip: JSZip,
  onProgress?: (progress: number, message: string) => void
): Promise<{ slideNum: number; imageData: string; mimeType: string }[]> {
  const images: { slideNum: number; imageData: string; mimeType: string }[] = [];
  
  const mediaFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/media\/image\d+\.(png|jpg|jpeg|gif|bmp)$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/image(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/image(\d+)/)?.[1] || '0');
      return numA - numB;
    });
  
  onProgress?.(30, `Encontradas ${mediaFiles.length} imagens...`);
  
  for (let i = 0; i < mediaFiles.length; i++) {
    const imagePath = mediaFiles[i];
    onProgress?.(30 + (i / mediaFiles.length) * 10, `Extraindo imagem ${i + 1}...`);
    
    try {
      const imageFile = zip.files[imagePath];
      if (!imageFile) continue;
      
      const imageData = await imageFile.async('base64');
      const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      
      images.push({
        slideNum: i + 1,
        imageData: `data:${mimeType};base64,${imageData}`,
        mimeType,
      });
    } catch (e) {
      console.warn(`Erro ao extrair imagem ${imagePath}:`, e);
    }
  }
  
  return images;
}

/**
 * Limpa texto do OCR removendo lixo
 */
function cleanOcrText(text: string): string {
  return text
    // Remover linhas com muitos caracteres especiais
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line || line.length < 2) return false;
      
      // Contar caracteres válidos vs especiais
      const validChars = line.match(/[a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ0-9\s]/g)?.length || 0;
      const totalChars = line.length;
      
      // Se menos de 50% são caracteres válidos, é lixo
      if (validChars / totalChars < 0.5) return false;
      
      // Remover linhas que são só símbolos repetidos
      if (/^[|=\-_\[\]{}()+*#@$%&]+$/.test(line)) return false;
      
      // Remover linhas muito curtas com pouca informação
      if (line.length < 4 && !/^\d+$/.test(line)) return false;
      
      return true;
    })
    .join('\n');
}

/**
 * Verifica se o texto do OCR é útil
 */
function isOcrTextUseful(text: string): boolean {
  const cleaned = cleanOcrText(text);
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  
  // Precisa ter pelo menos 3 palavras significativas
  return words.length >= 3;
}

/**
 * Estrutura texto do OCR em seções
 */
function structureOcrText(text: string, slideNum: number): SlideContent {
  const cleaned = cleanOcrText(text);
  const lines = cleaned.split('\n').filter(Boolean);
  
  const content: SlideContent = {
    title: '',
    bullets: [],
    slideNumber: slideNum,
  };
  
  if (lines.length === 0) return content;
  
  // Primeira linha significativa é o título
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 3) {
      content.title = line;
      content.bullets = lines.slice(i + 1).filter(l => l.length > 2);
      break;
    }
  }
  
  if (!content.title && lines.length > 0) {
    content.title = `Slide ${slideNum}`;
    content.bullets = lines.filter(l => l.length > 2);
  }
  
  return content;
}

/**
 * Aplica OCR em uma imagem usando Tesseract.js
 */
async function ocrImage(
  imageDataUrl: string,
  worker: Tesseract.Worker
): Promise<string> {
  try {
    // Pré-processar imagem
    const processedImage = await preprocessImage(imageDataUrl);
    
    const result = await worker.recognize(processedImage);
    return result.data.text || '';
  } catch (e) {
    console.warn('Erro no OCR:', e);
    return '';
  }
}

/**
 * Extrai texto e estrutura de um PPTX (com fallback para OCR)
 */
export async function extractFromPptx(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(5, 'Iniciando...');
  
  try {
    onProgress?.(10, 'Lendo arquivo...');
    const arrayBuffer = await file.arrayBuffer();
    
    onProgress?.(15, 'Descompactando...');
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(arrayBuffer);
    } catch (e) {
      console.error('Erro ao descompactar PPTX:', e);
      throw new Error('Arquivo PPTX inválido ou corrompido');
    }
    
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });
    
    if (slideFiles.length === 0) {
      throw new Error('Nenhum slide encontrado no arquivo');
    }
    
    onProgress?.(20, `${slideFiles.length} slides encontrados...`);
    
    // FASE 1: Tentar extrair texto normal
    const slides: SlideContent[] = [];
    let totalTextLength = 0;
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      
      try {
        const slideFile = zip.files[slidePath];
        if (!slideFile) continue;
        
        const slideXml = await slideFile.async('text');
        const slideContent = parseSlideXml(slideXml, i + 1);
        slides.push(slideContent);
        
        totalTextLength += slideContent.title.length;
        totalTextLength += slideContent.bullets.join('').length;
      } catch (e) {
        console.warn(`Erro ao processar slide ${i + 1}:`, e);
        slides.push({ title: `Slide ${i + 1}`, bullets: [], slideNumber: i + 1 });
      }
    }
    
    // FASE 2: Se extraiu pouco texto, usar OCR nas imagens
    const needsOcr = totalTextLength < 100;
    let ocrSuccess = false;
    
    if (needsOcr) {
      onProgress?.(25, 'Slides baseados em imagens, iniciando OCR...');
      
      const Tesseract = await import('tesseract.js');
      
      onProgress?.(28, 'Carregando motor de OCR (pode demorar)...');
      
      const worker = await Tesseract.createWorker('por+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(45 + (m.progress || 0) * 45);
            onProgress?.(progress, `Reconhecendo texto: ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });
      
      try {
        const images = await extractImagesFromPptx(zip, onProgress);
        
        if (images.length === 0) {
          throw new Error('Nenhuma imagem encontrada para OCR');
        }
        
        onProgress?.(40, `Processando ${images.length} imagens...`);
        
        const ocrSlides: SlideContent[] = [];
        let usefulResults = 0;
        
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          onProgress?.(45 + (i / images.length) * 45, `OCR imagem ${i + 1}/${images.length}...`);
          
          const text = await ocrImage(img.imageData, worker);
          
          if (isOcrTextUseful(text)) {
            usefulResults++;
            const slideContent = structureOcrText(text, img.slideNum);
            
            const existing = ocrSlides.find(s => s.slideNumber === slideContent.slideNumber);
            if (existing) {
              if (!existing.title && slideContent.title) {
                existing.title = slideContent.title;
              }
              existing.bullets.push(...slideContent.bullets);
            } else {
              ocrSlides.push(slideContent);
            }
          }
        }
        
        if (usefulResults > 0) {
          ocrSlides.sort((a, b) => a.slideNumber - b.slideNumber);
          slides.length = 0;
          slides.push(...ocrSlides);
          ocrSuccess = true;
        }
        
      } finally {
        await worker.terminate();
      }
    }
    
    onProgress?.(95, 'Finalizando...');
    
    // Se OCR falhou, avisar o usuário
    if (needsOcr && !ocrSuccess) {
      return {
        text: '',
        structure: [{
          level: 1,
          content: file.name.replace(/\.[^.]+$/, ''),
          type: 'heading',
        }, {
          level: 2,
          content: 'Este PPTX contém slides baseados em imagens complexas',
          type: 'bullet',
        }, {
          level: 2,
          content: 'O OCR não conseguiu extrair texto legível',
          type: 'bullet',
        }, {
          level: 2,
          content: 'Sugestão: Copie o texto manualmente ou use um arquivo .MD',
          type: 'bullet',
        }],
        metadata: {
          name: file.name,
          size: file.size,
          type: 'pptx',
          slides: slideFiles.length,
        },
        usedOCR: true,
      };
    }
    
    // Converter para estrutura
    const structures: ExtractedStructure[] = [];
    
    for (const slide of slides) {
      if (slide.title) {
        structures.push({
          level: 1,
          content: slide.title,
          type: 'heading',
        });
      }
      
      for (const bullet of slide.bullets) {
        structures.push({
          level: 2,
          content: bullet,
          type: 'bullet',
        });
      }
    }
    
    const text = slides
      .map((slide) => {
        let slideText = slide.title || `Slide ${slide.slideNumber}`;
        if (slide.bullets.length) slideText += `\n${slide.bullets.join('\n')}`;
        return slideText;
      })
      .join('\n\n');
    
    return {
      text: cleanExtractedText(text),
      structure: structures,
      metadata: {
        name: file.name,
        size: file.size,
        type: 'pptx',
        slides: slideFiles.length,
      },
      usedOCR: needsOcr,
    };
    
  } catch (e) {
    console.error('Erro ao processar PPTX:', e);
    throw e instanceof Error ? e : new Error('Erro ao processar apresentação');
  }
}

/**
 * Converte PPTX extraído para Markdown estruturado
 */
export function pptxToMarkdown(result: ExtractionResult): string {
  if (result.structure.length === 0) {
    return `# ${result.metadata.name?.replace(/\.[^.]+$/, '') || 'Apresentação'}\n\n- Conteúdo não pôde ser extraído`;
  }
  
  const lines: string[] = [];
  let currentSlide = 0;
  
  for (const struct of result.structure) {
    if (struct.type === 'heading' && struct.level === 1) {
      currentSlide++;
      if (currentSlide === 1) {
        lines.push(`# ${struct.content}`);
      } else {
        lines.push(`## ${struct.content}`);
      }
    } else if (struct.type === 'bullet') {
      const indent = struct.level > 2 ? '  ' : '';
      lines.push(`${indent}- ${struct.content}`);
    } else {
      lines.push(`- ${struct.content}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
