import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  MapPin,
  Clock,
  Bell,
  Crown,
  LogOut,
  X,
  GraduationCap,
  Bot,
  User,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  isCollapsed = false,
  overdueCount = 0,
  pendingCount = 0,
  unreadNotifCount = 0,
  onOpenProModal,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-bot', label: 'AI Assistant', icon: Bot },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'focus', label: 'Focus', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : null, isDangerBadge: true },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    if (tabId === 'pro' && onOpenProModal) {
      if (!user?.isPro) {
        onOpenProModal();
      }
    } else {
      setActiveTab(tabId);
    }
    if (onClose) onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderSidebarInner = (collapsed = false) => (
    <aside
      className={`bg-[#211B3A] border-r border-[#191B2B] flex flex-col h-full select-none text-slate-300 transition-all duration-300 ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Logo Header */}
      <div className={`p-5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => handleNavClick('overview')}
          title="StudyTrack"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#9B6BFF] flex items-center justify-center text-white shadow-lg shadow-[#9B6BFF]/30 group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight font-display">
                StudyTrack
              </span>
              <span className="text-[10px] font-semibold text-[#C4A7FF] tracking-widest uppercase">
                Productivity Hub
              </span>
            </div>
          )}
        </div>

        {onClose && !collapsed && (
          <button
            onClick={onClose}
            aria-label="Close sidebar menu"
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#191B2B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-2.5'
              } rounded-xl text-[14px] transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#9B6BFF]/15 text-white font-bold border border-[#9B6BFF]/40 shadow-sm shadow-[#9B6BFF]/10'
                  : 'text-slate-400 font-medium hover:text-slate-100 hover:bg-[#111522]'
              }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#9B6BFF]' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.isDangerBadge
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-[#9B6BFF]/20 text-[#C4A7FF] border border-[#9B6BFF]/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-2 pb-1">
          <div className="h-px bg-[#191B2B] my-1" />
        </div>

        {/* Upgrade to PRO Navigation Banner */}
        {!user?.isPro ? (
          <button
            onClick={() => handleNavClick('pro')}
            title={collapsed ? 'Upgrade to Pro' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-3.5 py-3'
            } rounded-xl text-[14px] font-extrabold text-[#FFBF69] bg-[#FFBF69]/10 hover:bg-[#FFBF69]/20 border border-[#FFBF69]/30 transition cursor-pointer`}
          >
            <Crown className="w-5 h-5 text-[#FFBF69] fill-[#FFBF69]/30 shrink-0" />
            {!collapsed && <span>Upgrade to Pro</span>}
          </button>
        ) : (
          <div
            title={collapsed ? 'Pro Active' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-3.5 py-2.5'
            } rounded-xl text-[13px] font-extrabold text-[#FFBF69] bg-[#FFBF69]/10 border border-[#FFBF69]/30`}
          >
            <Crown className="w-5 h-5 text-[#FFBF69] fill-[#FFBF69]/30 shrink-0" />
            {!collapsed && <span>PRO Plan Active</span>}
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#191B2B] bg-[#211B3A]">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl bg-[#191B2B] border border-[#191B2B]`}>
          <div className={`flex items-center ${collapsed ? '' : 'space-x-3'} overflow-hidden`}>
            <div
              className="w-8 h-8 rounded-full bg-[#9B6BFF] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#C4A7FF]/40 shadow-sm"
              title={collapsed ? `${user?.name || 'User'} (${user?.isPro ? 'Pro' : 'Free'})` : undefined}
            >
              {getInitials(user?.name)}
            </div>
            {!collapsed && (
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Student'}</p>
                <p className={`text-[11px] truncate ${user?.isPro ? 'text-[#FFBF69] font-bold' : 'text-slate-400 font-medium'}`}>
                  {user?.isPro ? 'Pro Plan' : 'Free Account'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              title="Log Out"
              aria-label="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Dark Sidebar */}
      <div
        className={`hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        {renderSidebarInner(isCollapsed)}
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#090B12]/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 w-[260px] max-w-[80vw] h-full shadow-2xl">
            {renderSidebarInner(false)}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
