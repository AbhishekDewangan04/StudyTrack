export const SkeletonCard = ({ className = '' }) => (
  <div
    className={`bg-white border border-slate-200 p-5 rounded-2xl animate-pulse space-y-4 shadow-sm ${className}`}
  >
    <div className="flex justify-between items-center">
      <div className="h-4 w-24 bg-slate-100 rounded-md" />
      <div className="w-8 h-8 bg-slate-100 rounded-xl" />
    </div>
    <div className="h-8 w-16 bg-slate-100 rounded-md" />
    <div className="h-3 w-32 bg-slate-100/80 rounded-md" />
  </div>
);

export const SkeletonRow = ({ className = '' }) => (
  <div
    className={`bg-white border border-slate-200 p-4 rounded-xl animate-pulse flex items-center justify-between shadow-xs ${className}`}
  >
    <div className="flex items-center space-x-3 flex-1">
      <div className="w-4 h-4 bg-slate-100 rounded-md shrink-0" />
      <div className="space-y-2 flex-1 max-w-sm">
        <div className="h-4 bg-slate-100 rounded-md w-3/4" />
        <div className="h-3 bg-slate-100/60 rounded-md w-1/2" />
      </div>
    </div>
    <div className="h-6 w-16 bg-slate-100 rounded-md" />
  </div>
);
