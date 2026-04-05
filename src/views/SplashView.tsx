import { motion } from 'motion/react';

export default function SplashView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f0f11]"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 }}
        className="w-40 h-40 bg-zinc-900 border border-zinc-800 rounded-[40px] flex items-center justify-center shadow-2xl relative overflow-hidden mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-transparent opacity-50"></div>
        <span className="text-[96px] text-zinc-100 font-black font-jp drop-shadow-lg relative z-10">ア</span>
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-4xl font-black text-zinc-100 tracking-tight"
      >
        Katakana King
      </motion.h1>
    </motion.div>
  );
}
