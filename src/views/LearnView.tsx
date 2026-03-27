import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Volume2, Check, X, PenTool, ChevronRight, ArrowLeft, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RAW_DATA } from '../data';
import { speak } from '../utils/tts';
import { playClick } from '../utils/audio';

type FilterType = 'basic' | 'dakuten' | 'handakuten' | 'words';

function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#818cf8'; // indigo-400
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newPos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();
    setLastPos(newPos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="relative w-full aspect-square bg-[#0f0f11] rounded-[24px] border border-zinc-800 overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <button onClick={clearCanvas} className="text-sm text-pink-400 font-bold self-end hover:text-pink-300 transition-colors px-2 py-1">
        Clear
      </button>
    </div>
  );
}

export default function LearnView() {
  const [viewMode, setViewMode] = useState<'categories' | 'grid'>('categories');
  const [filter, setFilter] = useState<FilterType>('basic');
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [customWords, setCustomWords] = useState<any[]>([]);
  const [lang, setLang] = useState('en');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);

  useEffect(() => {
    setProgress(JSON.parse(localStorage.getItem('kn_progress') || '{}'));
    setCustomWords(JSON.parse(localStorage.getItem('kn_custom') || '[]'));
    setLang(localStorage.getItem('kn_lang') || 'en');
  }, []);

  const allItems = useMemo(() => [
    ...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten, ...RAW_DATA.words, ...customWords
  ], [customWords]);

  const displayedItems = useMemo(() => {
    if (search) {
      const lowerSearch = search.toLowerCase();
      return allItems.filter(i => 
        i.c.includes(lowerSearch) || 
        i.r.toLowerCase().includes(lowerSearch) || 
        (i.m && i.m.toLowerCase().includes(lowerSearch))
      );
    }
    if (filter === 'words') return [...RAW_DATA.words, ...customWords];
    return RAW_DATA[filter as keyof typeof RAW_DATA] || [];
  }, [filter, search, allItems, customWords]);

  const isWordMode = filter === 'words' || (search && displayedItems.length > 0 && displayedItems[0].m);

  const openModal = (item: any) => {
    playClick();
    setSelectedItem(item);
    setShowDrawing(false);
  };

  const markAsKnown = (item: any) => {
    playClick();
    const newProgress = { ...progress, [item.id]: { box: 1, next: Date.now() + 60000 } };
    setProgress(newProgress);
    localStorage.setItem('kn_progress', JSON.stringify(newProgress));
    setSelectedItem(null);
  };

  const selectCategory = (cat: FilterType) => {
    playClick();
    setFilter(cat);
    setSearch('');
    setViewMode('grid');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value) {
      setViewMode('grid');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="sticky top-0 bg-[#0f0f11]/95 backdrop-blur-md py-3 z-20 space-y-4 mb-2 px-5">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            value={search}
            onChange={handleSearch}
            placeholder="Search vocabulary..." 
            className="w-full bg-zinc-900/80 text-zinc-100 text-base rounded-full py-3 pl-12 pr-4 border border-white/5 focus:bg-zinc-800 focus:outline-none transition-colors shadow-sm"
          />
        </div>
        
        {viewMode === 'grid' && !search && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['basic', 'dakuten', 'handakuten', 'words'] as FilterType[]).map(f => (
              <button 
                key={f}
                onClick={() => { playClick(); setFilter(f); setSearch(''); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  filter === f ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {f === 'basic' ? 'Basic' : f === 'dakuten' ? 'Dakuten (゛)' : f === 'handakuten' ? 'Handakuten (゜)' : 'Vocabulary'}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'categories' && !search && (
        <div className="flex flex-col gap-3 mt-2 px-5 pb-8">
          <button onClick={() => selectCategory('basic')} className="w-full p-5 bg-zinc-900 rounded-[28px] flex items-center gap-5 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <span className="text-2xl font-bold font-jp">ア</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[17px] font-bold text-zinc-100 mb-0.5">Basic Katakana</h3>
              <p className="text-[13px] text-zinc-500 font-medium">The 46 fundamental characters</p>
            </div>
            <ChevronRight className="text-zinc-600 w-5 h-5 shrink-0" />
          </button>

          <button onClick={() => selectCategory('dakuten')} className="w-full p-5 bg-zinc-900 rounded-[28px] flex items-center gap-5 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <span className="text-2xl font-bold font-jp">ガ</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[17px] font-bold text-zinc-100 mb-0.5">Dakuten (゛)</h3>
              <p className="text-[13px] text-zinc-500 font-medium">Voiced sounds (Ga, Gi, Gu...)</p>
            </div>
            <ChevronRight className="text-zinc-600 w-5 h-5 shrink-0" />
          </button>

          <button onClick={() => selectCategory('handakuten')} className="w-full p-5 bg-zinc-900 rounded-[28px] flex items-center gap-5 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
              <span className="text-2xl font-bold font-jp">パ</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[17px] font-bold text-zinc-100 mb-0.5">Handakuten (゜)</h3>
              <p className="text-[13px] text-zinc-500 font-medium">P-sounds (Pa, Pi, Pu...)</p>
            </div>
            <ChevronRight className="text-zinc-600 w-5 h-5 shrink-0" />
          </button>

          <button onClick={() => selectCategory('words')} className="w-full p-5 bg-zinc-900 rounded-[28px] flex items-center gap-5 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Languages className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[17px] font-bold text-zinc-100 mb-0.5">Vocabulary</h3>
              <p className="text-[13px] text-zinc-500 font-medium">Common words & phrases</p>
            </div>
            <ChevronRight className="text-zinc-600 w-5 h-5 shrink-0" />
          </button>
        </div>
      )}

      {(viewMode === 'grid' || search) && (
        <div className="flex flex-col h-full px-5">
          <div className="flex items-center gap-3 mb-5 mt-2">
            <button onClick={() => { setViewMode('categories'); setSearch(''); }} className="w-10 h-10 bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-800 hover:text-zinc-200 transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-bold text-indigo-400">
              {search ? 'Search Results' : filter === 'basic' ? 'Basic Katakana' : filter === 'dakuten' ? 'Dakuten' : filter === 'handakuten' ? 'Handakuten' : 'Vocabulary'}
            </span>
          </div>

          <div className={isWordMode ? "flex flex-col gap-3 pb-8" : "grid grid-cols-4 sm:grid-cols-5 gap-3 pb-8 content-start"}>
            {displayedItems.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 mt-10">No items found.</div>
            )}
            {displayedItems.map(item => {
              const known = progress[item.id]?.box > 0;
              if (isWordMode) {
                return (
                  <div key={item.id} onClick={() => openModal(item)} className={`relative bg-zinc-900 rounded-3xl p-4 flex justify-between items-center ${known ? 'ring-1 ring-indigo-500/40' : ''} active:scale-[0.98] transition cursor-pointer shadow-sm`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-indigo-400 font-bold text-xl">
                        {item.c.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-zinc-100">{item.c}</span>
                          <span className="text-xs text-zinc-500 font-mono">{item.r}</span>
                        </div>
                        <div className="text-sm text-zinc-400 font-medium">
                          {item.m || item.r} {lang === 'ne' && item.n && <span className="text-zinc-500 text-xs ml-1">({item.n})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); speak(item.c); }} className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-indigo-400 hover:bg-zinc-700 transition-colors active:scale-90">
                        <Volume2 className="w-5 h-5" />
                      </button>
                      {known && <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={item.id} onClick={() => openModal(item)} className={`relative bg-zinc-900 rounded-3xl p-3 flex flex-col items-center justify-center ${known ? 'ring-1 ring-indigo-500/40' : ''} active:scale-95 transition cursor-pointer shadow-sm aspect-square`}>
                    <span className="text-[32px] font-bold text-zinc-100 text-center leading-tight mb-1">{item.c}</span>
                    <span className="text-[11px] text-zinc-500 font-mono font-bold truncate w-full text-center">{item.r}</span>
                    {known && <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.5)]"></div>}
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-5" onClick={() => setSelectedItem(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#18181b] w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-5">
                <h3 className={`${selectedItem.c.length > 5 ? 'text-4xl' : 'text-6xl'} font-black text-zinc-100 leading-none`}>{selectedItem.c}</h3>
                <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 transition-colors active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xl text-indigo-400 font-mono font-bold mb-4">{selectedItem.r}</p>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-zinc-100 font-bold text-xl">{selectedItem.m || selectedItem.r.toUpperCase()}</p>
                <button onClick={() => speak(selectedItem.c)} className="text-blue-400 p-2 bg-blue-500/10 rounded-full active:scale-90 transition-transform"><Volume2 className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-zinc-500 font-medium mb-6">{lang === 'ne' ? selectedItem.n : (selectedItem.m ? '' : 'Katakana Letter')}</p>
              
              <button 
                onClick={() => setShowDrawing(!showDrawing)} 
                className="w-full py-3 bg-zinc-800 rounded-2xl text-sm font-bold text-zinc-300 mb-4 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <PenTool className="w-4 h-4" /> Practice Writing
              </button>
              
              {showDrawing && <DrawingCanvas />}

              <button onClick={() => markAsKnown(selectedItem)} className="w-full py-4 bg-indigo-500 text-white rounded-full font-bold text-base transition-colors flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-indigo-500/20">
                <Check className="w-5 h-5" /> Mark to Review
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
