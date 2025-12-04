// ============================================
// MIND MAP - Structure Detector
// Detecta e converte texto em estrutura hierárquica
// ============================================

import type { TextBlock, MindMapNode } from '@/types';
import { generateId, sanitizeText } from '@/lib/utils/helpers';

/** Padrões de detecção de estrutura */
const PATTERNS = {
  // Headings markdown
  h1: /^#\s+(.+)$/,
  h2: /^##\s+(.+)$/,
  h3: /^###\s+(.+)$/,
  h4: /^####\s+(.+)$/,
  h5: /^#####\s+(.+)$/,
  h6: /^######\s+(.+)$/,
  
  // Bullets e listas
  bullet: /^[\s]*[-*•]\s+(.+)$/,
  numbered: /^[\s]*\d+[.)]\s+(.+)$/,
  
  // Indentação (tabs ou espaços)
  indented: /^(\s+)(.+)$/,
  
  // Títulos em CAPS
  capsTitle: /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]{5,}$/,
  
  // Linhas numeradas tipo "1. ", "1.1 ", "1.1.1 "
  sectionNumber: /^(\d+(?:\.\d+)*)[.)]\s*(.+)$/,
};

/** Detecta nível de indentação */
function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1].length;
  // 2 espaços = 1 nível, tab = 1 nível
  return Math.floor(spaces / 2);
}

/** Detecta tipo de bloco de texto */
function detectBlockType(line: string): TextBlock['type'] {
  const trimmed = line.trim();
  
  // Markdown headings
  if (PATTERNS.h1.test(trimmed)) return 'heading';
  if (PATTERNS.h2.test(trimmed)) return 'heading';
  if (PATTERNS.h3.test(trimmed)) return 'heading';
  if (PATTERNS.h4.test(trimmed)) return 'heading';
  
  // Listas
  if (PATTERNS.bullet.test(trimmed)) return 'list-item';
  if (PATTERNS.numbered.test(trimmed)) return 'list-item';
  
  // Títulos em caps (geralmente títulos de seção)
  if (PATTERNS.capsTitle.test(trimmed) && trimmed.length < 100) return 'title';
  
  // Seções numeradas
  if (PATTERNS.sectionNumber.test(trimmed)) return 'heading';
  
  return 'paragraph';
}

/** Detecta nível do heading markdown */
function getHeadingLevel(line: string): number {
  const match = line.match(/^(#{1,6})\s/);
  return match ? match[1].length : 0;
}

/** Extrai conteúdo limpo do bloco */
function extractContent(line: string): string {
  let content = line.trim();
  
  // Remove prefixos markdown
  content = content.replace(/^#{1,6}\s+/, '');
  
  // Remove bullets
  content = content.replace(/^[-*•]\s+/, '');
  
  // Remove numeração
  content = content.replace(/^\d+[.)]\s+/, '');
  content = content.replace(/^\d+(?:\.\d+)*[.)]\s*/, '');
  
  return content.trim();
}

/** 
 * Converte texto bruto em blocos estruturados
 * Função principal de detecção
 */
export function detectStructure(text: string): TextBlock[] {
  const lines = sanitizeText(text).split('\n');
  const blocks: TextBlock[] = [];
  let index = 0;

  for (const line of lines) {
    if (!line.trim()) continue; // Pula linhas vazias
    
    const type = detectBlockType(line);
    const content = extractContent(line);
    
    if (!content) continue;

    let level = 0;
    
    // Calcula nível baseado no tipo
    if (type === 'heading') {
      level = getHeadingLevel(line) || 1;
    } else if (type === 'list-item') {
      level = getIndentLevel(line) + 2; // Lista sempre abaixo de headings
    } else if (type === 'title') {
      level = 1;
    } else {
      level = getIndentLevel(line) + 2;
    }

    blocks.push({
      content,
      type,
      level,
      index: index++,
    });
  }

  return blocks;
}

/**
 * Converte blocos em árvore de nós do mind map
 */
export function blocksToNodes(blocks: TextBlock[]): MindMapNode[] {
  if (blocks.length === 0) return [];

  const root: MindMapNode[] = [];
  const stack: { node: MindMapNode; level: number }[] = [];

  for (const block of blocks) {
    const newNode: MindMapNode = {
      id: generateId(),
      content: block.content,
      level: block.level,
      children: [],
    };

    // Encontra o pai correto baseado no nível
    while (stack.length > 0 && stack[stack.length - 1].level >= block.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Nó raiz
      root.push(newNode);
    } else {
      // Adiciona como filho do último item na stack
      stack[stack.length - 1].node.children.push(newNode);
    }

    stack.push({ node: newNode, level: block.level });
  }

  return root;
}

/**
 * Converte nós do mind map de volta para Markdown
 */
export function nodesToMarkdown(nodes: MindMapNode[], baseLevel = 0): string {
  let md = '';

  for (const node of nodes) {
    const level = baseLevel + 1;
    
    if (level <= 6) {
      // Usa headings markdown
      md += '#'.repeat(level) + ' ' + node.content + '\n';
    } else {
      // Usa bullets para níveis profundos
      const indent = '  '.repeat(level - 6);
      md += indent + '- ' + node.content + '\n';
    }

    if (node.children.length > 0) {
      md += nodesToMarkdown(node.children, level);
    }
  }

  return md;
}

/**
 * Função principal: texto → markdown estruturado
 */
export function textToMarkdown(text: string, title?: string): string {
  const blocks = detectStructure(text);
  const nodes = blocksToNodes(blocks);
  
  let markdown = '';
  
  // Adiciona título se fornecido
  if (title) {
    markdown = '# ' + title + '\n\n';
  }
  
  // Se não detectou estrutura, cria estrutura básica
  if (nodes.length === 0 && text.trim()) {
    // Divide em parágrafos e cria lista
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    markdown += paragraphs.map(p => '- ' + p.trim()).join('\n');
  } else {
    markdown += nodesToMarkdown(nodes);
  }

  return markdown;
}
