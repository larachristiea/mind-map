// ============================================
// MIND MAP - Utility Functions
// ============================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SupportedFileType } from '@/types';

/** Merge de classes Tailwind sem conflitos */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Detecta tipo de arquivo pela extensão */
export function getFileType(fileName: string): SupportedFileType | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, SupportedFileType> = {
    pdf: 'pdf',
    txt: 'txt',
    pptx: 'pptx',
    ppt: 'pptx',
    md: 'md',
    markdown: 'md',
    docx: 'docx',
  };
  return typeMap[ext || ''] || null;
}

/** Valida se arquivo é suportado */
export function isValidFile(file: File): boolean {
  return getFileType(file.name) !== null;
}

/** Formata tamanho de arquivo */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** Gera ID único */
export function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Debounce para otimização de performance */
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

/** Throttle para limitar chamadas */
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

/** Converte ArrayBuffer para Base64 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Sanitiza texto removendo caracteres problemáticos */
export function sanitizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
    .trim();
}

/** Escapa caracteres especiais de Markdown */
export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

/** Remove tags HTML de texto */
export function stripHtml(html: string): string {
  const div = typeof document !== 'undefined' 
    ? document.createElement('div') 
    : null;
  if (div) {
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
}
