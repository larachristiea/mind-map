// ============================================
// Mind Map - ProcessingOverlay Component
// ============================================

'use client';

import { motion } from 'framer-motion';

interface ProcessingOverlayProps {
  progress: number;
  message: string;
  stage?: string;
}

export function ProcessingOverlay({ progress, message, stage }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background))]/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--card))] rounded-2xl p-8 shadow-2xl border border-[rgb(var(--border))] max-w-md w-full mx-4"
      >
        {/* Animated Icon */}
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full border-4 border-[rgb(var(--secondary))] border-t-[rgb(var(--primary))]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-[rgb(var(--primary))]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[rgb(var(--secondary))] rounded-full mb-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--mm-node-5))] rounded-full"
          />
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-lg font-medium text-[rgb(var(--foreground))] mb-1">
            {message}
          </p>
          {stage && (
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              {stage}
            </p>
          )}
        </div>

        {/* Processing stages indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {['reading', 'extracting', 'structuring', 'complete'].map((s, i) => {
            const stages = ['reading', 'extracting', 'structuring', 'complete'];
            const currentIndex = stages.indexOf(stage || 'reading');
            const isActive = i <= currentIndex;
            
            return (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-[rgb(var(--primary))]' 
                    : 'bg-[rgb(var(--secondary))]'
                }`}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export default ProcessingOverlay;
