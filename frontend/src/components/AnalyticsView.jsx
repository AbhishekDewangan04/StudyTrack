import { useState, useEffect, useMemo } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart2, PieChart, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const AnalyticsView = () => {
  const [period, setPeriod] = useState('7 Days');
  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const fetchAnalytics = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, subjectsRes, trendsRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getSubjects(),
        analyticsAPI.getTrends({ period: selectedPeriod }),
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

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const totalTasksCount = overview?.totalTasks ?? 0;
  const completionRate = overview?.completionPercentage ?? 0;
  const currentStreak = overview?.currentStreak ?? 0;
  const longestStreak = overview?.longestStreak ?? 0;
  const topSubject = overview?.mostProductiveSubject || null;

  const subjectList = Array.isArray(subjects) ? subjects : [];

  // Normalize trend data using both new and legacy field names
  const rawTrendItems = useMemo(() => {
    const list = trends?.trendData || trends?.weeklyTrend;
    if (!Array.isArray(list)) return [];
    return list.map((item, idx) => ({
      index: idx,
      day: item.day || `Day ${idx + 1}`,
      date: item.date || item.day || `Day ${idx + 1}`,
      created: Number(item.created ?? item.createdCount ?? 0),
      completed: Number(item.completed ?? item.completedCount ?? 0),
    }));
  }, [trends]);

  // Determine scale and activity
  const { maxVal, hasAnyActivity } = useMemo(() => {
    let max = 0;
    let anyActivity = false;
    rawTrendItems.forEach((d) => {
      if (d.created > 0 || d.completed > 0) anyActivity = true;
      if (d.created > max) max = d.created;
      if (d.completed > max) max = d.completed;
    });
    // Ensure at least a scale of 4 for nice axis intervals (0, 1, 2, 3, 4)
    return {
      maxVal: max === 0 ? 4 : Math.max(max, 4),
      hasAnyActivity: anyActivity,
    };
  }, [rawTrendItems]);

  const periodOptions = ['7 Days', '30 Days', '3 Months', '1 Year'];
  const colorPalette = ['#9B6BFF', '#FFBF69', '#38BDF8', '#34D399', '#F472B6', '#A78BFA'];

  // Calculate Y-axis tick values (4 steps)
  const yTicks = useMemo(() => {
    const step = maxVal / 4;
    return [
      Math.round(maxVal),
      Math.round(step * 3),
      Math.round(step * 2),
      Math.round(step * 1),
      0,
    ];
  }, [maxVal]);

  const hoveredData = hoveredIndex !== null && rawTrendItems[hoveredIndex] ? rawTrendItems[hoveredIndex] : null;

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

        <div className="flex items-center space-x-2">
          <div className="bg-[#111522] p-1 rounded-2xl flex items-center space-x-1 border border-[#191B2B] text-xs font-semibold">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                disabled={loading && period === p}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                  period === p
                    ? 'bg-[#9B6BFF] text-white font-bold shadow-md shadow-[#9B6BFF]/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#191B2B]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(period)}
            title="Refresh analytics data"
            aria-label="Refresh analytics data"
            className="p-2.5 bg-[#111522] hover:bg-[#191B2B] border border-[#191B2B] rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#9B6BFF]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchAnalytics(period)}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Retry
          </button>
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

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Trend Panel (2 cols) */}
        <div className="lg:col-span-2 bg-[#191B2B] border border-[#191B2B] p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col">
          {/* Panel Header: Title, Subtitle directly below, and Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight font-display flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-[#9B6BFF]" />
                <span>Task Completion Trend</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Comparison of assignments completed vs. created ({period})
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs font-medium self-start sm:self-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9B6BFF] shadow-sm shadow-[#9B6BFF]/50" />
                <span className="text-slate-300">Completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF69] shadow-sm shadow-[#FFBF69]/50" />
                <span className="text-slate-300">Created</span>
              </span>
            </div>
          </div>

          {/* Compact Caption & Active Tooltip Strip directly above plot */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 py-1.5 border-b border-[#111522] mb-3 min-h-[26px]">
            {hoveredData ? (
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-white">{hoveredData.date || hoveredData.day}:</span>
                <span className="text-[#C4A7FF] font-semibold">{hoveredData.completed} completed</span>
                <span className="text-slate-600">•</span>
                <span className="text-[#FFBF69] font-semibold">{hoveredData.created} created</span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Hover over bars to inspect daily counts</span>
            )}
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
              Scale: 0–{maxVal}
            </span>
          </div>

          {/* Chart Canvas Area */}
          {totalTasksCount === 0 && !hasAnyActivity ? (
            /* Graceful Empty State for accounts with zero tasks */
            <div className="h-[250px] sm:h-[320px] flex flex-col items-center justify-center border border-dashed border-[#1e2238] rounded-xl bg-[#111522]/40 p-6 text-center space-y-2">
              <BarChart2 className="w-10 h-10 text-[#9B6BFF]/40" />
              <p className="text-xs font-bold text-white">No tasks created yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                You haven't added any tasks yet. Create coursework in the planner to see your real completion and creation trends.
              </p>
            </div>
          ) : rawTrendItems.length > 0 ? (
            /* Render Trend Chart with Visible Y-Axis, Gridlines, and Bars */
            <div className="relative h-[250px] sm:h-[320px] w-full flex flex-col justify-end pt-2 pb-1">
              {/* Background Horizontal Gridlines with Y-Axis Labels */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pl-8">
                {yTicks.map((val, idx) => (
                  <div key={idx} className="flex items-center w-full">
                    <span className="w-6 text-[10px] font-bold text-slate-500 text-right pr-2 select-none">
                      {val}
                    </span>
                    <div className="flex-1 border-b border-[#1c2035] border-dashed" />
                  </div>
                ))}
              </div>

              {/* Foreground Bars Container */}
              <div className="relative z-10 flex items-end justify-between pl-8 h-[calc(100%-26px)]">
                {rawTrendItems.map((item, idx) => {
                  const compHeight = item.completed > 0 ? Math.max((item.completed / maxVal) * 100, 8) : 0;
                  const createHeight = item.created > 0 ? Math.max((item.created / maxVal) * 100, 8) : 0;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`flex-1 flex flex-col items-center justify-end h-full px-0.5 sm:px-1 rounded-xl transition cursor-pointer relative ${
                        isHovered ? 'bg-[#9B6BFF]/10' : ''
                      }`}
                    >
                      {/* Floating Tooltip Bubble on Hover */}
                      {isHovered && (
                        <div className="absolute -top-9 z-30 pointer-events-none bg-[#090B12] text-white px-2 py-1 rounded-lg border border-[#9B6BFF]/40 shadow-xl text-[10px] whitespace-nowrap flex items-center space-x-1.5 animate-fade-in">
                          <span className="font-bold">{item.day}:</span>
                          <span className="text-[#C4A7FF]">{item.completed} comp</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-[#FFBF69]">{item.created} crt</span>
                        </div>
                      )}

                      {/* Dual Bar Column */}
                      <div className="w-full max-w-[42px] flex items-end justify-center space-x-1 h-full pb-0.5">
                        {/* Completed Bar (Electric Violet) */}
                        <div
                          style={{ height: `${compHeight}%` }}
                          className={`w-1/2 rounded-t-md transition-all duration-300 ${
                            item.completed > 0
                              ? 'bg-gradient-to-t from-[#9B6BFF] to-[#C4A7FF] shadow-sm shadow-[#9B6BFF]/40'
                              : 'bg-slate-800/20 h-[3px]'
                          }`}
                        />
                        {/* Created Bar (Warm Amber) */}
                        <div
                          style={{ height: `${createHeight}%` }}
                          className={`w-1/2 rounded-t-md transition-all duration-300 ${
                            item.created > 0
                              ? 'bg-gradient-to-t from-[#FFBF69] to-[#ffe3b3] shadow-sm shadow-[#FFBF69]/40'
                              : 'bg-slate-800/20 h-[3px]'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels Row */}
              <div className="flex items-center justify-between pl-8 pt-1.5 border-t border-[#191B2B]">
                {rawTrendItems.map((item, idx) => {
                  const isHovered = hoveredIndex === idx;
                  // If lots of items (e.g. 30 days), only show spaced labels
                  const shouldShowLabel =
                    rawTrendItems.length <= 14 || idx % Math.ceil(rawTrendItems.length / 7) === 0 || idx === rawTrendItems.length - 1;

                  return (
                    <div key={idx} className="flex-1 text-center">
                      <span
                        className={`text-[10px] font-bold block truncate transition ${
                          isHovered
                            ? 'text-white scale-105'
                            : shouldShowLabel
                            ? 'text-slate-400'
                            : 'text-transparent select-none'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[250px] sm:h-[320px] flex flex-col items-center justify-center border border-dashed border-[#1e2238] rounded-xl bg-[#111522] p-6 text-center space-y-1">
              <BarChart2 className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-bold text-white">No trend data available for this timeframe</p>
              <p className="text-[11px] text-slate-400">Try selecting another period.</p>
            </div>
          )}
        </div>

        {/* Subject Distribution Panel (1 col) */}
        <div className="bg-[#191B2B] border border-[#191B2B] p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight font-display flex items-center gap-2">
                <PieChart className="w-4.5 h-4.5 text-[#9B6BFF]" />
                <span>Subject Distribution</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400 bg-[#111522] px-2.5 py-1 rounded-xl border border-[#191B2B]">
                {subjectList.length} {subjectList.length === 1 ? 'Subject' : 'Subjects'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Breakdown of total and completed assignments by subject
            </p>

            {subjectList.length > 0 ? (
              <div className="space-y-4">
                {subjectList.map((item, idx) => {
                  const total = item.total || item.count || 0;
                  const completed = item.completed || 0;
                  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                  const color = colorPalette[idx % colorPalette.length];

                  return (
                    <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-[#111522]/60 transition">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-white truncate">
                            {item.subject || item._id || 'General'}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300">
                          {completed} / {total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#111522] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#191B2B]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center border border-dashed border-[#1e2238] rounded-xl bg-[#111522] p-6 text-center space-y-1">
                <PieChart className="w-8 h-8 text-slate-500" />
                <p className="text-xs font-bold text-white">No subject data available</p>
                <p className="text-[11px] text-slate-400">Categorize tasks by subject to see breakdown statistics.</p>
              </div>
            )}
          </div>

          {/* Quick Summary Footer */}
          {subjectList.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#111522] flex items-center justify-between text-xs text-slate-400">
              <span>Overall Progress</span>
              <span className="font-bold text-white">{completionRate}% Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
