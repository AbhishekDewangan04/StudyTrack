import { CheckCircle2, FileText, RefreshCw, MapPin, ChevronRight, Activity } from 'lucide-react';

const RecentActivity = ({ liveNotifications = [], tasks = [], onSelectTab }) => {
  // Derive real activities strictly from liveNotifications or real user tasks
  const activities = liveNotifications.length > 0
    ? liveNotifications.slice(0, 4).map((n) => ({
        id: n.id || Math.random().toString(),
        title: n.title,
        message: n.message,
        time: n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        icon: n.type === 'completed' ? CheckCircle2 : RefreshCw,
        iconColor: n.type === 'completed'
          ? 'text-emerald-500 bg-emerald-50 border-emerald-100'
          : 'text-indigo-500 bg-indigo-50 border-indigo-100',
      }))
    : tasks.length > 0
    ? tasks.slice(0, 4).map((t) => ({
        id: t._id,
        title: t.status === 'Completed' ? `Completed "${t.title}"` : `Task in queue: "${t.title}"`,
        message: `Subject: ${t.subject || 'General'}`,
        time: t.updatedAt
          ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recent',
        icon: t.status === 'Completed' ? CheckCircle2 : t.locationName ? MapPin : FileText,
        iconColor: t.status === 'Completed'
          ? 'text-emerald-500 bg-emerald-50 border-emerald-100'
          : t.locationName
          ? 'text-purple-500 bg-purple-50 border-purple-100'
          : 'text-indigo-500 bg-indigo-50 border-indigo-100',
      }))
    : [];

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Recent Activity
        </h3>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('notifications')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Activity List or Truthful Empty State */}
      <div className="space-y-4 flex-1">
        {activities.length > 0 ? (
          activities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center space-x-3.5 group">
                <div className={`p-2 rounded-full border ${item.iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {item.message || item.time}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 text-center space-y-1">
            <Activity className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No recent activity</p>
            <p className="text-[11px] text-slate-400 font-medium">Activity updates will appear here as you create or complete assignments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
