import { Plus, Calendar, BarChart3, ListFilter } from 'lucide-react';
import Button from '../ui/Button';

const QuickActions = ({ onOpenCreateModal, onSelectTab }) => {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions & Shortcuts</h3>
        <span className="text-[10px] text-slate-400 font-semibold">Fast Navigation</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onOpenCreateModal}
          className="w-full font-bold shadow-xs"
        >
          Add Task
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={ListFilter}
          onClick={() => onSelectTab('tasks')}
          className="w-full font-semibold"
        >
          My Tasks
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={Calendar}
          onClick={() => onSelectTab('calendar')}
          className="w-full font-semibold"
        >
          Calendar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={BarChart3}
          onClick={() => onSelectTab('analytics')}
          className="w-full font-semibold"
        >
          Analytics
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;
