import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';

const Header = ({
  isSidebarCollapsed = false,
  onToggleCollapse,
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();
  const { connectionStatus } = useSocket();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Theme state initialized from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('studytrack_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studytrack_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studytrack_theme', 'light');
    }
  }, [isDarkMode]);

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 bg-[#F7F8FC]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/60 transition-colors">
      {/* Sidebar Collapse / Expand Control & Mobile Drawer Button */}
      <div className="flex items-center space-x-3">
        {/* Desktop Sidebar Collapse Toggle Icon */}
        <button
          onClick={onToggleCollapse}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="hidden md:flex p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-indigo-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right Controls: Socket Indicator, Theme Toggle Icon, User Avatar */}
      <div className="flex items-center space-x-3">
        {/* Real-time Socket Indicator badge */}
        <div
          title={`Socket status: ${connectionStatus}`}
          className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-2xs"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-amber-500'
            }`}
          />
          <span className="capitalize">{connectionStatus}</span>
        </div>

        {/* Theme Toggle Icon (Sun / Moon) */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
        </button>

        {/* User Avatar Circle */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
            className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs border border-indigo-400/30 cursor-pointer overflow-hidden"
          >
            {getInitials(user?.name)}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-modal z-50 p-2 space-y-1 text-xs text-slate-900">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.name || 'Abhishek Dewangan'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'abhishek@example.com'}</p>
              </div>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition cursor-pointer font-semibold"
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
