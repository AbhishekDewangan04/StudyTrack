import { useMemo } from 'react';
import { PieChart } from 'lucide-react';

const SubjectDistribution = ({ tasks = [] }) => {
  const { total, subjects } = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const subj = t.subject?.trim() || 'General';
      counts[subj] = (counts[subj] || 0) + 1;
    });

    const palette = ['#9B6BFF', '#FFBF69', '#38BDF8', '#34D399', '#F472B6', '#A78BFA', '#FBBF24'];
    const totalCount = tasks.length;

    const list = Object.keys(counts).map((key, idx) => ({
      name: key,
      count: counts[key],
      color: palette[idx % palette.length],
      percentage: totalCount > 0 ? Math.round((counts[key] / totalCount) * 100) : 0,
    }));

    return { total: totalCount, subjects: list };
  }, [tasks]);

  return (
    <div className="bg-[#191B2B] border border-[#191B2B] p-5 rounded-2xl shadow-xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 font-display">
          <PieChart className="w-4 h-4 text-[#9B6BFF]" />
          <span>Subject Distribution</span>
        </h3>
        <span className="text-[11px] font-bold text-slate-400">{total} Tasks Total</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* SVG Donut Chart with Center Total Count */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[#111522]"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {subjects.length > 0 ? (
              subjects.reduce(
                (acc, item) => {
                  const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                  const strokeDashoffset = acc.offset;
                  acc.elements.push(
                    <path
                      key={item.name}
                      strokeWidth="4"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={-strokeDashoffset}
                      stroke={item.color}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      className="transition-all duration-500"
                    />
                  );
                  acc.offset += item.percentage;
                  return acc;
                },
                { offset: 0, elements: [] }
              ).elements
            ) : (
              <path
                strokeWidth="4"
                strokeDasharray="100 0"
                stroke="#9B6BFF"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            )}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-white font-display">{total}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 w-full max-h-36 overflow-y-auto pr-1">
          {subjects.length > 0 ? (
            subjects.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300 font-semibold truncate">{s.name}</span>
                </div>
                <span className="text-white font-bold">{s.count}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-4">No task subjects logged</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDistribution;
