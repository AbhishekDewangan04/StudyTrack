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
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
          Completed
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
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
      return <span className="text-rose-600 font-bold">Tomorrow 10:00 AM</span>;
    }
    if (isToday) {
      return <span className="text-amber-600 font-bold">Today</span>;
    }

    return (
      <span className="text-slate-600 font-medium">
        {d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10 text-center">
                <Square className="w-4 h-4 text-slate-300 mx-auto" />
              </th>
              <th className="py-3.5 px-4">Task</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Deadline</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
            {tasks.map((task) => {
              const mapsUrl = task.googleMapsUrl || buildGoogleMapsUrl(task);
              const isCompleted = task.status === 'Completed';

              return (
                <tr
                  key={task._id}
                  className="hover:bg-slate-50/80 transition-colors duration-150 group"
                >
                  {/* Checkbox Column */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onToggleStatus(task)}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer transition"
                      aria-label="Toggle task status"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </button>
                  </td>

                  {/* Task Column (Title + Description) */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5 max-w-xs sm:max-w-md">
                      <p
                        onClick={() => onView(task)}
                        className={`font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition truncate ${
                          isCompleted ? 'line-through text-slate-400' : ''
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
                  <td className="py-4 px-4 font-bold text-slate-800">
                    {task.subject || 'General'}
                  </td>

                  {/* Deadline Column */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getDeadlineFormat(task.deadline, task)}
                  </td>

                  {/* Status Pill Column */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getStatusPill(task)}
                  </td>

                  {/* Location Column */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {task.locationName || task.locationAddress ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-slate-600 hover:text-indigo-600 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate max-w-[130px]">
                          {task.locationName || task.locationAddress}
                        </span>
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Actions 3-dot Menu Column */}
                  <td className="py-4 px-4 text-right relative whitespace-nowrap">
                    <div className="inline-block text-left">
                      <button
                        onClick={() =>
                          setActionMenuOpen(actionMenuOpen === task._id ? null : task._id)
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        aria-label="Open task actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuOpen === task._id && (
                        <div className="origin-top-right absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-modal z-30 p-1 space-y-0.5 text-left text-xs font-semibold text-slate-700">
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              onView(task);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              onEdit(task);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              onDelete(task._id);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg flex items-center space-x-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
