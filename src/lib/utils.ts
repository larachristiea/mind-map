// ============================================
// UTILIDADES GERAIS
// ============================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS com suporte a Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera um ID único
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Formata tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Detecta tipo de arquivo pela extensão
 */
export function getFileType(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    pdf: 'pdf',
    txt: 'txt',
    md: 'md',
    markdown: 'md',
    pptx: 'pptx',
    docx: 'docx',
    // NÃO incluir .ppt e .doc (formatos antigos não suportados)
  };
  return ext ? typeMap[ext] || null : null;
}

/**
 * Valida se o arquivo é suportado
 */
export function isFileSupported(file: File): boolean {
  const supportedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  // Apenas formatos modernos (não .ppt ou .doc antigos)
  const supportedExtensions = ['pdf', 'txt', 'md', 'markdown', 'pptx', 'docx'];
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  return supportedTypes.includes(file.type) || (ext ? supportedExtensions.includes(ext) : false);
}

/**
 * Escapa caracteres especiais de Markdown
 */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Limpa e normaliza texto extraído
 */
export function cleanExtractedText(text: string): string {
  return text
    // Remove múltiplos espaços
    .replace(/[ \t]+/g, ' ')
    // Remove múltiplas quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços no início/fim de linhas
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove linhas vazias no início/fim
    .trim();
}

/**
 * Detecta se texto contém estrutura (bullets, números, etc)
 */
export function detectStructure(text: string): boolean {
  const structurePatterns = [
    /^[-*•]\s+/m,           // Bullets
    /^\d+[.)]\s+/m,         // Numeração
    /^#{1,6}\s+/m,          // Headers Markdown
    /^[A-Z][^.!?]*[:]\s*$/m, // Títulos com dois pontos
  ];
  
  return structurePatterns.some(pattern => pattern.test(text));
}

/**
 * Converte cor hex para RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Gera cores para níveis do mind map
 */
export function generateLevelColors(baseColor: string, levels: number): string[] {
  const colors: string[] = [];
  const rgb = hexToRgb(baseColor);
  
  if (!rgb) return Array(levels).fill(baseColor);
  
  for (let i = 0; i < levels; i++) {
    const factor = 1 - (i * 0.15);
    const r = Math.round(rgb.r * factor);
    const g = Math.round(rgb.g * factor);
    const b = Math.round(rgb.b * factor);
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return colors;
}

/**
 * Download de arquivo
 */
export function downloadFile(content: string | Blob, filename: string, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copia texto para clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para navegadores antigos
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Aguarda um tempo
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
