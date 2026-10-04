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
  const [viewMode, setViewMode] = useState('Month'); // 'Month', 'Week', 'Day'
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [syncing, setSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);

  // Month metadata
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate days in month
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

  // Google Calendar Integration Handlers (PRO Feature)
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

  // Map task deadlines into date map
  const getTasksForDay = (dayNum) => {
    return tasks.filter((t) => {
      const d = new Date(t.deadline);
      return d.getDate() === dayNum && d.getMonth() === monthIndex && d.getFullYear() === year;
    });
  };

  const selectedDayTasks = getTasksForDay(selectedDay);

  const getChipStyle = (task) => {
    if (task.status === 'Completed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    const isOverdue = task.status === 'Pending' && new Date(task.deadline) < new Date();
    if (isOverdue) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="space-y-6">
      {/* Calendar View Container */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Month Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {monthName} {year}
            </h2>
          </div>

          {/* Right Controls: View Toggle, Add Task, Google Calendar */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Google Sync Status */}
            <button
              onClick={handleSyncTasks}
              disabled={syncing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Google Sync</span>
            </button>

            {/* View Mode Pills */}
            <div className="bg-slate-100/80 p-1 rounded-xl flex items-center space-x-1 border border-slate-200 text-xs font-semibold">
              {['Month', 'Week', 'Day'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    viewMode === m
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* + Add Task Button */}
            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="inline-flex items-center space-x-1.5 bg-[#4F46E5] hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {syncStatusMsg && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-800 flex items-center justify-between">
            <span>{syncStatusMsg}</span>
            <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {/* Main Grid + Day Schedule Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Month Calendar Grid (3 Columns on LG) */}
          <div className="lg:col-span-3">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Cells Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Offset blank cells */}
              {Array.from({ length: (firstDayIndex + 6) % 7 }).map((_, i) => (
                <div key={`blank-${i}`} className="h-20 bg-slate-50/30 rounded-xl border border-slate-100/50" />
              ))}

              {/* Month Day Cells */}
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
                        ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500'
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {/* Event Task Chips */}
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
          <div className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight border-b border-slate-200 pb-3 mb-4">
                {monthName.slice(0, 3)} {selectedDay}, {year}
              </h3>

              {selectedDayTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => onViewTask && onViewTask(task)}
                      className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs hover:shadow-card transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {task.subject || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 truncate">
                        {task.title}
                      </p>

                      {task.locationName && (
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 pt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{task.locationName}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-1">
                  <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No tasks scheduled</p>
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
