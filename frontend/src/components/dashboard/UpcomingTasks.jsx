import { BookOpen, Calendar, ChevronRight, FileText, Code, Clock } from 'lucide-react';

const UpcomingTasks = ({ tasks = [], onViewTask, onSelectTab }) => {
  // Filter upcoming pending tasks strictly from real tasks
  const pendingTasks = tasks
    .filter((t) => t.status === 'Pending')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

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
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        : isTomorrow
        ? 'bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/30'
        : 'bg-[#9B6BFF]/20 text-[#C4A7FF] border border-[#9B6BFF]/30',
    };
  });

  return (
    <div className="bg-[#191B2B] border border-[#191B2B] p-5 rounded-2xl shadow-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-tight font-display">
          Upcoming Deadlines
        </h3>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('tasks')}
            className="text-xs font-bold text-[#C4A7FF] hover:text-white flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List or Truthful Empty State */}
      <div className="space-y-2.5 flex-1">
        {items.length > 0 ? (
          items.map((item) => {
            const Icon = item.icon || BookOpen;
            return (
              <div
                key={item._id}
                onClick={() => onViewTask && onViewTask(item)}
                className="flex items-center justify-between p-3 rounded-xl border border-[#111522] bg-[#111522] hover:border-[#9B6BFF]/30 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className={`p-2 rounded-xl ${item.iconBg} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
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
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isUrgent
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
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
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#111522] rounded-xl bg-[#111522] p-4 text-center space-y-1">
            <Clock className="w-6 h-6 text-slate-500" />
            <p className="text-xs font-bold text-white">No upcoming deadlines</p>
            <p className="text-[11px] text-slate-400 font-medium">All active assignments are complete or no tasks have been created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingTasks;
