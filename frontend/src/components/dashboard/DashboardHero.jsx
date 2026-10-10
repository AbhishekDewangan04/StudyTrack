import { Plus, CheckSquare, GraduationCap, Sparkles, BookOpen, Clock, Calendar } from 'lucide-react';

const DashboardHero = ({ onCreateTask, onViewTasks }) => {
  return (
    <div className="relative w-full bg-gradient-to-r from-[#111522] via-[#191B2B] to-[#111522] border border-[#9B6BFF]/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-[#9B6BFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#FFBF69]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Text & Actions */}
      <div className="space-y-4 max-w-xl z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#9B6BFF]/15 border border-[#9B6BFF]/30 text-xs font-bold text-[#C4A7FF]">
          <Sparkles className="w-3.5 h-3.5 text-[#FFBF69]" />
          <span>Plan • Focus • Achieve</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight font-display tracking-tight">
          Make every <br />
          <span className="gradient-text-purple">study session</span> count.
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
          Stay organized, meet your deadlines, and track your progress — all in one place.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onCreateTask}
            className="gradient-btn-purple px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 cursor-pointer shadow-lg shadow-[#9B6BFF]/25"
          >
            <Plus className="w-4 h-4" />
            <span>Create a task</span>
          </button>

          <button
            onClick={onViewTasks}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-[#090B12] hover:bg-[#111522] border border-[#191B2B] hover:border-[#9B6BFF]/30 transition flex items-center space-x-2 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-[#9B6BFF]" />
            <span>View my tasks</span>
          </button>
        </div>
      </div>

      {/* Right 3D Study Canvas (Section 4 Artwork) */}
      <div className="relative w-full max-w-xs sm:max-w-sm aspect-video sm:aspect-square flex items-center justify-center z-10">
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-[#090B12] to-[#191B2B] border border-[#9B6BFF]/25 p-4 flex flex-col justify-between shadow-2xl overflow-hidden">

          {/* Top Floating Badge */}
          <div className="flex justify-between items-center">
            <div className="px-3 py-1 bg-[#191B2B]/90 backdrop-blur-md rounded-xl border border-[#9B6BFF]/30 flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5 text-[#9B6BFF]" />
              <span className="text-[10px] font-bold text-white">Active Session</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          </div>

          {/* Central Floating Graduation Cap 3D Artwork */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#9B6BFF]/30 to-[#FFBF69]/20 flex items-center justify-center border border-[#9B6BFF]/40 violet-glow animate-pulse-glow">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#9B6BFF] flex items-center justify-center text-white shadow-xl shadow-[#9B6BFF]/40 transform -rotate-6">
                <GraduationCap className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>
            </div>
          </div>

          {/* Bottom Floating Stats Strip */}
          <div className="bg-[#191B2B]/90 backdrop-blur-md p-2.5 rounded-xl border border-[#9B6BFF]/30 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FFBF69]" />
              <strong className="text-white">Daily Focus</strong>
            </span>
            <span className="font-extrabold text-[#C4A7FF]">High Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
