import { BookOpen, Calendar, ChevronRight, FileText, Code, Clock } from 'lucide-react';

const UpcomingTasks = ({ tasks = [], onViewTask, onSelectTab }) => {
  // Filter upcoming pending tasks strictly from real tasks
  const pendingTasks = tasks
    .filter((t) => t.status === 'Pending')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const items = pendingTasks.map((t, idx) => {
    const d = new Date(t.deadline);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    const deadlineBadge = isToday
      ? 'Today'
      : isTomorrow
      ? 'Tomorrow'
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return {
      ...t,
      deadlineBadge,
      isUrgent: isToday || isTomorrow || d < now,
      icon: idx === 0 ? Code : idx === 1 ? FileText : BookOpen,
      iconBg: isToday || d < now
        ? 'bg-rose-50 text-rose-600 border border-rose-100'
        : isTomorrow
        ? 'bg-amber-50 text-amber-600 border border-amber-100'
        : 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    };
  });

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Upcoming Deadlines
        </h3>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('tasks')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List or Truthful Empty State */}
      <div className="space-y-3.5 flex-1">
        {items.length > 0 ? (
          items.map((item) => {
            const Icon = item.icon || BookOpen;
            return (
              <div
                key={item._id}
                onClick={() => onViewTask && onViewTask(item)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className={`p-2.5 rounded-xl ${item.iconBg} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {item.subject || 'General'}
                    </p>
                  </div>
                </div>

                {/* Deadline Badge */}
                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      item.isUrgent
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Calendar className="w-3 h-3 mr-1 opacity-70" />
                    {item.deadlineBadge}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 text-center space-y-1">
            <Clock className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No upcoming deadlines</p>
            <p className="text-[11px] text-slate-400 font-medium">All active assignments are complete or no tasks have been created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingTasks;
