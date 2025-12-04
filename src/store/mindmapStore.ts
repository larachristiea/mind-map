// ============================================
// STORE GLOBAL - ZUSTAND
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  AppState, 
  MindMapData, 
  MindMapNode,
  MindMapConfig,
  ProcessingStatus,
  SupportedFileType 
} from '@/types';

// Configuração padrão
const defaultConfig: MindMapConfig = {
  colorScheme: 'default',
  fontSize: 14,
  lineHeight: 1.5,
  nodeSpacing: 20,
  animationDuration: 300,
};

// Estado inicial
const initialState: Omit<AppState, 'actions'> = {
  file: null,
  fileType: null,
  processingStatus: 'idle',
  processingProgress: 0,
  processingMessage: '',
  rawText: '',
  markdown: '',
  mindMapData: null,
  activeTab: 'text',
  isPresentationMode: false,
  isFullscreen: false,
  config: defaultConfig,
};

// Interface do Store
interface MindMapStore extends AppState {
  // Actions - Arquivo
  setFile: (file: File | null) => void;
  setFileType: (type: SupportedFileType | null) => void;
  
  // Actions - Processamento
  setProcessingStatus: (status: ProcessingStatus) => void;
  setProcessingProgress: (progress: number, message?: string) => void;
  
  // Actions - Conteúdo
  setRawText: (text: string) => void;
  setMarkdown: (markdown: string) => void;
  setMindMapData: (data: MindMapData | null) => void;
  updateNode: (nodeId: string, content: string) => void;
  moveNode: (nodeId: string, newParentId: string, newIndex: number) => void;
  addNode: (parentId: string, content: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleNodeCollapse: (nodeId: string) => void;
  
  // Actions - UI
  setActiveTab: (tab: 'text' | 'drag') => void;
  setPresentationMode: (enabled: boolean) => void;
  setFullscreen: (enabled: boolean) => void;
  
  // Actions - Config
  updateConfig: (config: Partial<MindMapConfig>) => void;
  
  // Actions - Reset
  reset: () => void;
}

// Função auxiliar para encontrar e atualizar nó recursivamente
const findAndUpdateNode = (
  node: MindMapNode,
  nodeId: string,
  updater: (node: MindMapNode) => MindMapNode
): MindMapNode => {
  if (node.id === nodeId) {
    return updater(node);
  }
  return {
    ...node,
    children: node.children.map(child => findAndUpdateNode(child, nodeId, updater)),
  };
};

// Função auxiliar para encontrar nó pai
const findParentNode = (
  node: MindMapNode,
  targetId: string,
  parent: MindMapNode | null = null
): MindMapNode | null => {
  if (node.id === targetId) return parent;
  for (const child of node.children) {
    const found = findParentNode(child, targetId, node);
    if (found) return found;
  }
  return null;
};

// Função para gerar ID único
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Criar o store
export const useMindMapStore = create<MindMapStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========== ARQUIVO ==========
      setFile: (file) => set({ file }, false, 'setFile'),
      
      setFileType: (fileType) => set({ fileType }, false, 'setFileType'),

      // ========== PROCESSAMENTO ==========
      setProcessingStatus: (processingStatus) => 
        set({ processingStatus }, false, 'setProcessingStatus'),
      
      setProcessingProgress: (processingProgress, processingMessage = '') =>
        set({ processingProgress, processingMessage }, false, 'setProcessingProgress'),

      // ========== CONTEÚDO ==========
      setRawText: (rawText) => set({ rawText }, false, 'setRawText'),
      
      setMarkdown: (markdown) => set({ markdown }, false, 'setMarkdown'),
      
      setMindMapData: (mindMapData) => set({ mindMapData }, false, 'setMindMapData'),

