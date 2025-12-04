// ============================================
// COMPONENTE EDITOR TABS
// ============================================

'use client';

import { motion } from 'framer-motion';
import { FileText, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMindMapStore } from '@/store/mindmapStore';

export function EditorTabs() {
  const { activeTab, setActiveTab } = useMindMapStore();
  
  const tabs = [
    {
      id: 'text' as const,
      label: 'Editor de Texto',
      icon: FileText,
      description: 'Edite o Markdown diretamente',
    },
    {
      id: 'drag' as const,
      label: 'Editor Visual',
      icon: MousePointer2,
      description: 'Arraste e solte para organizar',
    },
  ];
  
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'text-brand-700'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <tab.icon className="w-4 h-4 relative z-10" />
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
