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
      badgeText: total > 0 ? `${total} logged` : '0 logged',
      badgeColor: 'bg-[#9B6BFF]/20 text-[#C4A7FF] border border-[#9B6BFF]/30',
      icon: BookOpen,
      iconBg: 'bg-[#9B6BFF]/20 text-[#C4A7FF] border border-[#9B6BFF]/40',
      borderGlow: 'hover:border-[#9B6BFF]/50',
    },
    {
      title: 'Completed',
      value: completed,
      badgeText: `${completionRate}% rate`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      borderGlow: 'hover:border-emerald-500/40',
    },
    {
      title: 'Pending',
      value: pending,
      badgeText: pending > 0 ? `${pending} active` : '0 active',
      badgeColor: 'bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/30',
      icon: Clock,
      iconBg: 'bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/40',
      borderGlow: 'hover:border-[#FFBF69]/40',
    },
    {
      title: 'Overdue',
      value: overdue,
      badgeText: overdue > 0 ? 'Action required' : 'Clear queue',
      badgeColor: overdue > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700',
      icon: AlertTriangle,
      iconBg: overdue > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700',
      borderGlow: overdue > 0 ? 'hover:border-rose-500/50' : 'hover:border-slate-700',
    },
  ];

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#191B2B] border border-[#191B2B] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[#191B2B] border border-[#191B2B] ${card.borderGlow} p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between shadow-lg hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-white tracking-tight font-display">
                {card.value}
              </div>
              <div className="flex items-center pt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${card.badgeColor}`}>
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
