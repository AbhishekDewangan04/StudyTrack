import { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, PlusCircle } from 'lucide-react';

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
    // Get Monday of current week
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

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-indigo-600" />
            <span>Weekly Activity</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Your task activity for the current week.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Legend */}
          <div className="flex items-center space-x-3 text-slate-500 font-semibold text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Created</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </span>
          </div>

          {/* Timeframe Dropdown */}
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer outline-none"
          >
            <option value="This Week">This Week</option>
            <option value="Last Week">Last Week</option>
          </select>
        </div>
      </div>

      {/* Days Activity List */}
      <div className="space-y-2 flex-1 justify-center flex flex-col">
        {dayStats.map((item, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${
              item.isToday
                ? 'bg-indigo-50/60 border-indigo-200 shadow-2xs'
                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/60'
            }`}
          >
            <div className="flex items-center space-x-2 shrink-0">
              <span className={`font-bold min-w-[70px] ${item.isToday ? 'text-indigo-900' : 'text-slate-800'}`}>
                {item.full}
              </span>
              {item.isToday && (
                <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-md">
                  Today
                </span>
              )}
            </div>

            {/* Created & Completed Stats Pills */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100/80 text-indigo-700 font-bold rounded-lg text-xs">
                <PlusCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{item.created} Created</span>
              </div>

              <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100/80 text-emerald-700 font-bold rounded-lg text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{item.completed} Completed</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyActivity;
