import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Calendar, Crown, Shield, Palette, Check } from 'lucide-react';

const ProfileView = ({ stats }) => {
  const { user } = useAuth();
  const [activeSubSection, setActiveSubSection] = useState('notifications');
  const [nameInput, setNameInput] = useState(user?.name || 'Student');
  const [emailInput, setEmailInput] = useState(user?.email || 'student@studytrack.io');
  const [savedMsg, setSavedMsg] = useState(null);

  const [prefs, setPrefs] = useState({
    taskReminders: true,
    overdueTasks: true,
    weeklySummary: true,
    productUpdates: false,
  });

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleToggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSavedMsg('Profile updated successfully!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const subNavItems = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'notifications', label: 'Notification Settings', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Your Profile & Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
          Manage your personal information and preferences
        </p>

        {/* User Avatar Card Header (Matching Section 9 of reference image) */}
        <div className="mt-6 flex items-center space-x-4 p-4 bg-[#111522] border border-[#191B2B] rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-[#9B6BFF] text-white font-black text-lg flex items-center justify-center border-2 border-[#C4A7FF]/40 shadow-lg shrink-0 font-display">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate font-display">
              {user?.name || 'Abhishek Dewangan'}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {user?.email || 'abhishek@example.com'}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            user?.isPro
              ? 'bg-[#FFBF69]/20 text-[#FFBF69] border border-[#FFBF69]/40'
              : 'bg-[#9B6BFF]/20 text-[#C4A7FF] border border-[#9B6BFF]/30'
          }`}>
            {user?.isPro ? 'PRO MEMBER 🎉' : 'Free Account'}
          </span>
        </div>
      </div>

      {/* Two Column Layout (Matching Reference Image Section 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sub-Nav List */}
        <div className="bg-[#191B2B] border border-[#191B2B] p-3 rounded-2xl shadow-xl space-y-1 h-fit">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#9B6BFF]/20 text-white font-bold border border-[#9B6BFF]/40'
                    : 'text-slate-400 hover:text-white hover:bg-[#111522]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#9B6BFF]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-[#111522] pb-4">
            <h3 className="text-sm font-bold text-white font-display">
              {activeSubSection === 'profile' && 'Personal Profile'}
              {activeSubSection === 'notifications' && 'Notification Preferences'}
              {activeSubSection === 'security' && 'Account Security'}
            </h3>
          </div>

          {savedMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{savedMsg}</span>
            </div>
          )}

          {activeSubSection === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090B12] border border-[#111522] rounded-xl text-white outline-none focus:border-[#9B6BFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090B12] border border-[#111522] rounded-xl text-white outline-none focus:border-[#9B6BFF]"
                />
              </div>

              <button
                type="submit"
                className="gradient-btn-purple px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer shadow-md"
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {activeSubSection === 'notifications' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Task Reminders</p>
                  <p className="text-[11px] text-slate-400">Get notified before deadlines</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('taskReminders')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    prefs.taskReminders ? 'bg-[#9B6BFF] justify-end' : 'bg-[#111522] justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Overdue Alerts</p>
                  <p className="text-[11px] text-slate-400">Immediate warnings for overdue tasks</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('overdueTasks')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    prefs.overdueTasks ? 'bg-[#9B6BFF] justify-end' : 'bg-[#111522] justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          )}

          {activeSubSection === 'security' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p className="font-bold text-white">Authentication & Session</p>
              <p className="text-slate-400">Your session is secured with JWT Token authentication. Logging out clears active local tokens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
