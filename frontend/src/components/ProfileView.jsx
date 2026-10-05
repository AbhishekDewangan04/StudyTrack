import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Calendar, Crown, Shield, Palette, Check } from 'lucide-react';

const ProfileView = ({ stats }) => {
  const { user } = useAuth();
  const [activeSubSection, setActiveSubSection] = useState('notifications');
  const [emailInput, setEmailInput] = useState(user?.email || 'abhishek@example.com');
  const [savedMsg, setSavedMsg] = useState(null);

  // Toggle state matching reference screen
  const [prefs, setPrefs] = useState({
    taskReminders: true,
    overdueTasks: true,
    weeklySummary: true,
    productUpdates: false,
  });

  const getInitials = (name) => {
    if (!name) return 'A';
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

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    setSavedMsg('Notification email updated successfully!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const subNavItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'calendar', label: 'Calendar Sync', icon: Calendar },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Manage your account and preferences.
        </p>

        {/* User Card Header */}
        <div className="mt-6 flex items-center space-x-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center border-2 border-white shadow-2xs">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {user?.name || 'Abhishek Dewangan'}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'abhishek@example.com'}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            user?.isPro
              ? 'bg-amber-500/20 text-amber-600 border border-amber-300'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
          }`}>
            {user?.isPro ? 'PRO ACTIVE 🎉' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* Two Column Layout (Matching Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sub-Nav List (1 Col LG) */}
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-card space-y-1 h-fit">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel (3 Cols LG) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Notification Preferences
            </h3>
          </div>

          {savedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{savedMsg}</span>
            </div>
          )}

          {/* Toggle Options */}
          <div className="space-y-5">
            {/* Toggle 1: Task Reminders */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Task Reminders</p>
                <p className="text-[11px] text-slate-400 font-medium">Get notified before deadline</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('taskReminders')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  prefs.taskReminders ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>

            {/* Toggle 2: Overdue Tasks */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Overdue Tasks</p>
                <p className="text-[11px] text-slate-400 font-medium">Get notified about overdue tasks</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('overdueTasks')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  prefs.overdueTasks ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>

            {/* Toggle 3: Weekly Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Weekly Summary</p>
                <p className="text-[11px] text-slate-400 font-medium">Receive weekly progress report</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('weeklySummary')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  prefs.weeklySummary ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>

            {/* Toggle 4: Product Updates */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Product Updates</p>
                <p className="text-[11px] text-slate-400 font-medium">Stay updated with new features</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('productUpdates')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  prefs.productUpdates ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>
          </div>

          {/* Email Address Update Input */}
          <form onSubmit={handleUpdateEmail} className="pt-4 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-800">
              Email Address
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
