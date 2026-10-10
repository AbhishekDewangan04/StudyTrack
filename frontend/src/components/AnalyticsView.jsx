import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart2, PieChart, TrendingUp, Award, Zap, CheckCircle2 } from 'lucide-react';
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
  const colorPalette = ['#9B6BFF', '#FFBF69', '#38BDF8', '#34D399', '#F472B6', '#A78BFA'];

  return (
    <div className="space-y-6">
      {/* Header & Period Selector */}
      <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Productivity Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Real data performance metrics and assignment trends
          </p>
        </div>

        <div className="bg-[#111522] p-1 rounded-2xl flex items-center space-x-1 border border-[#191B2B] text-xs font-semibold">
          {periodOptions.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                period === p
                  ? 'bg-[#9B6BFF] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-2xl">
          {error}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#191B2B] border border-[#191B2B] hover:border-[#9B6BFF]/40 p-5 rounded-2xl transition space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-slate-400">Completion Rate</span>
          <div className="text-3xl font-black text-white tracking-tight font-display">
            {completionRate}%
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {totalTasksCount > 0 ? `${overview?.completedTasks || 0} of ${totalTasksCount} tasks` : '0 tasks'}
          </span>
        </div>

        <div className="bg-[#191B2B] border border-[#191B2B] hover:border-[#FFBF69]/40 p-5 rounded-2xl transition space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-slate-400">Current Streak</span>
          <div className="text-3xl font-black text-white tracking-tight font-display">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/30">
            {currentStreak > 0 ? 'Active streak! 🔥' : 'Complete a task today'}
          </span>
        </div>

        <div className="bg-[#191B2B] border border-[#191B2B] p-5 rounded-2xl space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-slate-400">Longest Streak</span>
          <div className="text-3xl font-black text-white tracking-tight font-display">
            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </div>
          <span className="inline-flex items-center text-[10px] font-bold text-slate-400">
            All-time record
          </span>
        </div>

        <div className="bg-[#191B2B] border border-[#191B2B] p-5 rounded-2xl space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-slate-400">Top Subject</span>
          <div className="text-xl font-black text-white tracking-tight font-display truncate">
            {topSubject || 'No data'}
          </div>
          <span className="inline-flex items-center text-[10px] font-bold text-[#C4A7FF]">
            {topSubject ? 'Highest completions' : 'Establishing metrics'}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white tracking-tight font-display">
              Task Completion Trend
            </h3>
            <div className="flex items-center space-x-3 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9B6BFF]" />
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF69]" />
                <span>Created</span>
              </span>
            </div>
          </div>

          {weeklyTrendList.length > 0 ? (
            <div className="relative h-48 flex items-end justify-between px-2 pt-6">
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
                      <div className="w-full flex items-end justify-center space-x-1 h-32 px-1 bg-[#111522] rounded-xl p-1.5">
                        <div
                          className={`w-3 rounded-t-md transition-all ${
                            completedVal > 0 ? 'bg-gradient-to-t from-[#9B6BFF] to-[#C4A7FF]' : 'bg-transparent'
                          }`}
                          style={{ height: `${completedH}%` }}
                        />
                        <div
                          className={`w-3 rounded-t-md transition-all ${
                            createdVal > 0 ? 'bg-gradient-to-t from-[#FFBF69] to-[#ffe3b3]' : 'bg-transparent'
                          }`}
                          style={{ height: `${createdH}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {item.day || item.date || `D${i + 1}`}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-[#111522] rounded-xl bg-[#111522] p-6 text-center space-y-1">
              <BarChart2 className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-bold text-white">No trend analytics available yet</p>
              <p className="text-[11px] text-slate-400 font-medium">Create and complete tasks over time to populate your trend chart.</p>
            </div>
          )}
        </div>

        <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight mb-4 font-display">
            Subject Distribution
          </h3>

          {subjectList.length > 0 ? (
            <div className="space-y-3">
              {subjectList.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">{item.subject || item._id}</span>
                    <span className="text-[#C4A7FF]">{item.completed || item.count || 0} completed</span>
                  </div>
                  <div className="w-full bg-[#111522] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${totalTasksCount > 0 ? Math.min(100, Math.round(((item.completed || item.count || 1) / totalTasksCount) * 100)) : 20}%`,
                        backgroundColor: colorPalette[idx % colorPalette.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-[#111522] rounded-xl bg-[#111522] p-6 text-center space-y-1">
              <PieChart className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-bold text-white">No subject data available</p>
              <p className="text-[11px] text-slate-400 font-medium">Categorize tasks by subject to see breakdown statistics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
