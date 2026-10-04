import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart2, PieChart } from 'lucide-react';
import { SkeletonCard } from './ui/Skeleton';

const AnalyticsView = () => {
  const [period, setPeriod] = useState('7 Days');
  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, subjectsRes, trendsRes] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getSubjects(),
          analyticsAPI.getTrends(),
        ]);
        setOverview(overviewRes);
        setSubjects(subjectsRes || []);
        setTrends(trendsRes || null);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError(err.message || 'Failed to load analytics dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const totalTasksCount = overview?.totalTasks ?? 0;
  const completionRate = overview?.completionPercentage ?? 0;
  const currentStreak = overview?.currentStreak ?? 0;
  const longestStreak = overview?.longestStreak ?? 0;
  const topSubject = overview?.mostProductiveSubject || null;

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const weeklyTrendList = Array.isArray(trends?.weeklyTrend) ? trends.weeklyTrend : [];

  const periodOptions = ['7 Days', '30 Days', '3 Months', '1 Year'];

  // Palette colors for subjects
  const colorPalette = ['#4F46E5', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

  return (
    <div className="space-y-6">
      {/* Analytics Header & Period Selector */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track your progress and improve your productivity.
          </p>
        </div>

        {/* Period Selector Pills */}
        <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200/60 text-xs font-semibold">
          {periodOptions.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Completion Rate */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card space-y-2">
          <span className="text-xs font-semibold text-slate-500">
            Completion Rate
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {completionRate}%
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
            {totalTasksCount > 0 ? `${overview?.completedTasks || 0} of ${totalTasksCount} tasks completed` : 'No tasks logged'}
          </span>
        </div>

        {/* Card 2: Current Streak */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card space-y-2">
          <span className="text-xs font-semibold text-slate-500">
            Current Streak
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
            {currentStreak > 0 ? 'Keep it going! 🔥' : 'Complete a task today to start'}
          </span>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card space-y-2">
          <span className="text-xs font-semibold text-slate-500">
            Longest Streak
          </span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </div>
          <span className="inline-flex items-center text-[11px] font-semibold text-slate-400">
            Your best streak
          </span>
        </div>

        {/* Card 4: Most Productive Subject */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-card space-y-2">
          <span className="text-xs font-semibold text-slate-500">
            Most Productive Subject
          </span>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
            {topSubject || 'No data yet'}
          </div>
          <span className="inline-flex items-center text-[11px] font-semibold text-indigo-600">
            {topSubject ? 'Highest completions' : 'Complete tasks to establish metrics'}
          </span>
        </div>
      </div>

      {/* Middle Grid: Task Completion Trend + Subject-wise Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Trend (2 Cols LG) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Task Completion Trend
            </h3>
            <div className="flex items-center space-x-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Created</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Representation from REAL API trends */}
          {weeklyTrendList.length > 0 ? (
            <div className="relative h-48 flex items-end justify-between px-2 pt-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-200">
                <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
                <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
                <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
              </div>

              {(() => {
                const maxVal = Math.max(
                  1,
                  ...weeklyTrendList.map((w) => Math.max(w.completed || 0, w.created || 0))
                );

                return weeklyTrendList.map((item, i) => {
                  const createdVal = item.created || 0;
                  const completedVal = item.completed || 0;

                  const createdH = createdVal > 0 ? Math.max((createdVal / maxVal) * 100, 12) : 0;
                  const completedH = completedVal > 0 ? Math.max((completedVal / maxVal) * 100, 12) : 0;

                  return (
                    <div key={i} className="flex flex-col items-center space-y-2 z-10 flex-1">
                      <div
                        className="w-full flex items-end justify-center space-x-1"
                        style={{ height: '130px' }}
                      >
                        {/* Created Bar */}
                        <div
                          className={`w-3 sm:w-4 rounded-t-md transition-all duration-300 ${
                            createdVal > 0
                              ? 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                              : 'bg-transparent'
                          }`}
                          style={{ height: `${createdH}%` }}
                          title={`Created: ${createdVal}`}
                        />

                        {/* Completed Bar */}
                        <div
                          className={`w-3 sm:w-4 rounded-t-md transition-all duration-300 ${
                            completedVal > 0
                              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-2xs'
                              : 'bg-transparent'
                          }`}
                          style={{ height: `${completedH}%` }}
                          title={`Completed: ${completedVal}`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[45px]">
                        {item.day || item.date || `D${i + 1}`}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center space-y-1">
              <BarChart2 className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No trend analytics available yet</p>
              <p className="text-[11px] text-slate-400 font-medium">Create and complete tasks over time to populate your trend chart.</p>
            </div>
          )}
        </div>

        {/* Subject-wise Performance (Donut Chart) */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
            Subject-wise Performance
          </h3>

          {subjectList.length > 0 ? (
            <div className="flex items-center justify-between space-x-4">
              {/* Donut Chart SVG */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-indigo-600"
                    strokeWidth="4"
                    strokeDasharray="40, 100"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500"
                    strokeWidth="4"
                    strokeDasharray="25, 100"
                    strokeDashoffset="-40"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                  <span className="text-lg font-extrabold text-slate-900">{totalTasksCount}</span>
                </div>
              </div>

              {/* Subject List Legend */}
              <div className="space-y-1.5 flex-1 text-xs">
                {subjectList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between font-medium text-slate-700">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorPalette[idx % colorPalette.length] }} />
                      <span className="truncate max-w-[90px]">{item.subject || item._id}</span>
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">{item.completed || item.count || item.total || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center space-y-1">
              <PieChart className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No subject data available yet</p>
              <p className="text-[11px] text-slate-400 font-medium">Categorize tasks by subject to see breakdown statistics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
