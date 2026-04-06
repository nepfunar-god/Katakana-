import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { RAW_DATA } from '../data';
import { playClick } from '../utils/audio';

export default function DrawView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [targetRomaji, setTargetRomaji] = useState<string[]>([]);
  const [targetKana, setTargetKana] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);

  const pool = [...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten].filter(item => !item.empty);

  const generateNewSet = () => {
    playClick();
    const newSet = [];
    for (let i = 0; i < 5; i++) {
      newSet.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setTargetRomaji(newSet.map(item => item.r));
    setTargetKana(newSet.map(item => item.c));
    setShowAnswer(false);
    clearCanvas();
  };

  useEffect(() => {
    generateNewSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set actual size in memory (scaled to account for extra pixel density)
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full px-4 pb-4">
      <div className="mb-4 mt-2">
        <h2 className="text-2xl font-black text-zinc-100 tracking-tight mb-2">Handwriting Practice</h2>
        <p className="text-sm text-zinc-400">Draw the katakana for the romaji sequence below.</p>
      </div>

      <div className="bg-[#1A1D24] p-4 rounded-2xl shadow-sm mb-4 border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Sequence</span>
          <button onClick={generateNewSet} className="text-cyan-400 hover:text-cyan-300 p-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center">
          {targetRomaji.map((romaji, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-xl font-bold text-zinc-100">{romaji}</span>
            </div>
          ))}
        </div>
        
        <AnimatePresence>
          {showAnswer && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between items-center mt-4 pt-4 border-t border-white/10"
            >
              {targetKana.map((kana, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-3xl font-black text-cyan-400 font-jp">{kana}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 relative bg-[#1A1D24] rounded-2xl shadow-sm border border-white/5 overflow-hidden touch-none mb-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col justify-between py-8">
          {/* Grid lines for guidance */}
          <div className="w-full h-px bg-white"></div>
          <div className="w-full h-px bg-white"></div>
          <div className="w-full h-px bg-white"></div>
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      <div className="flex gap-3">
        <button 
          onClick={clearCanvas}
          className="flex-1 py-4 bg-[#222630] text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2A2E38] active:scale-95 transition-all"
        >
          <Trash2 className="w-5 h-5" /> Clear
        </button>
        <button 
          onClick={() => { playClick(); setShowAnswer(!showAnswer); }}
          className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${showAnswer ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}
        >
          <CheckCircle2 className="w-5 h-5" /> {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </button>
      </div>
    </motion.div>
  );
}
