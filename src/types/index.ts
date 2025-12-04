// ============================================
// TIPOS PRINCIPAIS DO MIND MAP
// ============================================

/**
 * Tipos de arquivo suportados para upload
 */
export type SupportedFileType = 'pdf' | 'txt' | 'pptx' | 'md' | 'docx';

/**
 * Status do processamento de arquivo
 */
export type ProcessingStatus = 
  | 'idle' 
  | 'uploading' 
  | 'extracting' 
  | 'ocr' 
  | 'parsing' 
  | 'ready' 
  | 'error';

/**
 * Nó individual do Mind Map
 */
export interface MindMapNode {
  id: string;
  content: string;
  level: number;
  children: MindMapNode[];
  collapsed?: boolean;
  color?: string;
}

/**
 * Estrutura completa do Mind Map
 */
export interface MindMapData {
  root: MindMapNode;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resultado da extração de texto
 */
export interface ExtractionResult {
  text: string;
  structure: ExtractedStructure[];
  metadata: FileMetadata;
  usedOCR: boolean;
}

/**
 * Estrutura extraída do documento
 */
export interface ExtractedStructure {
  level: number;
  content: string;
  type: 'heading' | 'paragraph' | 'bullet' | 'numbered';
}

/**
 * Bloco de texto para processamento
 */
export interface TextBlock {
  content: string;
  type: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'list-item' | 'section' | 'title';
  level: number;
  indent: number;
}

/**
 * Metadados do arquivo
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  pages?: number;
  slides?: number;
}

/**
 * Opções de exportação
 */
export interface ExportOptions {
  format: 'svg' | 'png' | 'pdf';
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  includeTitle?: boolean;
  paginated?: boolean; // Para PDF
}

/**
 * Configurações do Mind Map
 */
export interface MindMapConfig {
  colorScheme: 'default' | 'monochrome' | 'rainbow' | 'custom';
  customColors?: string[];
  fontSize: number;
  lineHeight: number;
  nodeSpacing: number;
  animationDuration: number;
}

/**
 * Estado global da aplicação
 */
export interface AppState {
  // Arquivo
  file: File | null;
  fileType: SupportedFileType | null;
  processingStatus: ProcessingStatus;
  processingProgress: number;
  processingMessage: string;
  
  // Conteúdo
  rawText: string;
  markdown: string;
  mindMapData: MindMapData | null;
  
  // UI
  activeTab: 'text' | 'drag';
  isPresentationMode: boolean;
  isFullscreen: boolean;
  
  // Config
  config: MindMapConfig;
}

/**
 * Item para Drag and Drop
 */
export interface DragItem {
  id: string;
  content: string;
  level: number;
  parentId: string | null;
  order: number;
}

/**
 * Evento de drag
 */
export interface DragEndEvent {
  active: { id: string };
  over: { id: string } | null;
}

/**
 * Dica para o usuário
 */
export interface UserTip {
  id: string;
  icon: string;
  title: string;
  description: string;
}
