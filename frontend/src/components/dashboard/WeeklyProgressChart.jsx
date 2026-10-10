import { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, PlusCircle, BarChart2 } from 'lucide-react';

const WeeklyActivity = ({ tasks = [] }) => {
  const [selectedRange, setSelectedRange] = useState('This Week');

  const days = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
    { short: 'Sun', full: 'Sunday' },
  ];

  // Dynamically compute real created and completed task counts for each day of selected week
  const dayStats = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMon = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    monday.setHours(0, 0, 0, 0);

    if (selectedRange === 'Last Week') {
      monday.setDate(monday.getDate() - 7);
    }

    return days.map((dayObj, idx) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);

      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const targetDay = targetDate.getDate();

      const created = tasks.filter((t) => {
        const d = t.createdAt ? new Date(t.createdAt) : t.deadline ? new Date(t.deadline) : null;
        if (!d || isNaN(d.getTime())) return false;
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === targetDay;
      }).length;

      const completed = tasks.filter((t) => {
        if (t.status !== 'Completed') return false;
        const d = t.completedAt
          ? new Date(t.completedAt)
          : t.updatedAt
          ? new Date(t.updatedAt)
          : t.deadline
          ? new Date(t.deadline)
          : null;
        if (!d || isNaN(d.getTime())) return false;
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === targetDay;
      }).length;

      return {
        short: dayObj.short,
        full: dayObj.full,
        created,
        completed,
        isToday:
          new Date().getFullYear() === targetYear &&
          new Date().getMonth() === targetMonth &&
          new Date().getDate() === targetDay,
      };
    });
  }, [tasks, selectedRange]);

  const maxVal = useMemo(() => {
    let m = 1;
    dayStats.forEach((d) => {
      if (d.created > m) m = d.created;
      if (d.completed > m) m = d.completed;
    });
    return m;
  }, [dayStats]);

  return (
    <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#111522]">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
            <BarChart2 className="w-4.5 h-4.5 text-[#9B6BFF]" />
            <span>Weekly Progress</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Your assignment completions across the week
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Legend */}
          <div className="flex items-center space-x-3 text-slate-400 font-semibold text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9B6BFF]" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF69]" />
              <span>Created</span>
            </span>
          </div>

          {/* Timeframe selector */}
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-1.5 bg-[#111522] border border-[#191B2B] rounded-xl text-xs font-semibold text-slate-200 hover:border-[#9B6BFF]/40 transition cursor-pointer outline-none"
          >
            <option value="This Week">This Week</option>
            <option value="Last Week">Last Week</option>
          </select>
        </div>
      </div>

      {/* Visual Bar Chart (Section 4 matching style) */}
      <div className="pt-2 pb-2 grid grid-cols-7 gap-2 sm:gap-3 items-end h-44">
        {dayStats.map((item, idx) => {
          const compHeight = Math.max(12, Math.round((item.completed / maxVal) * 100));
          const createHeight = Math.max(12, Math.round((item.created / maxVal) * 100));
          return (
            <div key={idx} className="flex flex-col items-center space-y-2 h-full justify-end group">
              <div className="w-full flex items-end justify-center space-x-1 h-32 px-1 bg-[#111522] rounded-xl p-1.5 relative overflow-hidden">
                {/* Completed bar */}
                <div
                  style={{ height: `${item.completed > 0 ? compHeight : 8}%` }}
                  className={`w-1/2 rounded-md transition-all duration-300 ${
                    item.completed > 0
                      ? 'bg-gradient-to-t from-[#9B6BFF] to-[#C4A7FF] shadow-sm shadow-[#9B6BFF]/30'
                      : 'bg-slate-800/40'
                  }`}
                  title={`${item.full}: ${item.completed} completed`}
                />
                {/* Created bar */}
                <div
                  style={{ height: `${item.created > 0 ? createHeight : 8}%` }}
                  className={`w-1/2 rounded-md transition-all duration-300 ${
                    item.created > 0
                      ? 'bg-gradient-to-t from-[#FFBF69] to-[#ffe3b3] shadow-sm shadow-[#FFBF69]/30'
                      : 'bg-slate-800/40'
                  }`}
                  title={`${item.full}: ${item.created} created`}
                />
              </div>
              <span className={`text-[11px] font-bold ${item.isToday ? 'text-[#9B6BFF]' : 'text-slate-400'}`}>
                {item.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyActivity;
