import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, BookOpen } from 'lucide-react';
import { TIME_DATA } from '../data';
import { speak } from '../utils/tts';
import { playCorrect, playIncorrect, playClick } from '../utils/audio';

export default function TimeView() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState<'quiz' | 'type'>('quiz');
  const [question, setQuestion] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [typeInput, setTypeInput] = useState('');
  const [flashOpt, setFlashOpt] = useState<{opt: string, isCorrect: boolean} | null>(null);
  const [scriptFormat, setScriptFormatState] = useState<'random' | 'romaji' | 'hiragana' | 'kanji'>(() => {
    return (localStorage.getItem('time_script_fmt') as any) || 'random';
  });
  const scriptFormatRef = useRef(scriptFormat);
  const setScriptFormat = (fmt: 'random' | 'romaji' | 'hiragana' | 'kanji') => {
    setScriptFormatState(fmt);
    scriptFormatRef.current = fmt;
    localStorage.setItem('time_script_fmt', fmt);
  };

  useEffect(() => {
    setXp(parseInt(localStorage.getItem('tm_xp') || '0'));
    setLevel(parseInt(localStorage.getItem('tm_level') || '1'));
    generateQuestion();
  }, []);

  const saveStats = (newXp: number, newLevel: number) => {
    localStorage.setItem('tm_xp', newXp.toString());
    localStorage.setItem('tm_level', newLevel.toString());
    setXp(newXp);
    setLevel(newLevel);
  };

  const getMinStr = (m: number) => {
    if (m === 0) return { r: "", h: "", k: "" };
    if (TIME_DATA.mins[m as keyof typeof TIME_DATA.mins]) return TIME_DATA.mins[m as keyof typeof TIME_DATA.mins];
    const t = Math.floor(m / 10), o = m % 10;
    let tR = "", tH = "", tK = "";
    if (t === 1) { tR = "juu"; tH = "じゅう"; tK = "十"; }
    else if (t === 2) { tR = "nijuu"; tH = "にじゅう"; tK = "二十"; }
    else if (t === 3) { tR = "sanjuu"; tH = "さんじゅう"; tK = "三十"; }
    else if (t === 4) { tR = "yonjuu"; tH = "よんじゅう"; tK = "四十"; }
    else if (t === 5) { tR = "gojuu"; tH = "ごじゅう"; tK = "五十"; }
    const oD = TIME_DATA.mins[o as keyof typeof TIME_DATA.mins];
    return { r: tR + oD.r, h: tH + oD.h, k: tK + oD.k };
  };

  const generateQuestion = (fmt?: string) => {
    const h = Math.floor(Math.random() * 12) + 1;
    const m = Math.floor(Math.random() * 60);
    const isPm = Math.random() < 0.5;
    const perR = isPm ? "gogo" : "gozen";
    const perH = isPm ? "ごご" : "ごぜん";
    const perK = isPm ? "午後" : "午前";
    
    const hD = TIME_DATA.hours[h as keyof typeof TIME_DATA.hours];
    const mD = getMinStr(m);
    
    const cR = `${perR} ${hD.r} ${mD.r}`.trim();
    const cH = `${perH}${hD.h}${mD.h}`;
    const cK = `${perK}${hD.k}${mD.k}`;
    let alts = [];
    if (m === 30) alts.push(`${perR} ${hD.r} han`, `${perH}${hD.h}はん`, `${perK}${hD.k}半`);

    const qData = {
      display: `${h}:${m < 10 ? '0' + m : m} ${isPm ? 'PM' : 'AM'}`,
      correctR: cR, correctH: cH, correctK: cK,
      audio: cK,
      valids: [cR, cH, cK, ...alts]
    };
    setQuestion(qData);
    setTypeInput('');
    setFlashOpt(null);

    let formatType = 0;
    const currentFmt = fmt || scriptFormatRef.current;
    if (currentFmt === 'random') formatType = Math.floor(Math.random() * 3);
    else if (currentFmt === 'romaji') formatType = 0;
    else if (currentFmt === 'hiragana') formatType = 1;
    else if (currentFmt === 'kanji') formatType = 2;

    let correctOpt = qData.correctR;
    if (formatType === 1) correctOpt = qData.correctH;
    else if (formatType === 2) correctOpt = qData.correctK;

    let opts = [correctOpt];

    while (opts.length < 4) {
      const rh = Math.floor(Math.random() * 12) + 1, rm = Math.floor(Math.random() * 60);
      const rper = Math.random() < 0.5 ? "gogo" : "gozen";
      const rperH = rper === "gogo" ? "ごご" : "ごぜん";
      const rperK = rper === "gogo" ? "午後" : "午前";
      const rhD = TIME_DATA.hours[rh as keyof typeof TIME_DATA.hours];
      const rmD = getMinStr(rm);
      
      let s = "";
      if (formatType === 0) s = `${rper} ${rhD.r} ${rmD.r}`.trim();
      else if (formatType === 1) s = `${rperH}${rhD.h}${rmD.h}`;
      else s = `${rperK}${rhD.k}${rmD.k}`;

      if (!opts.includes(s) && !qData.valids.includes(s)) opts.push(s);
    }
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (ans: string, isQuizOpt: boolean = false) => {
    if (flashOpt) return; 
    const norm = ans.trim().toLowerCase().replace(/\s+/g, ' ');
    const isC = question.valids.some((v: string) => v.toLowerCase().replace(/\s+/g, ' ') === norm);
    
    if (isQuizOpt) setFlashOpt({ opt: ans, isCorrect: isC });

    if (isC) {
      playCorrect();
      let newXp = xp + 20;
      let newLevel = level;
      if (newXp >= 100) { newXp -= 100; newLevel++; }
      saveStats(newXp, newLevel);
      speak(question.audio);
      addHistory(true, ans);
      setTimeout(generateQuestion, 1000);
    } else {
      playIncorrect();
      addHistory(false, ans);
      setTimeout(generateQuestion, 2000);
    }
  };

  const addHistory = (isC: boolean, ans: string) => {
    setHistory(prev => [{ display: question.display, isC, ans, correctR: question.correctR }, ...prev].slice(0, 10));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full max-w-md mx-auto px-5">
      <div className="bg-zinc-900 p-5 rounded-[28px] mb-6 shadow-sm">
        <div className="flex justify-between items-end mb-3 font-bold">
          <span className="text-indigo-400 text-[11px] tracking-widest uppercase">Level {level}</span>
          <span className="text-zinc-500 text-[11px] uppercase tracking-wider">{xp} / 100 XP</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full overflow-hidden h-2.5">
          <div className="h-full bg-indigo-500 transition-all duration-500 rounded-full" style={{ width: `${xp}%` }}></div>
        </div>
      </div>

      <div className="flex bg-zinc-900 p-1.5 rounded-[20px] mb-4 shadow-sm">
        <button onClick={() => { playClick(); setMode('quiz'); }} className={`flex-1 text-center py-2.5 rounded-2xl text-sm font-bold transition-all ${mode === 'quiz' ? 'text-zinc-100 bg-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Quiz Mode</button>
        <button onClick={() => { playClick(); setMode('type'); }} className={`flex-1 text-center py-2.5 rounded-2xl text-sm font-bold transition-all ${mode === 'type' ? 'text-zinc-100 bg-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Typing Mode</button>
      </div>

      {mode === 'quiz' && (
        <div className="flex bg-zinc-900 p-1.5 rounded-[20px] mb-8 shadow-sm">
          {(['random', 'romaji', 'hiragana', 'kanji'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => { playClick(); setScriptFormat(fmt); generateQuestion(fmt); }}
              className={`flex-1 text-center py-2 rounded-2xl text-[11px] font-bold transition-all capitalize ${scriptFormat === fmt ? 'text-zinc-100 bg-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {fmt}
            </button>
          ))}
        </div>
      )}

      {question && (
        <div className="text-center mb-10 relative px-4">
          <div className="text-[80px] font-black text-indigo-400 drop-shadow-sm tracking-tighter tabular-nums leading-none">{question.display}</div>
          <button onClick={() => speak(question.audio)} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-zinc-400 flex items-center justify-center hover:bg-zinc-800 hover:text-indigo-400 transition-colors active:scale-95">
            <Volume2 className="w-6 h-6" />
          </button>
          <div className="text-zinc-500 text-sm mt-4 font-medium">What time is this in Japanese?</div>
        </div>
      )}

      {mode === 'quiz' ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          {options.map(opt => {
            let btnClass = "bg-zinc-900 p-4.5 rounded-[24px] text-zinc-200 font-bold font-jp text-base shadow-sm active:scale-95 transition-all flex items-center justify-center text-center hover:bg-zinc-800";
            if (flashOpt?.opt === opt) {
              btnClass = flashOpt.isCorrect ? "bg-indigo-500 text-white p-4.5 rounded-[24px] font-bold font-jp text-base shadow-md shadow-indigo-500/20 flex items-center justify-center text-center" : "bg-pink-500 text-white p-4.5 rounded-[24px] font-bold font-jp text-base shadow-md shadow-pink-500/20 flex items-center justify-center text-center";
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt, true)} className={btnClass}>
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full">
          <input 
            type="text" 
            value={typeInput}
            onChange={e => setTypeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnswer(typeInput)}
            placeholder="e.g. gozen kuji, 午前九時" 
            autoComplete="off" 
            className="w-full p-5 text-center bg-zinc-900 rounded-[24px] text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50 mb-4 font-jp text-lg placeholder:text-zinc-600 shadow-sm transition-all"
          />
          <button onClick={() => handleAnswer(typeInput)} className="w-full py-4.5 bg-indigo-500 text-white font-bold rounded-full shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all text-lg">
            Submit Answer
          </button>
        </div>
      )}

      <div className="mt-10">
        <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Practice History</div>
        <div className="flex flex-col gap-3">
          {history.map((h, i) => (
            <div key={i} className={`rounded-[20px] p-4 flex items-center justify-between ${h.isC ? 'bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'bg-pink-500/10 ring-1 ring-pink-500/20'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-zinc-100">{h.display}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${h.isC ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'}`}>{h.isC ? 'Correct' : 'Incorrect'}</span>
                </div>
                <div className="text-sm text-zinc-400">You: <span className="text-zinc-200 font-jp">{h.ans}</span></div>
                {!h.isC && <div className="text-sm text-indigo-400 mt-0.5 font-jp font-medium">Ans: {h.correctR}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setShowRef(!showRef)} className="w-full mt-10 py-4 bg-zinc-900 text-zinc-400 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:text-zinc-200 hover:bg-zinc-800 transition-colors active:scale-95">
        <BookOpen className="w-4 h-4" /> Show Cheat Sheet
      </button>
      
      <AnimatePresence>
        {showRef && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
            <div className="text-indigo-400 font-bold mb-3 mt-4 text-xs uppercase tracking-wider">Hours (Ji)</div>
            <table className="w-full border-collapse bg-zinc-900 rounded-[24px] overflow-hidden text-sm shadow-sm">
              <tbody>
                <tr><td className="p-4 border-b border-zinc-800/50 text-zinc-300">4:00</td><td className="p-4 border-b border-zinc-800/50 text-zinc-300 font-jp">yoji</td><td className="p-4 border-b border-zinc-800/50 text-zinc-300 font-jp">四時</td></tr>
                <tr><td className="p-4 border-b border-zinc-800/50 text-zinc-300">7:00</td><td className="p-4 border-b border-zinc-800/50 text-zinc-300 font-jp">shichiji</td><td className="p-4 border-b border-zinc-800/50 text-zinc-300 font-jp">七時</td></tr>
                <tr><td className="p-4 text-zinc-300">9:00</td><td className="p-4 text-zinc-300 font-jp">kuji</td><td className="p-4 text-zinc-300 font-jp">九時</td></tr>
              </tbody>
            </table>
            <div className="text-indigo-400 font-bold mb-3 mt-6 text-xs uppercase tracking-wider">Minutes (Fun/Pun) - Irregulars</div>
            <table className="w-full border-collapse bg-zinc-900 rounded-[24px] overflow-hidden text-sm shadow-sm">
              <tbody>
                <tr><td className="p-4 border-b border-zinc-800/50 text-zinc-300">1, 6, 8, 10</td><td className="p-4 border-b border-zinc-800/50 text-zinc-300 font-jp">-pun (ippun, roppun...)</td><td className="p-4 border-b border-zinc-800/50 text-pink-400 font-bold font-jp">分</td></tr>
                <tr><td className="p-4 text-zinc-300">30</td><td className="p-4 text-zinc-300 font-jp">han (half)</td><td className="p-4 text-zinc-300 font-jp">半</td></tr>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
