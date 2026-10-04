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
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'focus', label: 'Focus', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : null, isDangerBadge: true },
    { id: 'ai-bot', label: 'AI Bot', icon: Bot },
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
      className={`bg-[#0F172A] border-r border-slate-800/80 flex flex-col h-full select-none text-slate-300 transition-all duration-300 ${
        collapsed ? 'w-[76px]' : 'w-[270px]'
      }`}
    >
      {/* Brand Logo Header */}
      <div className={`p-5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => handleNavClick('overview')}
          title="StudyTrack"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          {!collapsed && (
            <span className="text-xl font-black text-white tracking-tight">
              StudyTrack
            </span>
          )}
        </div>

        {onClose && !collapsed && (
          <button
            onClick={onClose}
            aria-label="Close sidebar menu"
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Navigation Links */}
      <div className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-0 py-3' : 'justify-between px-4 py-3'
              } rounded-2xl text-[15px] transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#3B82F6]/20 text-white font-bold border border-[#3B82F6]/40 shadow-xs'
                  : 'text-slate-300 font-semibold hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'space-x-3.5'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#3B82F6]' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    item.isDangerBadge
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-2 pb-1">
          <div className="h-px bg-slate-800/80 my-1.5" />
        </div>

        {/* PRO Navigation Item */}
        {!user?.isPro ? (
          <button
            onClick={() => handleNavClick('pro')}
            title={collapsed ? 'Upgrade to PRO' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-0 py-3' : 'space-x-3.5 px-4 py-3'
            } rounded-2xl text-[15px] font-extrabold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer`}
          >
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400/30 shrink-0" />
            {!collapsed && <span>Upgrade to PRO</span>}
          </button>
        ) : (
          <div
            title={collapsed ? 'PRO Active' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-0 py-3' : 'space-x-3.5 px-4 py-3'
            } rounded-2xl text-[14px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30`}
          >
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400/30 shrink-0" />
            {!collapsed && <span>PRO ACTIVE</span>}
          </div>
        )}
      </div>

      {/* User Profile Footer Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2 rounded-2xl bg-slate-800/50 border border-slate-800`}>
          <div className={`flex items-center ${collapsed ? '' : 'space-x-3'} overflow-hidden`}>
            <div
              className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0 border-2 border-indigo-400/30"
              title={collapsed ? `${user?.name || 'User'} (${user?.isPro ? 'PRO' : 'Free'})` : undefined}
            >
              {getInitials(user?.name)}
            </div>
            {!collapsed && (
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Abhishek Dewangan'}</p>
                <p className={`text-[11px] truncate ${user?.isPro ? 'text-amber-400 font-extrabold' : 'text-slate-400 font-medium'}`}>
                  {user?.isPro ? 'PRO ACTIVE' : 'Free Plan'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              title="Log Out"
              aria-label="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
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
          isCollapsed ? 'w-[76px]' : 'w-[270px]'
        }`}
      >
        {renderSidebarInner(isCollapsed)}
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 w-[270px] max-w-[80vw] h-full shadow-2xl">
            {renderSidebarInner(false)}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
