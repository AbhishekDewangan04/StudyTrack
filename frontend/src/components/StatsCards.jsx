import { BookOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { SkeletonCard } from './ui/Skeleton';

const StatsCards = ({ stats, loading }) => {
  const total = stats?.totalTasks ?? 0;
  const completed = stats?.completedTasks ?? 0;
  const pending = stats?.pendingTasks ?? 0;
  const overdue = stats?.overdueTasks ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards = [
    {
      title: 'Total Tasks',
      value: total,
      badgeText: total > 0 ? `${total} logged tasks` : 'No tasks logged',
      badgeColor: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      icon: BookOpen,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    },
    {
      title: 'Completed',
      value: completed,
      badgeText: total > 0 ? `${completionRate}% completion rate` : '0% completion rate',
      badgeColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      title: 'Pending',
      value: pending,
      badgeText: pending > 0 ? `${pending} active in queue` : 'No pending tasks',
      badgeColor: 'bg-amber-50 text-amber-600 border border-amber-100',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      title: 'Overdue',
      value: overdue,
      badgeText: overdue > 0 ? 'Requires attention' : 'No overdue tasks',
      badgeColor: overdue > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-200',
      icon: AlertTriangle,
      iconBg: overdue > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500 border border-slate-200',
    },
  ];

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3.5 mb-3">
              <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-2xs`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {card.title}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${card.badgeColor}`}>
                  {card.badgeText}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
