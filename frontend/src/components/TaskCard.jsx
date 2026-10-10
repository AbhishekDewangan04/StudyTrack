import { Calendar, CheckCircle2, Clock, Eye, Pencil, Trash2, AlertCircle, Tag, MapPin, ExternalLink } from 'lucide-react';
import Badge from './ui/Badge';
import { buildGoogleMapsUrl } from '../utils/maps';

const TaskCard = ({ task, onToggleStatus, onEdit, onDelete, onView }) => {
  const isCompleted = task.status === 'Completed';
  const deadlineDate = new Date(task.deadline);
  const isOverdue = !isCompleted && deadlineDate < new Date();

  const mapsUrl = task.googleMapsUrl || buildGoogleMapsUrl(task);
  const hasLocation = task.locationName || task.locationAddress || task.locationLatitude || task.locationLongitude || mapsUrl;

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
      className={`bg-[#191B2B] border ${
        isOverdue
          ? 'border-rose-500/40 bg-rose-950/10'
          : isCompleted
          ? 'border-[#111522] opacity-85'
          : 'border-[#191B2B] hover:border-[#9B6BFF]/40'
      } p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 group shadow-xl`}
    >
      {/* Top Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Subject & Recurrence Badges */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#9B6BFF]/20 text-[#C4A7FF] border border-[#9B6BFF]/30">
              <Tag className="w-3 h-3 mr-1 text-[#9B6BFF]" />
              <span>{task.subject || 'General'}</span>
            </span>

            {task.isRecurring && task.recurrenceType && task.recurrenceType !== 'none' && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#FFBF69] bg-[#FFBF69]/10 border border-[#FFBF69]/30 px-2 py-0.5 rounded-full capitalize">
                <span>↻ {task.recurrenceType}</span>
              </span>
            )}
          </div>

          {/* Status Quick Toggle */}
          <button
            onClick={() => onToggleStatus(task)}
            title="Click to toggle completion"
            aria-label={`Toggle task completion. Current status: ${task.status}`}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-[#FFBF69]/20 text-[#FFBF69] border-[#FFBF69]/40 hover:bg-[#FFBF69]/30'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-[#FFBF69]" />}
            <span>{task.status}</span>
          </button>
        </div>

        {/* Task Title */}
        <h3
          onClick={() => onView(task)}
          className={`text-base font-bold text-white tracking-tight cursor-pointer hover:text-[#C4A7FF] transition leading-snug font-display ${
            isCompleted ? 'line-through text-slate-500' : ''
          }`}
        >
          {task.title}
        </h3>

        {/* Task Description */}
        {task.description ? (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {task.description}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500 italic">No additional details provided.</p>
        )}

        {/* Study Location Badge/Card inside TaskCard */}
        {hasLocation && (
          <div className="pt-1">
            <div className="flex items-center justify-between bg-[#111522] border border-[#191B2B] p-2 rounded-xl text-xs">
              <div className="flex items-center space-x-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#9B6BFF] shrink-0" />
                <div className="truncate text-[11px]">
                  <span className="font-semibold text-slate-200">
                    {task.locationName || task.locationAddress}
                  </span>
                </div>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#C4A7FF] bg-[#9B6BFF]/20 hover:bg-[#9B6BFF]/30 px-2 py-0.5 rounded-md border border-[#9B6BFF]/30 transition shrink-0 ml-1 cursor-pointer"
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
      <div className="pt-3 border-t border-[#111522] flex items-center justify-between text-xs text-slate-400 gap-2">
        {/* Deadline */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className={`truncate text-[11px] ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300 font-medium'}`}>
            {formatDate(task.deadline)}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center text-[9px] text-rose-300 font-bold uppercase bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/40 shrink-0">
              <AlertCircle className="w-3 h-3 mr-0.5 text-rose-400" />
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
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#111522] rounded-lg transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit Task"
            className="p-1.5 text-slate-400 hover:text-[#9B6BFF] hover:bg-[#111522] rounded-lg transition cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            title="Delete Task"
            aria-label="Delete Task"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
