// ============================================
// EXTRATOR DE TXT E MD
// ============================================

import type { ExtractionResult, ExtractedStructure } from '@/types';
import { cleanExtractedText } from '@/lib/utils';

/**
 * Detecta o nível de heading baseado em padrões
 */
function detectLevel(line: string): { level: number; type: ExtractedStructure['type']; content: string } {
  const trimmed = line.trim();
  
  // Markdown headers
  const mdMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (mdMatch) {
    return {
      level: mdMatch[1].length,
      type: 'heading',
      content: mdMatch[2],
    };
  }
  
  // Numeração principal (1. , 2. etc)
  if (/^\d+[.)]\s+/.test(trimmed)) {
    return {
      level: 2,
      type: 'numbered',
      content: trimmed.replace(/^\d+[.)]\s+/, ''),
    };
  }
  
  // Subnumeração (1.1, 1.2 etc)
  if (/^\d+\.\d+[.)]*\s+/.test(trimmed)) {
    return {
      level: 3,
      type: 'numbered',
      content: trimmed.replace(/^\d+\.\d+[.)]*\s+/, ''),
    };
  }
  
  // Sub-subnumeração (1.1.1 etc)
  if (/^\d+\.\d+\.\d+[.)]*\s+/.test(trimmed)) {
    return {
      level: 4,
      type: 'numbered',
      content: trimmed.replace(/^\d+\.\d+\.\d+[.)]*\s+/, ''),
    };
  }
  
  // Bullets
  if (/^[-*•]\s+/.test(trimmed)) {
    return {
      level: 3,
      type: 'bullet',
      content: trimmed.replace(/^[-*•]\s+/, ''),
    };
  }
  
  // Letras (a), b), etc)
  if (/^[a-z][.)]\s+/i.test(trimmed)) {
    return {
      level: 4,
      type: 'bullet',
      content: trimmed.replace(/^[a-z][.)]\s+/i, ''),
    };
  }
  
  // Linha toda em maiúsculas (provável título)
  if (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return {
      level: 1,
      type: 'heading',
      content: trimmed,
    };
  }
  
  // Linha terminando com : (provável subtítulo)
  if (trimmed.endsWith(':') && trimmed.length < 80) {
    return {
      level: 2,
      type: 'heading',
      content: trimmed.slice(0, -1),
    };
  }
  
  // Parágrafo normal
  return {
    level: 3,
    type: 'paragraph',
    content: trimmed,
  };
}

/**
 * Processa texto com indentação
 */
function processWithIndentation(text: string): ExtractedStructure[] {
  const lines = text.split('\n');
  const structures: ExtractedStructure[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Contar indentação
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const indentLevel = Math.floor(leadingSpaces / 2);
    
    const { level, type, content } = detectLevel(line);
    
    // Ajustar nível baseado na indentação
    const adjustedLevel = Math.min(level + indentLevel, 6);
    
    structures.push({
      level: adjustedLevel,
      type,
      content,
    });
  }
  
  return structures;
}

/**
 * Extrai texto de arquivo TXT
 */
export async function extractFromTxt(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(10, 'Lendo arquivo...');
  
  const text = await file.text();
  
  onProgress?.(50, 'Analisando estrutura...');
  
  const structures = processWithIndentation(text);
  
  onProgress?.(90, 'Finalizando...');
  
  return {
    text: cleanExtractedText(text),
    structure: structures,
    metadata: {
      name: file.name,
      size: file.size,
      type: 'txt',
    },
    usedOCR: false,
  };
}

/**
 * Extrai de arquivo MD (já estruturado)
 */
export async function extractFromMd(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(10, 'Lendo arquivo Markdown...');
  
  const text = await file.text();
  
  onProgress?.(50, 'Processando estrutura...');
  
  const structures = processWithIndentation(text);
  
  onProgress?.(90, 'Finalizando...');
  
  return {
    text: text,
    structure: structures,
    metadata: {
      name: file.name,
      size: file.size,
      type: 'md',
    },
    usedOCR: false,
  };
}

/**
 * Converte TXT extraído para Markdown estruturado
 */
export function txtToMarkdown(result: ExtractionResult): string {
  // Se não tem estrutura, tentar criar uma básica
  if (result.structure.length === 0) {
    const paragraphs = result.text.split(/\n\n+/).filter(p => p.trim());
    const lines: string[] = [];
    
    if (paragraphs.length > 0) {
      // Primeiro parágrafo vira título
      lines.push(`# ${paragraphs[0].substring(0, 80)}`);
      lines.push('');
    }
    
    for (let i = 1; i < paragraphs.length; i++) {
      lines.push(`- ${paragraphs[i].trim()}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  // Converter estrutura para Markdown
  const lines: string[] = [];
  
  for (const struct of result.structure) {
    if (struct.type === 'heading') {
      const prefix = '#'.repeat(Math.min(struct.level, 6));
      lines.push(`${prefix} ${struct.content}`);
    } else if (struct.type === 'bullet' || struct.type === 'numbered') {
      const indent = '  '.repeat(Math.max(0, struct.level - 2));
      lines.push(`${indent}- ${struct.content}`);
    } else {
      lines.push(`- ${struct.content}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
