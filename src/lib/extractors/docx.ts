// ============================================
// EXTRATOR DE DOCX
// ============================================

import mammoth from 'mammoth';
import type { ExtractionResult, ExtractedStructure } from '@/types';
import { cleanExtractedText } from '@/lib/utils';

/**
 * Extrai texto e estrutura de um arquivo DOCX
 */
export async function extractFromDocx(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(10, 'Lendo documento Word...');
  
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress?.(30, 'Extraindo conteúdo...');
  
  // Extrair HTML para manter estrutura
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  
  onProgress?.(60, 'Analisando estrutura...');
  
  // Também extrair texto puro
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = textResult.value;
  
  // Parsear HTML para estrutura
  const structures = parseHtmlStructure(html);
  
  onProgress?.(90, 'Finalizando...');
  
  return {
    text: cleanExtractedText(rawText),
    structure: structures,
    metadata: {
      name: file.name,
      size: file.size,
      type: 'docx',
    },
    usedOCR: false,
  };
}

/**
 * Parseia HTML do mammoth para estrutura
 */
function parseHtmlStructure(html: string): ExtractedStructure[] {
  const structures: ExtractedStructure[] = [];
  
  // Regex para extrair tags de estrutura
  const patterns = [
    { regex: /<h1[^>]*>(.*?)<\/h1>/gi, level: 1, type: 'heading' as const },
    { regex: /<h2[^>]*>(.*?)<\/h2>/gi, level: 2, type: 'heading' as const },
    { regex: /<h3[^>]*>(.*?)<\/h3>/gi, level: 3, type: 'heading' as const },
    { regex: /<h4[^>]*>(.*?)<\/h4>/gi, level: 4, type: 'heading' as const },
    { regex: /<li[^>]*>(.*?)<\/li>/gi, level: 3, type: 'bullet' as const },
    { regex: /<p[^>]*>(.*?)<\/p>/gi, level: 3, type: 'paragraph' as const },
  ];
  
  // Processar cada padrão
  for (const { regex, level, type } of patterns) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const content = stripHtml(match[1]).trim();
      if (content) {
        structures.push({ level, type, content });
      }
    }
  }
  
  // Ordenar pela posição no HTML original
  structures.sort((a, b) => {
    const posA = html.indexOf(a.content);
    const posB = html.indexOf(b.content);
    return posA - posB;
  });
  
  return structures;
}

/**
 * Remove tags HTML
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Converte DOCX extraído para Markdown
 */
export function docxToMarkdown(result: ExtractionResult): string {
  const lines: string[] = [];
  
  for (const struct of result.structure) {
    if (struct.type === 'heading') {
      const prefix = '#'.repeat(Math.min(struct.level, 6));
      lines.push(`${prefix} ${struct.content}`);
    } else if (struct.type === 'bullet') {
      lines.push(`- ${struct.content}`);
    } else {
      // Parágrafo - detectar se parece com item
      if (struct.content.length < 100) {
        lines.push(`- ${struct.content}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