      updateNode: (nodeId, content) => {
        const { mindMapData } = get();
        if (!mindMapData) return;

        const newRoot = findAndUpdateNode(mindMapData.root, nodeId, (node) => ({
          ...node,
          content,
        }));

        set({
          mindMapData: {
            ...mindMapData,
            root: newRoot,
            updatedAt: new Date(),
          },
        }, false, 'updateNode');
      },

      moveNode: (nodeId, newParentId, newIndex) => {
        const { mindMapData } = get();
        if (!mindMapData) return;

        // Encontrar o nó a ser movido
        let nodeToMove: MindMapNode | null = null;
        
        const removeNode = (node: MindMapNode): MindMapNode => {
          const newChildren = node.children.filter(child => {
            if (child.id === nodeId) {
              nodeToMove = child;
              return false;
            }
            return true;
          }).map(removeNode);
          
          return { ...node, children: newChildren };
        };

        let newRoot = removeNode(mindMapData.root);

        if (!nodeToMove) return;

        // Inserir no novo local
        const insertNode = (node: MindMapNode): MindMapNode => {
          if (node.id === newParentId) {
            const newChildren = [...node.children];
            newChildren.splice(newIndex, 0, {
              ...nodeToMove!,
              level: node.level + 1,
            });
            return { ...node, children: newChildren };
          }
          return {
            ...node,
            children: node.children.map(insertNode),
          };
        };

        newRoot = insertNode(newRoot);

        set({
          mindMapData: {
            ...mindMapData,
            root: newRoot,
            updatedAt: new Date(),
          },
        }, false, 'moveNode');
      },

      addNode: (parentId, content) => {
        const { mindMapData } = get();
        if (!mindMapData) return;

        const newNode: MindMapNode = {
          id: generateId(),
          content,
          level: 0,
          children: [],
        };

        const newRoot = findAndUpdateNode(mindMapData.root, parentId, (node) => ({
          ...node,
          children: [...node.children, { ...newNode, level: node.level + 1 }],
        }));

        set({
          mindMapData: {
            ...mindMapData,
            root: newRoot,
            updatedAt: new Date(),
          },
        }, false, 'addNode');
      },

      deleteNode: (nodeId) => {
        const { mindMapData } = get();
        if (!mindMapData || mindMapData.root.id === nodeId) return;

        const removeNode = (node: MindMapNode): MindMapNode => ({
          ...node,
          children: node.children
            .filter(child => child.id !== nodeId)
            .map(removeNode),
        });

        set({
          mindMapData: {
            ...mindMapData,
            root: removeNode(mindMapData.root),
            updatedAt: new Date(),
          },
        }, false, 'deleteNode');
      },

      toggleNodeCollapse: (nodeId) => {
        const { mindMapData } = get();
        if (!mindMapData) return;

        const newRoot = findAndUpdateNode(mindMapData.root, nodeId, (node) => ({
          ...node,
          collapsed: !node.collapsed,
        }));

        set({
          mindMapData: {
            ...mindMapData,
            root: newRoot,
          },
        }, false, 'toggleNodeCollapse');
      },

      // ========== UI ==========
      setActiveTab: (activeTab) => set({ activeTab }, false, 'setActiveTab'),
      
      setPresentationMode: (isPresentationMode) => 
        set({ isPresentationMode }, false, 'setPresentationMode'),
      
      setFullscreen: (isFullscreen) => 
        set({ isFullscreen }, false, 'setFullscreen'),

      // ========== CONFIG ==========
      updateConfig: (newConfig) => {
        const { config } = get();
        set({ config: { ...config, ...newConfig } }, false, 'updateConfig');
      },

      // ========== RESET ==========
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'MindMapStore' }
  )
);

// Seletores otimizados
export const selectFile = (state: MindMapStore) => state.file;
export const selectMarkdown = (state: MindMapStore) => state.markdown;
export const selectMindMapData = (state: MindMapStore) => state.mindMapData;
export const selectProcessingStatus = (state: MindMapStore) => state.processingStatus;
export const selectConfig = (state: MindMapStore) => state.config;
