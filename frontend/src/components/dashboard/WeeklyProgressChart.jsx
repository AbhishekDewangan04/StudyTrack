import { useState, useMemo } from 'react';
import { ChevronDown, BarChart2 } from 'lucide-react';

const WeeklyProgressChart = ({ tasks = [] }) => {
  const [selectedRange, setSelectedRange] = useState('This Week');

  // Days of week starting Monday
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Dynamically compute real created and completed task counts for each day of current week
  const dayStats = useMemo(() => {
    const now = new Date();
    // Get Monday of current week
    const currentDay = now.getDay();
    const distanceToMon = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    monday.setHours(0, 0, 0, 0);

    return days.map((dayLabel, idx) => {
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
        const d = t.updatedAt ? new Date(t.updatedAt) : t.deadline ? new Date(t.deadline) : null;
        if (!d || isNaN(d.getTime())) return false;
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === targetDay;
      }).length;

      return {
        day: dayLabel,
        created,
        completed,
      };
    });
  }, [tasks]);

  const maxVal = useMemo(() => {
    const maxInStats = Math.max(1, ...dayStats.map((d) => Math.max(d.created, d.completed)));
    return maxInStats;
  }, [dayStats]);

  const totalThisWeek = dayStats.reduce((sum, d) => sum + d.created + d.completed, 0);

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Weekly Progress
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Task activity for the current week
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          {/* Legend */}
          <div className="flex items-center space-x-3 text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Created</span>
            </span>
          </div>

          {/* Timeframe Dropdown */}
          <div className="relative">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              <span>{selectedRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="flex-1 flex flex-col justify-end pt-4">
        {totalThisWeek === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center space-y-1">
            <BarChart2 className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No task activity recorded for this week</p>
            <p className="text-[11px] text-slate-400 font-medium">Create or complete tasks to see your weekly progress bars here.</p>
          </div>
        ) : (
          <div className="relative h-44 flex items-end justify-between px-2 sm:px-6">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300">
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>{maxVal}</span>
              </div>
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>{Math.round(maxVal / 2)}</span>
              </div>
              <div className="border-b border-slate-100 w-full flex justify-between">
                <span>0</span>
              </div>
            </div>

            {/* Bars for Mon - Sun */}
            {dayStats.map((item, idx) => {
              const createdHeightPct = item.created > 0 ? Math.max((item.created / maxVal) * 100, 15) : 0;
              const completedHeightPct = item.completed > 0 ? Math.max((item.completed / maxVal) * 100, 15) : 0;

              return (
                <div key={idx} className="relative z-10 flex items-end space-x-1 sm:space-x-1.5 group">
                  {/* Created Bar */}
                  <div
                    style={{ height: `${createdHeightPct}%` }}
                    className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                      item.created > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-transparent'
                    }`}
                    title={`Created: ${item.created}`}
                  />
                  {/* Completed Bar */}
                  <div
                    style={{ height: `${completedHeightPct}%` }}
                    className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                      item.completed > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-transparent'
                    }`}
                    title={`Completed: ${item.completed}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* X Axis Labels */}
        <div className="flex justify-between px-2 sm:px-6 pt-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
          {days.map((day) => (
            <span key={day} className="text-center w-8">
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgressChart;
