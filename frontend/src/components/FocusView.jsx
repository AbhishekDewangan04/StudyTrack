import { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Clock } from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'studytrack_focus_sessions';
const STORAGE_KEY_PRESET = 'studytrack_focus_last_preset';

const FocusView = () => {
  // Load persisted session history from localStorage
  const [sessionHistory, setSessionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse focus sessions:', e);
      return [];
    }
  });

  // Load last selected preset duration (default 25 mins = 1500 secs)
  const [selectedPreset, setSelectedPreset] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRESET);
      const parsed = parseInt(saved, 10);
      return parsed && parsed > 0 ? parsed : 25 * 60;
    } catch {
      return 25 * 60;
    }
  });

  const [customMins, setCustomMins] = useState(10);
  const [customSecs, setCustomSecs] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Active timer state ALWAYS starts paused (false) and reset to starting preset on mount/navigation
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRESET);
      const parsed = parseInt(saved, 10);
      return parsed && parsed > 0 ? parsed : 25 * 60;
    } catch {
      return 25 * 60;
    }
  });

  // Save selected preset duration to localStorage when changed
  const handlePresetSelect = (durationSeconds) => {
    setIsCustomMode(false);
    setSelectedPreset(durationSeconds);
    setSecondsLeft(durationSeconds);
    setIsActive(false);
    try {
      localStorage.setItem(STORAGE_KEY_PRESET, String(durationSeconds));
    } catch (e) {
      console.error('Failed to save focus preset:', e);
    }
  };

  const handleApplyCustom = () => {
    const mins = Math.max(0, parseInt(customMins, 10) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(customSecs, 10) || 0));
    const totalSecs = mins * 60 + secs;
    if (totalSecs <= 0) return;

    setIsCustomMode(true);
    setSelectedPreset(totalSecs);
    setSecondsLeft(totalSecs);
    setIsActive(false);
    try {
      localStorage.setItem(STORAGE_KEY_PRESET, String(totalSecs));
    } catch (e) {
      console.error('Failed to save custom focus duration:', e);
    }
  };

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      // ONLY reaching 00:00 counts as a completed session!
      const newSession = {
        timestamp: new Date().toISOString(),
        durationSeconds: selectedPreset,
      };

      setSessionHistory((prev) => {
        const updated = [...prev, newSession];
        try {
          localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save focus session:', e);
        }
        return updated;
      });

      alert(`🎉 Focus Session Completed! You completed ${Math.floor(selectedPreset / 60)}m ${selectedPreset % 60}s of deep focus.`);
      setSecondsLeft(selectedPreset);
    }

    return () => clearInterval(interval);
  }, [isActive, secondsLeft, selectedPreset]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(selectedPreset);
  };

  // Session Statistics Derived Strictly from Persistence
  const lifetimeCompletedCount = sessionHistory.length;
  const currentSessionNumber = lifetimeCompletedCount + 1;

  const completedTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return sessionHistory.filter((s) => new Date(s.timestamp).toDateString() === todayStr).length;
  }, [sessionHistory]);

  const totalFocusSeconds = useMemo(() => {
    return sessionHistory.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  }, [sessionHistory]);

  const formatTotalTime = (totalSecs) => {
    if (totalSecs === 0) return '0 mins';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    let res = '';
    if (hrs > 0) res += `${hrs} hr${hrs > 1 ? 's' : ''} `;
    if (mins > 0 || hrs > 0) res += `${mins} min${mins !== 1 ? 's' : ''} `;
    if (secs > 0 && hrs === 0) res += `${secs} sec${secs !== 1 ? 's' : ''}`;
    return res.trim();
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Card */}
      <div className="bg-[#151827] border border-[#2B2F45] p-6 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-[#272044] border border-[#9B6BFF]/30 flex items-center justify-center text-[#9B6BFF] shadow-inner shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F1EEFF] tracking-tight font-display">
              Focus Mode
            </h1>
            <p className="text-xs text-[#A5AAC2] font-medium mt-0.5">
              Eliminate distractions and complete coursework in dedicated customizable focus sprints.
            </p>
          </div>
        </div>
      </div>

      {/* Main Focus Card */}
      <div className="max-w-xl mx-auto bg-[#151827] border border-[#2B2F45] p-8 sm:p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center space-y-7 text-center">
        {/* Session Counter Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#272044] text-[#9B6BFF] border border-[#9B6BFF]/30 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#9B6BFF]" />
          <span>Current Focus Session: #{currentSessionNumber}</span>
        </div>

        {/* Timer Display Circle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-[#2B2F45] bg-[#191C2D] flex flex-col items-center justify-center shadow-inner transition-all hover:border-[#9B6BFF]/40">
          <span className="text-5xl sm:text-6xl font-black text-[#F1EEFF] tracking-tight font-mono">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs font-bold text-[#A5AAC2] mt-2 tracking-wide uppercase">
            {isActive ? 'Deep Work In Progress' : 'Ready to start'}
          </span>
        </div>

        {/* Presets & Custom Duration Controls */}
        <div className="space-y-3.5 w-full max-w-md">
          <p className="text-xs font-bold text-[#A5AAC2] uppercase tracking-wider">Select Duration Preset</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            {[
              { label: '15m', secs: 15 * 60 },
              { label: '25m', secs: 25 * 60 },
              { label: '30m', secs: 30 * 60 },
              { label: '45m', secs: 45 * 60 },
              { label: '60m', secs: 60 * 60 },
            ].map((p) => (
              <button
                key={p.label}
                disabled={isActive}
                onClick={() => handlePresetSelect(p.secs)}
                className={`px-4 py-2 rounded-xl border transition cursor-pointer font-bold ${
                  !isCustomMode && selectedPreset === p.secs
                    ? 'bg-[#272044] text-[#F1EEFF] border-[#9B6BFF] shadow-md shadow-[#9B6BFF]/20'
                    : 'bg-[#1B1E30] hover:bg-[#272044]/60 text-[#A5AAC2] hover:text-[#F1EEFF] border-[#2B2F45] hover:border-[#9B6BFF]/30'
                } disabled:opacity-50`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Duration Inputs */}
          <div className="pt-2 flex items-center justify-center space-x-2 text-xs">
            <span className="font-semibold text-[#A5AAC2]">Custom:</span>
            <input
              type="number"
              min="0"
              max="180"
              placeholder="Min"
              disabled={isActive}
              value={customMins}
              onChange={(e) => setCustomMins(e.target.value)}
              className="w-16 px-2.5 py-1.5 bg-[#191C2D] border border-[#2B2F45] focus:border-[#9B6BFF] rounded-xl text-center font-bold text-[#F1EEFF] placeholder-[#A5AAC2] focus:outline-none transition"
            />
            <span className="font-bold text-[#A5AAC2]">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Sec"
              disabled={isActive}
              value={customSecs}
              onChange={(e) => setCustomSecs(e.target.value)}
              className="w-16 px-2.5 py-1.5 bg-[#191C2D] border border-[#2B2F45] focus:border-[#9B6BFF] rounded-xl text-center font-bold text-[#F1EEFF] placeholder-[#A5AAC2] focus:outline-none transition"
            />
            <button
              disabled={isActive}
              onClick={handleApplyCustom}
              className="px-3.5 py-1.5 bg-[#272044] hover:bg-[#9B6BFF] text-[#F1EEFF] font-bold rounded-xl border border-[#2B2F45] hover:border-[#9B6BFF]/40 transition cursor-pointer disabled:opacity-50"
            >
              Set
            </button>
          </div>
        </div>

        {/* Action Controls (Play/Pause & Reset) */}
        <div className="flex items-center space-x-4 pt-2">
          <button
            onClick={toggleTimer}
            className={`px-8 py-3.5 rounded-2xl text-xs font-extrabold text-white shadow-xl transition flex items-center space-x-2.5 cursor-pointer ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                : 'gradient-btn-purple shadow-[#9B6BFF]/30'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isActive ? 'Pause Session' : 'Start Focus'}</span>
          </button>

          <button
            onClick={resetTimer}
            className="p-3.5 bg-[#272044] hover:bg-[#272044]/80 text-[#A5AAC2] hover:text-[#F1EEFF] rounded-2xl border border-[#2B2F45] hover:border-[#9B6BFF]/40 transition cursor-pointer shadow-sm"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Real Completed Sessions Stats */}
        <div className="pt-5 border-t border-[#2B2F45] w-full flex items-center justify-around text-xs">
          <div>
            <p className="text-[#A5AAC2] font-semibold">Completed Today</p>
            <p className="text-lg font-black text-[#F1EEFF] mt-0.5">{completedTodayCount} session{completedTodayCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="h-8 w-px bg-[#2B2F45]" />
          <div>
            <p className="text-[#A5AAC2] font-semibold">Total Focus Time</p>
            <p className="text-lg font-black text-[#F1EEFF] mt-0.5">{formatTotalTime(totalFocusSeconds)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusView;
