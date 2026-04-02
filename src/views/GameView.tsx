import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Heart, Trophy, X, Play } from 'lucide-react';
import { RAW_DATA } from '../data';
import { playCorrect, playIncorrect, playClick } from '../utils/audio';

type GameState = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

type FallingItem = {
  id: string;
  text: string;
  answer: string;
  x: number;
  y: number;
  speed: number;
};

export default function GameView() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = [...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten];

  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem('kn_game_highscore') || '0', 10));
  }, []);

  const startGame = () => {
    playClick();
    setScore(0);
    setLives(3);
    setFallingItems([]);
    setInput('');
    setGameState('playing');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setFallingItems(items => {
        let missedCount = 0;
        const newItems = items.map(item => {
          const newY = item.y + item.speed;
          if (newY > 100 && item.y <= 100) {
            missedCount++;
          }
          return { ...item, y: newY };
        });

        if (missedCount > 0) {
          playIncorrect();
          setLives(l => {
            const newLives = Math.max(0, l - missedCount);
            if (newLives === 0) setGameState('gameover');
            return newLives;
          });
        }

        return newItems.filter(item => item.y <= 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState]);

  // Spawner
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnRate = difficulty === 'easy' ? 2000 : difficulty === 'medium' ? 1200 : 800;
    
    const spawnItem = () => {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      const newItem: FallingItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: randomItem.c,
        answer: randomItem.r.toLowerCase(),
        x: Math.random() * 80 + 10, // 10% to 90%
        y: -10,
        speed: difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.7 : 1.2
      };
      setFallingItems(prev => [...prev, newItem]);
    };

    const interval = setInterval(spawnItem, spawnRate);
    return () => clearInterval(interval);
  }, [gameState, difficulty]);

  // Handle Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('kn_game_highscore', score.toString());
      }
    }
  }, [gameState, score, highScore]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setInput(val);

    setFallingItems(items => {
      const hitIndex = items.findIndex(item => item.answer === val);
      if (hitIndex !== -1) {
        playCorrect();
        setScore(s => s + 10);
        setInput('');
        return items.filter((_, i) => i !== hitIndex);
      }
      return items;
    });
  };

  if (gameState === 'menu') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center gap-6 max-w-sm mx-auto px-4 pb-4">
        <div className="text-center mb-4">
          <div className="w-24 h-24 bg-[#1A1D24] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-50"></div>
            <Rocket className="w-12 h-12 text-cyan-400 relative z-10" />
          </div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Kana Drop</h2>
          <p className="text-sm text-zinc-500 mt-2">Type the romaji before they hit the ground!</p>
        </div>
        
        <div className="bg-[#1A1D24] p-5 rounded-[28px] shadow-sm mb-3">
          <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4 text-center">Select Difficulty</label>
          <div className="flex gap-3">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button 
                key={d} 
                onClick={() => { playClick(); setDifficulty(d); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize active:scale-95 ${difficulty === d ? 'bg-cyan-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38] hover:text-zinc-200'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full font-bold font-mono inline-flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4" /> High Score: {highScore}
          </div>
        </div>

        <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-full shadow-md shadow-cyan-500/20 text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Start Game <Play className="w-5 h-5" fill="currentColor" />
        </button>
      </motion.div>
    );
  }

  if (gameState === 'gameover') {
    const isNewRecord = score > 0 && score >= highScore;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-4 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-[#1A1D24] rounded-full flex items-center justify-center mb-6 shadow-sm">
          <X className="w-12 h-12 text-purple-500" />
        </div>
        <h2 className="text-3xl font-black text-zinc-100 mb-2">Game Over!</h2>
        <p className="text-zinc-500 text-sm mb-8">The kana dropped too fast.</p>
        
        <div className="bg-[#1A1D24] p-6 rounded-[28px] w-full max-w-[300px] mb-10 shadow-sm relative overflow-hidden">
          {isNewRecord && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Final Score</p>
            <p className="text-5xl font-black text-cyan-400">{score}</p>
          </div>
          {isNewRecord && <p className="text-xs font-bold text-amber-500 mt-5 flex items-center justify-center gap-1.5 bg-amber-500/10 py-2 rounded-xl"><Trophy className="w-4 h-4" /> New High Score!</p>}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[300px]">
          <button onClick={startGame} className="w-full py-4 bg-cyan-500 text-white rounded-full font-bold text-base hover:bg-cyan-400 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-cyan-500/20">
            Play Again
          </button>
          <button onClick={() => setGameState('menu')} className="w-full py-4 bg-[#222630] text-zinc-100 rounded-full font-bold text-base hover:bg-[#2A2E38] flex items-center justify-center gap-2 active:scale-95 transition-all">
            Back to Menu
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#11131A] flex flex-col" onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-[#11131A] to-transparent">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-purple-500 fill-purple-500' : 'text-[#222630]'}`} />
          ))}
        </div>
        <div className="text-xl font-black text-cyan-400 font-mono">{score}</div>
      </div>

      {/* Falling Items */}
      <div className="flex-1 relative w-full">
        <AnimatePresence>
          {fallingItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute text-4xl font-black text-zinc-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] font-jp"
              style={{ 
                left: `${item.x}%`, 
                top: `${item.y}%`, 
                transform: 'translate(-50%, -50%)' 
              }}
            >
              {item.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full bg-[#1A1D24]/90 backdrop-blur-md border border-white/10 rounded-full py-3 px-5 text-center text-xl font-bold text-zinc-100 focus:border-cyan-500 focus:outline-none shadow-xl transition-colors"
          placeholder="Type here..."
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
