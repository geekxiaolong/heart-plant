import React from 'react';
import { Quote } from 'lucide-react';
import { motion } from 'motion/react';

interface GoldenSentenceCardProps {
  sentence: string;
}

export const GoldenSentenceCard = ({ sentence }: GoldenSentenceCardProps) => {
  if (!sentence) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative p-8 rounded-[48px] bg-gradient-to-br from-gray-900 to-black overflow-hidden shadow-2xl"
    >
      <div className="absolute -top-4 -left-4 text-white/5">
        <Quote size={120} fill="currentColor" />
      </div>
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
            <Quote size={14} className="text-pink-400" />
          </div>
          <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">寓意金句</span>
        </div>

        <p className="text-xl font-black text-white leading-relaxed italic pr-6">
          “ {sentence} ”
        </p>

        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-white/20" />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">心植 · 档案寓意</span>
        </div>
      </div>

      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
    </motion.div>
  );
};
