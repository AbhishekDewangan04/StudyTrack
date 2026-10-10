import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Menu,
  LogOut,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';

const Header = ({
  isSidebarCollapsed = false,
  onToggleCollapse,
  onToggleSidebar,
  activeTab = 'overview',
}) => {
  const { user, logout } = useAuth();
  const { connectionStatus } = useSocket();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Dashboard Overview';
      case 'tasks': return 'My Tasks & Assignments';
      case 'calendar': return 'Academic Calendar';
      case 'analytics': return 'Productivity Analytics';
      case 'ai-bot': return 'AI Study Assistant';
      case 'locations': return 'Study Locations';
      case 'focus': return 'Focus Session';
      case 'notifications': return 'Notifications';
      case 'profile': return 'User Profile';
      case 'settings': return 'App Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#090B12]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#191B2B] transition-colors">
      {/* Left Section: Sidebar Controls & Title */}
      <div className="flex items-center space-x-3">
        {/* Sidebar Expand/Collapse button */}
        <button
          onClick={onToggleCollapse}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="hidden md:flex p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#191B2B] transition cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-[#9B6BFF]" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Mobile Menu button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#191B2B] transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight hidden sm:block font-display">
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {/* Right Section: Socket status, AI badge, User Menu */}
      <div className="flex items-center space-x-3">
        {/* Real-time Socket Indicator */}
        <div
          title={`Socket status: ${connectionStatus}`}
          className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#111522] border border-[#191B2B] text-slate-400"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="capitalize">{connectionStatus}</span>
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-8 h-8 rounded-full bg-[#9B6BFF] text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-[#9B6BFF]/20 border border-[#C4A7FF]/40 cursor-pointer overflow-hidden transition hover:scale-105"
          >
            {getInitials(user?.name)}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#111522] border border-[#191B2B] rounded-2xl shadow-2xl z-50 p-2 space-y-1 text-xs text-slate-200 animate-fade-in">
              <div className="px-3 py-2 border-b border-[#191B2B]">
                <p className="font-bold text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'student@studytrack.io'}</p>
                {user?.isPro && (
                  <span className="inline-block mt-1 text-[9px] font-extrabold text-[#FFBF69] bg-[#FFBF69]/10 px-2 py-0.5 rounded-full border border-[#FFBF69]/30">
                    PRO MEMBER
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 transition cursor-pointer font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
