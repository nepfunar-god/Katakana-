/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Layers, Gamepad2, Clock, Settings, Flame, CalendarDays, Rocket } from 'lucide-react';
import LearnView from './views/LearnView';
import PracticeView from './views/PracticeView';
import QuizView from './views/QuizView';
import GameView from './views/GameView';
import TimeView from './views/TimeView';
import DateView from './views/DateView';
import SettingsView from './views/SettingsView';
import OnboardingView from './views/OnboardingView';
import SplashView from './views/SplashView';
import { playClick } from './utils/audio';

export type ViewState = 'splash' | 'onboarding' | 'learn' | 'practice' | 'quiz' | 'game' | 'time' | 'date' | 'settings';

export default function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [streak, setStreak] = useState(0);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const onboarded = localStorage.getItem('kn_onboarded');
      if (!onboarded) {
        setView('onboarding');
      } else {
        setIsOnboarded(true);
        setView('learn');
      }
    }, 2000);

    const savedStreak = localStorage.getItem('kn_streak');
    if (savedStreak) setStreak(parseInt(savedStreak, 10));

    return () => clearTimeout(timer);
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('kn_onboarded', 'true');
    setIsOnboarded(true);
    setView('learn');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0f0f11] text-zinc-200 font-sans overflow-hidden selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        {view === 'splash' && <SplashView key="splash" />}
      </AnimatePresence>

      {view !== 'splash' && view !== 'onboarding' && (
        <header className="flex-none h-[72px] bg-[#0f0f11]/90 backdrop-blur-xl z-50 flex items-center justify-between px-5 pt-2">
          <div className="flex flex-col justify-center">
            <h1 className="text-[24px] font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 tracking-tight">
              Katakana Night
            </h1>
            <span className="text-[11px] text-zinc-500 font-medium font-jp">カタカナをマスター</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-white/5 shadow-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-zinc-100">{streak}</span>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto relative scroll-smooth pt-2 pb-32">
        <AnimatePresence mode="wait">
          {view === 'onboarding' && <OnboardingView key="onboarding" onFinish={handleFinishOnboarding} />}
          {view === 'learn' && <LearnView key="learn" />}
          {view === 'practice' && <PracticeView key="practice" />}
          {view === 'quiz' && <QuizView key="quiz" setStreak={setStreak} />}
          {view === 'game' && <GameView key="game" />}
          {view === 'time' && <TimeView key="time" />}
          {view === 'date' && <DateView key="date" />}
          {view === 'settings' && <SettingsView key="settings" />}
        </AnimatePresence>
      </main>

      {view !== 'splash' && view !== 'onboarding' && (
        <nav className="absolute bottom-0 w-full flex-none h-[88px] bg-[#18181b]/95 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center px-2 pb-6 pt-3 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-x-auto scrollbar-hide gap-1">
          <NavItem icon={<Book />} label="Learn" active={view === 'learn'} onClick={() => setView('learn')} />
          <NavItem icon={<Layers />} label="Practice" active={view === 'practice'} onClick={() => setView('practice')} />
          <NavItem icon={<Gamepad2 />} label="Quiz" active={view === 'quiz'} onClick={() => setView('quiz')} />
          <NavItem icon={<Rocket />} label="Game" active={view === 'game'} onClick={() => setView('game')} />
          <NavItem icon={<Clock />} label="Time" active={view === 'time'} onClick={() => setView('time')} />
          <NavItem icon={<CalendarDays />} label="Date" active={view === 'date'} onClick={() => setView('date')} />
          <NavItem icon={<Settings />} label="Set" active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        playClick();
        onClick();
      }}
      className="flex flex-col items-center justify-center min-w-[52px] flex-1 relative group active:scale-95 transition-transform"
    >
      <div className={`flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${active ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300'} mb-1 [&>svg]:w-5 [&>svg]:h-5`}>
        {icon}
      </div>
      <span className={`text-[11px] font-medium tracking-wide transition-colors ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>{label}</span>
    </button>
  );
}
