// ============================================
// PARSER DE MARKDOWN PARA MIND MAP
// ============================================

import type { MindMapNode, MindMapData } from '@/types';
import { generateId } from '@/lib/utils';

/**
 * Linha parseada do Markdown
 */
interface ParsedLine {
  level: number;
  content: string;
  type: 'heading' | 'bullet' | 'text';
}

/**
 * Parseia linha de Markdown e detecta nível
 */
function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  // Headers (# ... ######)
  const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headerMatch) {
    return {
      level: headerMatch[1].length,
      content: headerMatch[2].trim(),
      type: 'heading',
    };
  }
  
  // Bullets com indentação
  const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
  if (bulletMatch) {
    const indent = bulletMatch[1].length;
    const baseLevel = 3; // Bullets começam no nível 3
    const indentLevel = Math.floor(indent / 2);
    return {
      level: baseLevel + indentLevel,
      content: bulletMatch[2].trim(),
      type: 'bullet',
    };
  }
  
  // Lista numerada
  const numberedMatch = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
  if (numberedMatch) {
    const indent = numberedMatch[1].length;
    const baseLevel = 3;
    const indentLevel = Math.floor(indent / 2);
    return {
      level: baseLevel + indentLevel,
      content: numberedMatch[2].trim(),
      type: 'bullet',
    };
  }
  
  // Texto simples (vira bullet)
  if (trimmed.length > 0) {
    // Verificar indentação para determinar nível
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const level = Math.max(3, Math.floor(leadingSpaces / 2) + 2);
    return {
      level,
      content: trimmed,
      type: 'text',
    };
  }
  
  return null;
}

/**
 * Converte Markdown em estrutura de árvore
 */
export function markdownToTree(markdown: string): MindMapNode {
  const lines = markdown.split('\n');
  const parsedLines = lines
    .map(parseLine)
    .filter((line): line is ParsedLine => line !== null);
  
  // Criar nó raiz
  const root: MindMapNode = {
    id: generateId(),
    content: 'Mind Map',
    level: 0,
    children: [],
  };
  
  // Se não tem linhas, retornar raiz vazia
  if (parsedLines.length === 0) {
    return root;
  }
  
  // Usar primeiro heading como título do root
  if (parsedLines[0].type === 'heading' && parsedLines[0].level === 1) {
    root.content = parsedLines[0].content;
    parsedLines.shift();
  }
  
  // Stack para rastrear hierarquia
  const stack: MindMapNode[] = [root];
  
  for (const parsed of parsedLines) {
    const newNode: MindMapNode = {
      id: generateId(),
      content: parsed.content,
      level: parsed.level,
      children: [],
    };
    
    // Encontrar pai correto baseado no nível
    while (stack.length > 1 && stack[stack.length - 1].level >= parsed.level) {
      stack.pop();
    }
    
    // Adicionar ao pai atual
    const parent = stack[stack.length - 1];
    parent.children.push(newNode);
    
    // Adicionar à stack se pode ter filhos (headings e bullets podem)
    if (parsed.type === 'heading' || parsed.type === 'bullet') {
      stack.push(newNode);
    }
  }
  
  return root;
}

/**
 * Converte árvore de volta para Markdown
 */
export function treeToMarkdown(node: MindMapNode, isRoot = true): string {
  const lines: string[] = [];
  
  if (isRoot && node.content && node.content !== 'Mind Map') {
    lines.push(`# ${node.content}`);
    lines.push('');
  }
  
  function processNode(n: MindMapNode, depth: number = 0) {
    // Pular o root
    if (n === node) {
      for (const child of n.children) {
        processNode(child, 0);
      }
      return;
    }
    
    // Determinar formatação baseada no nível original
    if (n.level <= 2) {
      const prefix = '#'.repeat(Math.min(n.level + 1, 6));
      lines.push(`${prefix} ${n.content}`);
    } else {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}- ${n.content}`);
    }
    lines.push('');
    
    // Processar filhos
    for (const child of n.children) {
      processNode(child, depth + 1);
    }
  }
  
  processNode(node);
  
  return lines.join('\n');
}

/**
 * Cria estrutura MindMapData a partir de Markdown
 */
export function createMindMapData(markdown: string, title?: string): MindMapData {
  const root = markdownToTree(markdown);
  
  // Usar título fornecido ou do markdown
  if (title && root.content === 'Mind Map') {
    root.content = title;
  }
  
  return {
    root,
    title: root.content,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Flatten da árvore para lista (útil para drag & drop)
 */
export function flattenTree(node: MindMapNode): Array<{ node: MindMapNode; parentId: string | null; depth: number }> {
  const result: Array<{ node: MindMapNode; parentId: string | null; depth: number }> = [];
  
  function traverse(n: MindMapNode, parentId: string | null, depth: number) {
    result.push({ node: n, parentId, depth });
    for (const child of n.children) {
      traverse(child, n.id, depth + 1);
    }
  }
  
  traverse(node, null, 0);
  return result;
}

/**
 * Reconstrói árvore a partir de lista flat
 */
export function unflattenTree(
  items: Array<{ id: string; content: string; parentId: string | null; order: number }>
): MindMapNode {
  // Encontrar root
  const rootItem = items.find(i => i.parentId === null);
  if (!rootItem) {
    return {
      id: generateId(),
      content: 'Mind Map',
      level: 0,
      children: [],
    };
  }
  
  // Função recursiva para construir árvore
  function buildNode(item: typeof items[0], level: number): MindMapNode {
    const children = items
      .filter(i => i.parentId === item.id)
      .sort((a, b) => a.order - b.order)
      .map(i => buildNode(i, level + 1));
    
    return {
      id: item.id,
      content: item.content,
      level,
      children,
    };
  }
  
  return buildNode(rootItem, 0);
}
