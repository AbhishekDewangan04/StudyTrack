import { MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import { buildGoogleMapsUrl } from '../../utils/maps';

const StudyLocationsCard = ({ tasks = [], onSelectTab }) => {
  // Extract tasks with location data strictly from real user tasks
  const locationTasks = tasks.filter(
    (t) => t.locationName || t.locationAddress || t.locationLatitude !== null
  );

  const locations = locationTasks.slice(0, 2).map((t) => ({
    id: t._id,
    name: t.locationName || 'Study Location',
    address: t.locationAddress || 'Campus Location',
    mapsUrl: t.googleMapsUrl || buildGoogleMapsUrl(t),
  }));

  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Study Locations
        </h3>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('locations')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Locations List or Truthful Empty State */}
      <div className="space-y-3.5 flex-1">
        {locations.length > 0 ? (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {loc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {loc.address}
                  </p>
                </div>
              </div>

              {/* Badges & Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  Study
                </span>
                {loc.mapsUrl && (
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition"
                  >
                    <span className="mr-0.5">Open Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 text-center space-y-1">
            <MapPin className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No study locations yet</p>
            <p className="text-[11px] text-slate-400 font-medium">Attach physical study locations or addresses when creating tasks to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyLocationsCard;
