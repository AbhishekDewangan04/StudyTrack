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
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-1 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          <span>Notification Center</span>
        </h2>
        <p className="text-xs text-slate-500">
          Automated warnings for overdue deadlines, upcoming assignment due dates, and recent activity.
        </p>
      </div>

      {/* Overdue Alerts Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-rose-700 tracking-wider flex items-center space-x-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>High Priority: Overdue Assignments ({overdueTasks.length})</span>
        </h3>

        {overdueTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No overdue tasks! All your past deadlines have been cleared.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task._id}
                className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{task.title}</span>
                    <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                      {task.subject}
                    </span>
                  </div>
                  <p className="text-xs text-rose-700 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Was due on {new Date(task.deadline).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => onToggleStatus(task)}
                    variant="primary"
                    size="sm"
                  >
                    Mark Done
                  </Button>
                  <button
                    onClick={() => onViewTask(task)}
                    className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer"
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
        <h3 className="text-xs font-bold uppercase text-amber-700 tracking-wider flex items-center space-x-1.5">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Due Within 3 Days ({dueSoonTasks.length})</span>
        </h3>

        {dueSoonTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-500 shadow-xs">
            No assignments due within the next 3 days.
          </div>
        ) : (
          <div className="space-y-2">
            {dueSoonTasks.map((task) => (
              <div
                key={task._id}
                className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{task.title}</span>
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                      {task.subject}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Due: {new Date(task.deadline).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => onToggleStatus(task)}
                    variant="primary"
                    size="sm"
                  >
                    Mark Done
                  </Button>
                  <button
                    onClick={() => onViewTask(task)}
                    className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer"
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
