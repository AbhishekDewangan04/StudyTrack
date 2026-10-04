import { useMemo } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';

const TaskFilters = ({
  filterStatus,
  onStatusChange,
  filterSubject,
  onSubjectChange,
  filterDeadline,
  onDeadlineChange,
  filterLocation,
  onLocationChange,
  filterRecurrence,
  onRecurrenceChange,
  onResetFilters,
  tasks = [],
}) => {
  const statusPills = ['All', 'Pending', 'Completed', 'Overdue'];

  const subjectOptions = useMemo(() => {
    const listFromTasks = tasks.map((t) => t.subject).filter((s) => s && typeof s === 'string' && s.trim());
    const defaults = ['Data Structures', 'DBMS', 'OS', 'TOC', 'Computer Networks', 'Design', 'Math'];
    if (filterSubject && !listFromTasks.includes(filterSubject) && !defaults.includes(filterSubject)) {
      listFromTasks.push(filterSubject);
    }
    const set = new Set([...listFromTasks, ...defaults]);
    return Array.from(set);
  }, [tasks, filterSubject]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-card">
      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {statusPills.map((status) => {
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Dropdown Select Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Subject Filter Dropdown */}
        <div className="relative">
          <select
            value={filterSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="appearance-none bg-slate-100/70 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-3 py-1.5 pr-7 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="">By Subject</option>
            {subjectOptions.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Location Filter Dropdown */}
        <div className="relative">
          <select
            value={filterLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="appearance-none bg-slate-100/70 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-3 py-1.5 pr-7 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">By Location</option>
            <option value="withLocation">With Location</option>
            <option value="withoutLocation">No Location</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Recurrence Filter Dropdown */}
        <div className="relative">
          <select
            value={filterRecurrence}
            onChange={(e) => onRecurrenceChange(e.target.value)}
            className="appearance-none bg-slate-100/70 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-3 py-1.5 pr-7 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Recurrence</option>
            <option value="recurring">Recurring Tasks</option>
            <option value="oneTime">One-time Tasks</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Reset Button */}
        {(filterStatus !== 'All' || filterSubject || filterLocation !== 'all' || filterRecurrence !== 'all') && (
          <button
            onClick={onResetFilters}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;
