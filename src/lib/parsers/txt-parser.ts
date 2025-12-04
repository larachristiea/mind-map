// ============================================
// MIND MAP - TXT Parser
// Parser para arquivos de texto simples
// ============================================

import type { ExtractionResult, TextBlock } from '@/types';
import { sanitizeText } from '@/lib/utils/helpers';
import { detectStructure } from '@/lib/converters/structure-detector';

/**
 * Processa arquivo TXT
 */
export async function parseTxt(file: File): Promise<ExtractionResult> {
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

export default parseTxt;
