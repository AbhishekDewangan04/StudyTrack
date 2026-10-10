import { MoreVertical, MapPin, Calendar, CheckSquare, Square, Trash2, Edit2, Eye } from 'lucide-react';
import { useState } from 'react';
import { buildGoogleMapsUrl } from '../utils/maps';

const TaskTableView = ({ tasks = [], onToggleStatus, onEdit, onDelete, onView }) => {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const getStatusPill = (task) => {
    const isCompleted = task.status === 'Completed';
    const isOverdue = task.status === 'Pending' && new Date(task.deadline) < new Date();

    if (isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Completed
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/30">
        Pending
      </span>
    );
  };

  const getDeadlineFormat = (deadlineStr, task) => {
    const d = new Date(deadlineStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now.getTime() + 86400000);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    if (isTomorrow) {
      return <span className="text-rose-400 font-bold">Tomorrow</span>;
    }
    if (isToday) {
      return <span className="text-[#FFBF69] font-bold">Today</span>;
    }

    return (
      <span className="text-slate-300 font-medium">
        {d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  };

  return (
    <div className="bg-[#191B2B] border border-[#191B2B] rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#111522] bg-[#111522] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="py-3.5 px-4 w-10 text-center">
                <Square className="w-4 h-4 text-slate-500 mx-auto" />
              </th>
              <th className="py-3.5 px-4">Task Title</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Deadline</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111522] text-xs text-slate-300 font-medium">
            {tasks.map((task) => {
              const mapsUrl = task.googleMapsUrl || buildGoogleMapsUrl(task);
              const isCompleted = task.status === 'Completed';

              return (
                <tr
                  key={task._id}
                  className="hover:bg-[#111522]/80 transition-colors duration-150 group"
                >
                  {/* Checkbox Column */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onToggleStatus(task)}
                      className="text-slate-500 hover:text-[#9B6BFF] cursor-pointer transition"
                      aria-label="Toggle task status"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                  </td>

                  {/* Task Column */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 max-w-xs sm:max-w-md">
                      <p
                        onClick={() => onView(task)}
                        className={`font-bold text-white cursor-pointer hover:text-[#C4A7FF] transition truncate ${
                          isCompleted ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Subject Column */}
                  <td className="py-3.5 px-4 font-bold text-[#C4A7FF]">
                    {task.subject || 'General'}
                  </td>

                  {/* Deadline Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getDeadlineFormat(task.deadline, task)}
                  </td>

                  {/* Status Pill Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusPill(task)}
                  </td>

                  {/* Location Column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {task.locationName || task.locationAddress ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-slate-300 hover:text-[#9B6BFF] transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#9B6BFF]" />
                        <span className="truncate max-w-[130px]">
                          {task.locationName || task.locationAddress}
                        </span>
                      </a>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Actions 3-dot Menu Column */}
                  <td className="py-3.5 px-4 text-right relative whitespace-nowrap">
                    <div className="inline-block text-left">
                      <button
                        onClick={() =>
                          setActionMenuOpen(actionMenuOpen === task._id ? null : task._id)
                        }
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#111522] transition cursor-pointer"
                        aria-label="Open task actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuOpen === task._id && (
                        <div className="origin-top-right absolute right-0 mt-1 w-36 bg-[#111522] border border-[#191B2B] rounded-xl shadow-2xl z-30 p-1 space-y-0.5 text-left text-xs font-semibold text-slate-200">
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              onView(task);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#191B2B] rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              onEdit(task);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#191B2B] rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#9B6BFF]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              onDelete(task._id);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTableView;
