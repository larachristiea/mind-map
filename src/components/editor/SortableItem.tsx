// ============================================
// Mind Map - SortableItem Component
// Item individual do drag and drop
// ============================================

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronLeft, ChevronRight, Trash2, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/helpers';

interface DragItem {
  id: string;
  content: string;
  level: number;
}

interface SortableItemProps {
  item: DragItem;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onContentChange: (id: string, content: string) => void;
  onLevelChange: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

const LEVEL_COLORS = [
  'border-l-[rgb(var(--mm-node-1))]',
  'border-l-[rgb(var(--mm-node-2))]',
  'border-l-[rgb(var(--mm-node-3))]',
  'border-l-[rgb(var(--mm-node-4))]',
  'border-l-[rgb(var(--mm-node-5))]',
  'border-l-[rgb(var(--mm-node-6))]',
];

export function SortableItem({
  item,
  isEditing,
  onStartEdit,
  onEndEdit,
  onContentChange,
  onLevelChange,
  onDelete,
}: SortableItemProps) {
  const [localContent, setLocalContent] = useState(item.content);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync local content with prop
  useEffect(() => {
    setLocalContent(item.content);
  }, [item.content]);

  const handleSave = () => {
    if (localContent.trim()) {
      onContentChange(item.id, localContent.trim());
    }
    onEndEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalContent(item.content);
      onEndEdit();
    }
  };

  const colorClass = LEVEL_COLORS[item.level % LEVEL_COLORS.length];
  const indent = item.level * 16;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: indent }}
      className={cn(
        'drag-item group flex items-center gap-2 p-2 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] border-l-4',
        colorClass,
        isDragging && 'dragging',
        isEditing && 'ring-2 ring-[rgb(var(--primary))]'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded hover:bg-[rgb(var(--secondary))] cursor-grab active:cursor-grabbing text-[rgb(var(--muted-foreground))]"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 bg-[rgb(var(--secondary))] rounded text-sm text-[rgb(var(--foreground))] focus:outline-none"
          />
        ) : (
          <span
            onClick={onStartEdit}
            className="block truncate text-sm text-[rgb(var(--foreground))] cursor-text hover:text-[rgb(var(--primary))]"
          >
            {item.content}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        'flex items-center gap-1 transition-opacity',
        isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {/* Level controls */}
        <button
          onClick={() => onLevelChange(item.id, -1)}
          disabled={item.level === 0}
          className="p-1 rounded hover:bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] disabled:opacity-30"
          title="Diminuir nível"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-[rgb(var(--muted-foreground))] w-4 text-center">
          {item.level + 1}
        </span>
        <button
          onClick={() => onLevelChange(item.id, 1)}
          disabled={item.level >= 8}
          className="p-1 rounded hover:bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] disabled:opacity-30"
          title="Aumentar nível"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 rounded hover:bg-[rgb(var(--destructive))]/10 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--destructive))]"
          title="Remover"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default SortableItem;
