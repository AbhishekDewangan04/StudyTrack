import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { calendarAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CalendarView = ({ tasks = [], onViewTask, onOpenCreateModal, onOpenProModal }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Month');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [syncing, setSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);

  // Month metadata
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Days count & first day index
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayIndex = new Date(year, monthIndex, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.getDate());
  };

  // Google Calendar Integration Handlers
  const handleSyncTasks = async () => {
    if (!user?.isPro) {
      if (onOpenProModal) onOpenProModal();
      return;
    }
    setSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await calendarAPI.syncAllTasks();
      setSyncStatusMsg(`Successfully synced ${res.syncedCount || 0} tasks with Google Calendar.`);
    } catch (err) {
      console.error('Calendar sync error:', err);
      setSyncStatusMsg(err.message || 'Failed to sync tasks with Google Calendar.');
    } finally {
      setSyncing(false);
    }
  };

  const getTasksForDay = (dayNum) => {
    return tasks.filter((t) => {
      const d = new Date(t.deadline);
      return d.getDate() === dayNum && d.getMonth() === monthIndex && d.getFullYear() === year;
    });
  };

  const selectedDayTasks = getTasksForDay(selectedDay);

  const getChipStyle = (task) => {
    if (task.status === 'Completed') {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    const isOverdue = task.status === 'Pending' && new Date(task.deadline) < new Date();
    if (isOverdue) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    return 'bg-[#9B6BFF]/20 text-[#C4A7FF] border-[#9B6BFF]/30';
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 bg-[#111522] hover:bg-[#111522]/80 border border-[#191B2B] rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#111522] transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#111522] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight font-display">
              {monthName} {year}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <button
              onClick={handleSyncTasks}
              disabled={syncing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#9B6BFF]/20 hover:bg-[#9B6BFF]/30 text-[#C4A7FF] border border-[#9B6BFF]/30 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Google Calendar Sync</span>
            </button>

            <div className="bg-[#111522] p-1 rounded-xl flex items-center space-x-1 border border-[#191B2B] text-xs font-semibold">
              {['Month', 'Week', 'Day'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    viewMode === m
                      ? 'bg-[#9B6BFF] text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="inline-flex items-center space-x-1.5 gradient-btn-purple text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {syncStatusMsg && (
          <div className="mb-4 p-3 bg-[#9B6BFF]/10 border border-[#9B6BFF]/30 rounded-xl text-xs font-semibold text-[#C4A7FF] flex items-center justify-between">
            <span>{syncStatusMsg}</span>
            <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-white">×</button>
          </div>
        )}

        {/* Main Grid + Day Schedule Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Month Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (firstDayIndex + 6) % 7 }).map((_, i) => (
                <div key={`blank-${i}`} className="h-20 bg-[#111522]/40 rounded-xl border border-[#111522]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayTasks = getTasksForDay(dayNum);
                const isSelected = selectedDay === dayNum;

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`h-20 p-1.5 rounded-xl border transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#9B6BFF] bg-[#9B6BFF]/10 ring-1 ring-[#9B6BFF]'
                        : 'border-[#111522] hover:border-[#9B6BFF]/30 bg-[#111522]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-[#9B6BFF] text-white' : 'text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={t._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewTask) onViewTask(t);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border truncate ${getChipStyle(
                            t
                          )}`}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Day Schedule Side Section */}
          <div className="bg-[#111522] border border-[#191B2B] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white tracking-tight border-b border-[#191B2B] pb-3 mb-4 font-display">
                {monthName.slice(0, 3)} {selectedDay}, {year}
              </h3>

              {selectedDayTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => onViewTask && onViewTask(task)}
                      className="p-3 bg-[#191B2B] border border-[#191B2B] rounded-xl space-y-1 hover:border-[#9B6BFF]/40 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#C4A7FF] bg-[#9B6BFF]/20 px-2 py-0.5 rounded-full border border-[#9B6BFF]/30">
                          {task.subject || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-white truncate">
                        {task.title}
                      </p>

                      {task.locationName && (
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pt-1">
                          <MapPin className="w-3 h-3 text-[#9B6BFF]" />
                          <span>{task.locationName}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-1">
                  <CalendarIcon className="w-6 h-6 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-white">No tasks scheduled</p>
                  <p className="text-[11px] text-slate-400 font-medium">No active assignments set for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
