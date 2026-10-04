import { BookOpen } from 'lucide-react';

const SubjectWorkload = ({ tasks = [] }) => {
  const total = tasks.length;
  const subjectMap = {};

  tasks.forEach((t) => {
    const subj = t.subject?.trim() || 'General';
    if (!subjectMap[subj]) {
      subjectMap[subj] = 0;
    }
    subjectMap[subj] += 1;
  });

  const subjects = Object.keys(subjectMap)
    .map((name) => ({
      name,
      count: subjectMap[name],
      pct: total > 0 ? Math.round((subjectMap[name] / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Subject Workload Breakdown</span>
        </h3>
        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
          {subjects.length} Active Subjects
        </span>
      </div>

      {subjects.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No assignments recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 uppercase text-[11px]">{s.name}</span>
                <span className="text-slate-500 text-[11px]">{s.count} {s.count === 1 ? 'task' : 'tasks'} ({s.pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/80">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectWorkload;
