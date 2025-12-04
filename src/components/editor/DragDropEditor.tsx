// ============================================
// Mind Map - DragDropEditor Component
// Editor visual com drag and drop
// ============================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateId } from '@/lib/utils/helpers';

interface DragItem {
  id: string;
  content: string;
  level: number;
}

interface DragDropEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

// Parse markdown to items
function markdownToItems(markdown: string): DragItem[] {
  const lines = markdown.split('\n').filter(line => line.trim());
  const items: DragItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect level from markdown syntax
    let level = 0;
    let content = trimmed;

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      level = headingMatch[1].length - 1;
      content = headingMatch[2];
    }
    // Bullets
    else if (trimmed.match(/^[-*]\s+/)) {
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;
      level = Math.floor(indent / 2) + 2;
      content = trimmed.replace(/^[-*]\s+/, '');
    }

    if (content) {
      items.push({
        id: generateId(),
        content,
        level,
      });
    }
  }

  return items;
}

// Convert items back to markdown
function itemsToMarkdown(items: DragItem[]): string {
  return items.map(item => {
    if (item.level <= 5) {
      return '#'.repeat(item.level + 1) + ' ' + item.content;
    } else {
      const indent = '  '.repeat(item.level - 5);
      return indent + '- ' + item.content;
    }
  }).join('\n');
}

export function DragDropEditor({ markdown, onChange }: DragDropEditorProps) {
  const [items, setItems] = useState<DragItem[]>(() => markdownToItems(markdown));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const activeItem = useMemo(
    () => items.find(item => item.id === activeId),
    [activeId, items]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setItems(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Atualiza markdown
        onChange(itemsToMarkdown(newItems));
        return newItems;
      });
    }
  }, [onChange]);

  const handleContentChange = useCallback((id: string, content: string) => {
    setItems(items => {
      const newItems = items.map(item => 
        item.id === id ? { ...item, content } : item
      );
      onChange(itemsToMarkdown(newItems));
      return newItems;
    });
  }, [onChange]);

  const handleLevelChange = useCallback((id: string, delta: number) => {
    setItems(items => {
      const newItems = items.map(item => 
        item.id === id 
          ? { ...item, level: Math.max(0, Math.min(8, item.level + delta)) } 
          : item
      );
      onChange(itemsToMarkdown(newItems));
      return newItems;
    });
  }, [onChange]);

  const handleDelete = useCallback((id: string) => {
    setItems(items => {
      const newItems = items.filter(item => item.id !== id);
      onChange(itemsToMarkdown(newItems));
      return newItems;
    });
  }, [onChange]);

  const handleAddItem = useCallback(() => {
    const newItem: DragItem = {
      id: generateId(),
      content: 'Novo item',
      level: 1,
    };
    setItems(items => {
      const newItems = [...items, newItem];
      onChange(itemsToMarkdown(newItems));
      return newItems;
    });
    setEditingId(newItem.id);
  }, [onChange]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]/50">
        <Button variant="ghost" size="sm" onClick={handleAddItem}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar item
        </Button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  onStartEdit={() => setEditingId(item.id)}
                  onEndEdit={() => setEditingId(null)}
                  onContentChange={handleContentChange}
                  onLevelChange={handleLevelChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div className="p-3 bg-[rgb(var(--card))] border border-[rgb(var(--primary))] rounded-lg shadow-lg opacity-90">
                <span className="text-sm">{activeItem.content}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {items.length === 0 && (
          <div className="text-center py-12 text-[rgb(var(--muted-foreground))]">
            <p className="mb-2">Nenhum item ainda</p>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar primeiro item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DragDropEditor;
