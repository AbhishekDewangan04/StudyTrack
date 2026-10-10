import { Bell, AlertTriangle, Clock, CheckCircle2, Calendar, Eye } from 'lucide-react';
import Button from './ui/Button';

const NotificationsView = ({ tasks = [], onViewTask, onToggleStatus }) => {
  const now = new Date();

  // Categorize real tasks
  const overdueTasks = tasks.filter(
    (t) => t.status === 'Pending' && new Date(t.deadline) < now
  );

  const dueSoonTasks = tasks.filter((t) => {
    if (t.status !== 'Pending') return false;
    const d = new Date(t.deadline);
    const diffHours = (d - now) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 72; // Due within next 72 hours
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header Card */}
      <div className="bg-[#151827] border border-[#2B2F45] p-6 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-[#272044] border border-[#9B6BFF]/30 flex items-center justify-center text-[#9B6BFF] shadow-inner shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F1EEFF] tracking-tight font-display">
              Notification Center
            </h1>
            <p className="text-xs text-[#A5AAC2] font-medium mt-0.5">
              Automated warnings for overdue deadlines, upcoming assignment due dates, and study alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Alerts Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase text-rose-400 tracking-wider flex items-center space-x-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>High Priority: Overdue Assignments ({overdueTasks.length})</span>
        </h2>

        {overdueTasks.length === 0 ? (
          <div className="bg-[#151827] border border-[#2B2F45] p-4 rounded-2xl text-xs text-[#A5AAC2] flex items-center gap-2.5 shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No overdue tasks! All your past deadlines have been cleared.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {overdueTasks.map((task) => (
              <div
                key={task._id}
                className="bg-[#1B1E30] hover:bg-[#1B1E30]/90 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-md transition group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-[#F1EEFF] text-sm truncate">{task.title}</span>
                    <span className="text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-lg shrink-0">
                      {task.subject}
                    </span>
                  </div>
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>Was due on {new Date(task.deadline).toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    onClick={() => onToggleStatus(task)}
                    className="gradient-btn-purple py-1.5 px-3 rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Mark Done
                  </Button>
                  <button
                    onClick={() => onViewTask(task)}
                    title="View task details"
                    aria-label="View task details"
                    className="p-2 text-[#A5AAC2] hover:text-[#F1EEFF] bg-[#272044] hover:bg-[#272044]/80 rounded-xl border border-[#2B2F45] hover:border-[#9B6BFF]/40 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Due Soon Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Due Within 3 Days ({dueSoonTasks.length})</span>
        </h2>

        {dueSoonTasks.length === 0 ? (
          <div className="bg-[#151827] border border-[#2B2F45] p-4 rounded-2xl text-xs text-[#A5AAC2] shadow-inner">
            No assignments due within the next 3 days.
          </div>
        ) : (
          <div className="space-y-2.5">
            {dueSoonTasks.map((task) => (
              <div
                key={task._id}
                className="bg-[#1B1E30] hover:bg-[#1B1E30]/90 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-md transition group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-[#F1EEFF] text-sm truncate">{task.title}</span>
                    <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg shrink-0">
                      {task.subject}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Due: {new Date(task.deadline).toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    onClick={() => onToggleStatus(task)}
                    className="gradient-btn-purple py-1.5 px-3 rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Mark Done
                  </Button>
                  <button
                    onClick={() => onViewTask(task)}
                    title="View task details"
                    aria-label="View task details"
                    className="p-2 text-[#A5AAC2] hover:text-[#F1EEFF] bg-[#272044] hover:bg-[#272044]/80 rounded-xl border border-[#2B2F45] hover:border-[#9B6BFF]/40 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
