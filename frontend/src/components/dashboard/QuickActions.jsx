import { PlusCircle, Calendar, BarChart3, Bot } from 'lucide-react';

const QuickActions = ({ onCreateTask, onSelectTab }) => {
  const actions = [
    {
      label: 'Create Task',
      icon: PlusCircle,
      color: 'text-[#9B6BFF] bg-[#9B6BFF]/15 border-[#9B6BFF]/30',
      action: onCreateTask,
    },
    {
      label: 'View Calendar',
      icon: Calendar,
      color: 'text-[#FFBF69] bg-[#FFBF69]/15 border-[#FFBF69]/30',
      action: () => onSelectTab && onSelectTab('calendar'),
    },
    {
      label: 'Study Analytics',
      icon: BarChart3,
      color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
      action: () => onSelectTab && onSelectTab('analytics'),
    },
    {
      label: 'AI Assistant',
      icon: Bot,
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      action: () => onSelectTab && onSelectTab('ai-bot'),
    },
  ];

  return (
    <div className="bg-[#191B2B] border border-[#191B2B] p-5 rounded-2xl shadow-xl space-y-3">
      <h3 className="text-sm font-bold text-white tracking-tight font-display">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              onClick={act.action}
              className="p-3.5 rounded-xl bg-[#111522] hover:bg-[#111522]/80 border border-[#111522] hover:border-[#9B6BFF]/40 transition flex flex-col items-center justify-center space-y-2 text-center group cursor-pointer"
            >
              <div className={`p-2.5 rounded-xl border ${act.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white transition">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
