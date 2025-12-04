// ============================================
// MIND MAP - Markdown Parser
// Parser para arquivos .md
// ============================================

import type { ExtractionResult, TextBlock } from '@/types';
import { sanitizeText } from '@/lib/utils/helpers';
import { detectStructure } from '@/lib/converters/structure-detector';

/**
 * Processa arquivo Markdown
 * Como MD já é estruturado, apenas valida e retorna
 */
export async function parseMd(file: File): Promise<ExtractionResult> {
  const text = await file.text();
  const cleanText = sanitizeText(text);
  const structure = detectStructure(cleanText);

  return {
    text: cleanText,
    structure,
    hasImages: false,
    pageCount: 1,
  };
}

export default parseMd;
