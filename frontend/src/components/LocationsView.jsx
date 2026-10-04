import { MapPin, ExternalLink, Plus, Lock, Crown } from 'lucide-react';
import { buildGoogleMapsUrl } from '../utils/maps';
import { useAuth } from '../context/AuthContext';

const LocationsView = ({ tasks = [], onOpenCreateModal, onOpenProModal }) => {
  const { user } = useAuth();

  if (!user?.isPro) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Study Locations
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Explore physical study spots and navigate directly with Google Maps.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto bg-[#0F172A] border border-amber-500/30 p-8 sm:p-10 rounded-3xl shadow-modal text-white text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              PRO Feature
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight pt-2">
              🔒 Study Locations Required PRO
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-medium">
              Attach libraries, campus study spots, and GPS coordinates to your assignments with one-click Google Maps navigation.
            </p>
          </div>
          <button
            onClick={onOpenProModal}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition cursor-pointer flex items-center justify-center space-x-2 mx-auto"
          >
            <Crown className="w-5 h-5 fill-slate-950" />
            <span>Upgrade to PRO</span>
          </button>
        </div>
      </div>
    );
  }
  // Extract all tasks that have real study locations attached
  const locationTasks = tasks.filter(
    (t) => t.locationName || t.locationAddress || t.locationLatitude !== null
  );

  const locations = locationTasks.map((t) => ({
    id: t._id,
    name: t.locationName || 'Study Location',
    address: t.locationAddress || 'Campus Location',
    taskTitle: t.title,
    subject: t.subject,
    mapsUrl: t.googleMapsUrl || buildGoogleMapsUrl(t),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Explore physical study locations attached to your tasks and navigate with Google Maps.
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center space-x-1.5 bg-[#4F46E5] hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task with Location</span>
          </button>
        )}
      </div>

      {/* Locations Cards Grid or Empty State */}
      {locations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                    {loc.address}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-600">Attached Task</span>
                <p className="text-xs font-bold text-slate-800 truncate">{loc.taskTitle}</p>
                <p className="text-[11px] text-slate-500 font-medium">{loc.subject || 'General'}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  Study Spot
                </span>

                {loc.mapsUrl && (
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                  >
                    <span>Open Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-card max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Study Locations Saved Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When you create or edit tasks, attach a study location name, address, or coordinates to view them here and open direct Google Maps navigation.
          </p>
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center space-x-1.5 bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task with Location</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationsView;
