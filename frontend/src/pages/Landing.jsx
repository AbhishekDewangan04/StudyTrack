import { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  BarChart3,
  Bot,
  Brain,
  ShieldCheck,
  Zap,
  Star,
  Users,
  Award,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing({ onNavigateToLogin, onNavigateToRegister }) {
  const { isAuthenticated } = useAuth();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 flex flex-col font-sans selection:bg-[#9B6BFF]/30 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#090B12]/80 backdrop-blur-xl border-b border-[#191B2B] px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-2xl bg-[#9B6BFF] flex items-center justify-center text-white shadow-lg shadow-[#9B6BFF]/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-white font-display">
            StudyTrack
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-[#C4A7FF] transition">Features</a>
          <a href="#benefits" className="hover:text-[#C4A7FF] transition">Benefits</a>
          <a href="#pricing" className="hover:text-[#C4A7FF] transition">Pricing</a>
          <a href="#about" className="hover:text-[#C4A7FF] transition">About</a>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateToLogin}
            className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={onNavigateToRegister}
            className="gradient-btn-purple text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative pt-12 pb-20 px-6 lg:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Ambient Background Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#9B6BFF]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#FFBF69]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#9B6BFF]/10 border border-[#9B6BFF]/30 text-xs font-semibold text-[#C4A7FF]">
            <Sparkles className="w-3.5 h-3.5 text-[#FFBF69]" />
            <span>For Students, By Students</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight font-display">
            Make every <br />
            <span className="gradient-text-purple">study session</span> count.
          </h1>

          <p className="text-base text-slate-400 max-w-xl font-normal leading-relaxed">
            Organize assignments, manage deadlines, track your academic progress, and achieve more with StudyTrack's AI-powered productivity platform.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onNavigateToRegister}
              className="gradient-btn-purple px-6 py-3.5 rounded-2xl text-sm font-extrabold flex items-center space-x-2 cursor-pointer group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-200 bg-[#111522] hover:bg-[#191B2B] border border-[#191B2B] hover:border-[#9B6BFF]/30 transition flex items-center space-x-2.5 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#9B6BFF]/20 flex items-center justify-center text-[#C4A7FF]">
                <Play className="w-3 h-3 fill-[#C4A7FF]" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Verified Platform Capabilities */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#191B2B]">
            <div>
              <p className="text-2xl font-black text-white font-display">100%</p>
              <p className="text-xs text-slate-400 font-medium">Real-Time Sync</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white font-display">AI</p>
              <p className="text-xs text-slate-400 font-medium">Study Assistant</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white font-display">Google</p>
              <p className="text-xs text-slate-400 font-medium">Calendar Integration</p>
            </div>
          </div>
        </div>

        {/* Hero Right: 3D Floating Academic Scene Illustration */}
        <div className="lg:col-span-6 relative flex justify-center">
          <div className="relative w-full max-w-lg aspect-square rounded-3xl p-6 bg-gradient-to-b from-[#111522]/90 to-[#090B12]/90 border border-[#9B6BFF]/20 shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Interactive Floating Canvas Mockup */}
            <div className="absolute inset-0 bg-[radial-gradient(#9b6bff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {/* Floating Top Card */}
            <div className="relative z-10 self-end bg-[#191B2B]/90 backdrop-blur-md p-4 rounded-2xl border border-[#9B6BFF]/30 shadow-lg w-64 transform hover:-translate-y-1 transition">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">DBMS Project Report</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">Completed Today</p>
                </div>
              </div>
              <div className="w-full bg-[#111522] rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full w-full" />
              </div>
            </div>

            {/* Central Floating Book & Orbit Ring Artwork */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-6">
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-[#9B6BFF]/30 to-[#FFBF69]/20 flex items-center justify-center border border-[#9B6BFF]/40 violet-glow animate-pulse-glow">
                <div className="w-24 h-24 rounded-2xl bg-[#9B6BFF] flex items-center justify-center text-white shadow-xl shadow-[#9B6BFF]/40 transform -rotate-6">
                  <GraduationCap className="w-12 h-12" />
                </div>
                <div className="absolute -top-3 -right-3 bg-[#FFBF69] text-[#090B12] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                  AI Active
                </div>
              </div>
            </div>

            {/* Floating Bottom Analytics Card */}
            <div className="relative z-10 bg-[#191B2B]/90 backdrop-blur-md p-4 rounded-2xl border border-[#9B6BFF]/30 shadow-lg w-72 transform hover:translate-y-1 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Weekly Focus Goal</span>
                <span className="text-xs font-bold text-[#C4A7FF]">88% Done</span>
              </div>
              <div className="w-full bg-[#111522] rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#9B6BFF] to-[#FFBF69] h-full w-[88%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Feature Highlights */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-[#111522]/50 border-t border-[#191B2B]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold text-[#C4A7FF] tracking-widest uppercase">Everything You Need</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              Designed for serious academic success.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Streamline your coursework, track assignment deadlines, and analyze your habits in one unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-[#191B2B] hover:border-[#9B6BFF]/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-[#9B6BFF]/20 text-[#C4A7FF] flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Study Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get instant step-by-step explanations, study roadmaps, and instant answers tailored to your syllabus.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4 border border-[#191B2B] hover:border-[#9B6BFF]/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-[#FFBF69]/20 text-[#FFBF69] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Google Calendar Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically synchronize your task deadlines and exam schedules with your personal Google Calendar.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4 border border-[#191B2B] hover:border-[#9B6BFF]/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Productivity Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualize completion trends, subject time distributions, and track your daily study efficiency over time.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4 border border-[#191B2B] hover:border-[#9B6BFF]/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Cloud Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stay updated across all devices with instant cloud sync, overdue alerts, and smart reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B12]/80 backdrop-blur-md">
          <div className="bg-[#111522] border border-[#9B6BFF]/30 rounded-3xl p-6 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">StudyTrack Walkthrough Demo</h3>
            <p className="text-xs text-slate-400">
              StudyTrack empowers students to master task scheduling, AI tutoring, calendar sync, and performance analytics.
            </p>
            <div className="p-8 bg-[#191B2B] rounded-2xl border border-[#191B2B]">
              <GraduationCap className="w-12 h-12 text-[#9B6BFF] mx-auto animate-bounce" />
              <p className="text-xs text-slate-300 font-semibold mt-2">Ready to explore? Create a free account now.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2 bg-[#191B2B] hover:bg-[#191B2B]/80 text-xs font-bold text-slate-300 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => { setDemoModalOpen(false); onNavigateToRegister(); }}
                className="gradient-btn-purple px-4 py-2 text-xs font-bold rounded-xl"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 lg:px-12 border-t border-[#191B2B] bg-[#090B12] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-[#9B6BFF]" />
          <span className="font-bold text-slate-300">StudyTrack Platform</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex space-x-6">
          <a href="#privacy" className="hover:text-slate-300 transition">Privacy Policy</a>
          <a href="#terms" className="hover:text-slate-300 transition">Terms of Service</a>
          <a href="#support" className="hover:text-slate-300 transition">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
