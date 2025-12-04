// ============================================
// COMPONENTE DRAG & DROP EDITOR
// ============================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMindMapStore } from '@/store/mindmapStore';
import { flattenTree, treeToMarkdown } from '@/lib/markdown/parser';
import type { MindMapNode } from '@/types';
import { Button } from './ui/Button';

// Componente de Item Sortable
interface SortableItemProps {
  node: MindMapNode;
  depth: number;
  onToggle: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
}

function SortableItem({ node, depth, onToggle, onEdit, onDelete, onAddChild }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.content);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 24}px`,
  };
  
  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(node.id, editValue.trim());
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(node.content);
      setIsEditing(false);
    }
  };
  
  const hasChildren = node.children.length > 0;
  
  // Cores por nível
  const levelColors = [
    'border-l-blue-500 bg-blue-50',
    'border-l-green-500 bg-green-50',
    'border-l-orange-500 bg-orange-50',
    'border-l-purple-500 bg-purple-50',
    'border-l-pink-500 bg-pink-50',
    'border-l-cyan-500 bg-cyan-50',
  ];
  const colorClass = levelColors[depth % levelColors.length];
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-2 mb-1 rounded-lg border-l-4 transition-all',
        colorClass,
        isDragging && 'opacity-50 shadow-lg',
        !isDragging && 'hover:shadow-md'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      {/* Expand/Collapse */}
      {hasChildren ? (
        <button
          onClick={() => onToggle(node.id)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {node.collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      ) : (
        <div className="w-6" />
      )}
      
      {/* Content */}
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 text-sm border border-brand-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm text-gray-800 cursor-text"
          onDoubleClick={() => setIsEditing(true)}
        >
          {node.content}
        </span>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-blue-600"
          title="Editar"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAddChild(node.id)}
          className="p-1 text-gray-400 hover:text-green-600"
          title="Adicionar filho"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        {depth > 0 && (
          <button
            onClick={() => onDelete(node.id)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Remover"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Componente Overlay (preview durante drag)
function DragOverlayItem({ node, depth }: { node: MindMapNode; depth: number }) {
  const levelColors = [
    'border-l-blue-500 bg-blue-100',
    'border-l-green-500 bg-green-100',
    'border-l-orange-500 bg-orange-100',
    'border-l-purple-500 bg-purple-100',
  ];
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border-l-4 shadow-xl',
        levelColors[depth % levelColors.length]
      )}
      style={{ marginLeft: `${depth * 24}px`, width: 'fit-content', minWidth: '200px' }}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-800">{node.content}</span>
    </div>
  );
}

export function DragDropEditor() {
  const { mindMapData, setMarkdown, toggleNodeCollapse, updateNode, addNode, deleteNode, moveNode } = useMindMapStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Flatten tree para lista sortable
  const flatItems = useMemo(() => {
    if (!mindMapData) return [];
    return flattenTree(mindMapData.root);
  }, [mindMapData]);
  
  // Encontrar item ativo
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return flatItems.find(item => item.node.id === activeId);
  }, [activeId, flatItems]);
  
  // Filtrar itens visíveis (respeitar collapsed)
  const visibleItems = useMemo(() => {
    const result: typeof flatItems = [];
    const collapsedParents = new Set<string>();
    
    for (const item of flatItems) {
      // Verificar se algum ancestral está colapsado
      let isHidden = false;
      let currentParentId = item.parentId;
      
      while (currentParentId) {
        if (collapsedParents.has(currentParentId)) {
          isHidden = true;
          break;
        }
        const parent = flatItems.find(i => i.node.id === currentParentId);
        currentParentId = parent?.parentId ?? null;
      }
      
      if (!isHidden) {
        result.push(item);
        if (item.node.collapsed) {
          collapsedParents.add(item.node.id);
        }
      }
    }
    
    return result;
  }, [flatItems]);
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeItem = flatItems.find(i => i.node.id === active.id);
      const overItem = flatItems.find(i => i.node.id === over.id);
      
      if (activeItem && overItem) {
        // Determinar novo pai e posição
        const newParentId = overItem.parentId || mindMapData!.root.id;
        const siblings = flatItems.filter(i => i.parentId === newParentId);
        const overIndex = siblings.findIndex(i => i.node.id === over.id);
        
        moveNode(active.id as string, newParentId, Math.max(0, overIndex));
        
        // Atualizar markdown
        if (mindMapData) {
          const newMarkdown = treeToMarkdown(mindMapData.root);
          setMarkdown(newMarkdown);
        }
      }
    }
    
    setActiveId(null);
  };
  
  const handleToggle = useCallback((id: string) => {
    toggleNodeCollapse(id);
  }, [toggleNodeCollapse]);
  
  const handleEdit = useCallback((id: string, content: string) => {
    updateNode(id, content);
    if (mindMapData) {
      // Atualizar markdown após edição
      setTimeout(() => {
        const state = useMindMapStore.getState();
        if (state.mindMapData) {
          const newMarkdown = treeToMarkdown(state.mindMapData.root);
          setMarkdown(newMarkdown);
        }
      }, 0);
    }
  }, [updateNode, mindMapData, setMarkdown]);
  
  const handleDelete = useCallback((id: string) => {
    deleteNode(id);
    if (mindMapData) {
      setTimeout(() => {
        const state = useMindMapStore.getState();
        if (state.mindMapData) {
          const newMarkdown = treeToMarkdown(state.mindMapData.root);
          setMarkdown(newMarkdown);
        }
      }, 0);
    }
  }, [deleteNode, mindMapData, setMarkdown]);
  
  const handleAddChild = useCallback((parentId: string) => {
    addNode(parentId, 'Novo item');
    if (mindMapData) {
      setTimeout(() => {
        const state = useMindMapStore.getState();
        if (state.mindMapData) {
          const newMarkdown = treeToMarkdown(state.mindMapData.root);
          setMarkdown(newMarkdown);
        }
      }, 0);
    }
  }, [addNode, mindMapData, setMarkdown]);
  
  if (!mindMapData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Carregue um arquivo para começar
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-500 font-medium">Editor Visual</span>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">
          Arraste para reorganizar • Duplo-clique para editar
        </span>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleItems.map(i => i.node.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {visibleItems.map((item) => (
                <motion.div
                  key={item.node.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <SortableItem
                    node={item.node}
                    depth={item.depth}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
          
          <DragOverlay>
            {activeItem ? (
              <DragOverlayItem node={activeItem.node} depth={activeItem.depth} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-400">
          {flatItems.length} itens
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddChild(mindMapData.root.id)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar item
        </Button>
      </div>
    </div>
  );
}
