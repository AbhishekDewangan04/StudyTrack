import { Calendar, CheckCircle2, Clock, Eye, Pencil, Trash2, AlertCircle, Tag, MapPin, ExternalLink } from 'lucide-react';
import Badge from './ui/Badge';
import { buildGoogleMapsUrl } from '../utils/maps';

const TaskCard = ({ task, onToggleStatus, onEdit, onDelete, onView }) => {
  const isCompleted = task.status === 'Completed';
  const deadlineDate = new Date(task.deadline);
  const isOverdue = !isCompleted && deadlineDate < new Date();

  const mapsUrl = task.googleMapsUrl || buildGoogleMapsUrl(task);
  const hasLocation = task.locationName || task.locationAddress || task.locationLatitude || task.locationLongitude || mapsUrl;

  // Format date nicely
  const formatDate = (date) => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(date);
    }
  };

  return (
    <div
      className={`bg-white border ${
        isOverdue
          ? 'border-rose-300 bg-rose-50/20 shadow-xs'
          : isCompleted
          ? 'border-slate-200/90 bg-slate-50/40'
          : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
      } p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 group`}
    >
      {/* Top Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Subject & Recurrence Badges */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <Badge variant="indigo" size="sm" icon={Tag}>
              {task.subject}
            </Badge>

            {task.isRecurring && task.recurrenceType && task.recurrenceType !== 'none' && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full capitalize">
                <span>↻ {task.recurrenceType}</span>
              </span>
            )}
          </div>

          {/* Status Quick Toggle */}
          <button
            onClick={() => onToggleStatus(task)}
            title="Click to toggle completion"
            aria-label={`Toggle task completion. Current status: ${task.status}`}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{task.status}</span>
          </button>
        </div>

        {/* Task Title */}
        <h3
          onClick={() => onView(task)}
          className={`text-base font-bold text-slate-900 tracking-tight cursor-pointer hover:text-indigo-600 transition leading-snug ${
            isCompleted ? 'line-through text-slate-400' : ''
          }`}
        >
          {task.title}
        </h3>

        {/* Task Description */}
        {task.description ? (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
            {task.description}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 italic">No additional details provided.</p>
        )}

        {/* Study Location Badge/Card inside TaskCard */}
        {hasLocation && (
          <div className="pt-1">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-2 rounded-xl text-xs">
              <div className="flex items-center space-x-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div className="truncate text-[11px]">
                  <span className="font-semibold text-slate-800">
                    {task.locationName || task.locationAddress}
                  </span>
                  {task.locationName && task.locationAddress && (
                    <span className="text-slate-500 ml-1 text-[10px]">({task.locationAddress})</span>
                  )}
                </div>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200/80 transition shrink-0 ml-1 cursor-pointer"
                >
                  <span>Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
        {/* Deadline */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className={`truncate text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}`}>
            {formatDate(task.deadline)}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center text-[9px] text-rose-700 font-bold uppercase bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
              <AlertCircle className="w-3 h-3 mr-0.5" />
              Overdue
            </span>
          )}
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-0.5 shrink-0">
          <button
            onClick={() => onView(task)}
            title="View Details"
            aria-label="View Details"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit Task"
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            title="Delete Task"
            aria-label="Delete Task"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
