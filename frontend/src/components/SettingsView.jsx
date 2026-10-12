import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Bell, Layout, Save, Check, AlertCircle, Sparkles } from 'lucide-react';

const SettingsView = ({ viewMode, onViewModeChange }) => {
  const { user, updatePreferences } = useAuth();

  const [taskLayout, setTaskLayout] = useState(
    user?.preferences?.defaultTaskLayout || viewMode || 'table'
  );
  const [overdueAlerts, setOverdueAlerts] = useState(
    user?.preferences?.overdueAlerts ?? true
  );
  const [emailAlerts, setEmailAlerts] = useState(
    user?.preferences?.emailAlerts ?? true
  );
  const [taskReminders, setTaskReminders] = useState(
    user?.preferences?.taskReminders ?? true
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when authenticated user data is loaded or refreshed
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.defaultTaskLayout) {
        setTaskLayout(user.preferences.defaultTaskLayout);
      }
      if (user.preferences.overdueAlerts !== undefined) {
        setOverdueAlerts(user.preferences.overdueAlerts);
      }
      if (user.preferences.emailAlerts !== undefined) {
        setEmailAlerts(user.preferences.emailAlerts);
      }
      if (user.preferences.taskReminders !== undefined) {
        setTaskReminders(user.preferences.taskReminders);
      }
    }
  }, [user]);

  const handleLayoutChange = (newLayout) => {
    setTaskLayout(newLayout);
    if (onViewModeChange) {
      onViewModeChange(newLayout);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updatePreferences({
        defaultTaskLayout: taskLayout,
        overdueAlerts,
        emailAlerts,
        taskReminders,
      });

      if (onViewModeChange) {
        onViewModeChange(taskLayout);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to save preferences. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3 font-display">
          <Settings className="w-6 h-6 text-[#9B6BFF] shrink-0" />
          <span>App & Interface Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
          Customize your Midnight Purple experience and notification defaults
        </p>
      </div>

      {/* Visible Feedback Banners */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-2xl flex items-center space-x-2.5 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center space-x-2.5 shadow-lg animate-fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Preferences saved successfully! Your settings persist across sessions.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance & Layout Settings */}
        <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-display">
            <Layout className="w-4 h-4 text-[#9B6BFF]" />
            <span>Appearance & View Layout</span>
          </h3>

          <div className="space-y-4 pt-2 border-t border-[#111522]">
            {/* Task Layout Selection */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <label className="text-xs font-bold text-white">Default Task Layout</label>
                <p className="text-[11px] text-slate-400">Choose between Table View or Grid Cards layout for tasks.</p>
              </div>
              <select
                value={taskLayout}
                onChange={(e) => handleLayoutChange(e.target.value)}
                className="px-3.5 py-2 bg-[#111522] border border-[#191B2B] rounded-xl text-xs font-semibold text-white outline-none focus:border-[#9B6BFF] cursor-pointer"
              >
                <option value="table">Table Layout</option>
                <option value="grid">Grid Layout</option>
              </select>
            </div>

            {/* Permanent Theme Indicator (Midnight Purple Only) */}
            <div className="flex items-center justify-between pt-3 border-t border-[#111522]">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#9B6BFF]" />
                  <span>Design Theme</span>
                </label>
                <p className="text-[11px] text-slate-400">Midnight Purple dark theme optimized for student focus</p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#111522] rounded-xl border border-[#9B6BFF]/30">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#9B6BFF] to-[#C4A7FF] shadow-sm shadow-[#9B6BFF]/50" />
                <span className="text-[11px] font-bold text-white">Midnight Purple (Active)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-display">
            <Bell className="w-4 h-4 text-[#9B6BFF]" />
            <span>Notification Badges & Alerts</span>
          </h3>

          <div className="space-y-3 pt-2 border-t border-[#111522]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Overdue Deadline Badges</span>
                <span className="text-[11px] text-slate-400">Highlight past-due tasks in rose with urgency alerts.</span>
              </div>
              <input
                type="checkbox"
                checked={overdueAlerts}
                onChange={(e) => setOverdueAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#9B6BFF] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#111522]">
              <div>
                <span className="text-xs font-bold text-white block">Header Notification Badges</span>
                <span className="text-[11px] text-slate-400">Display notification counts in header bell.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#9B6BFF] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#111522]">
              <div>
                <span className="text-xs font-bold text-white block">Task Reminder Notifications</span>
                <span className="text-[11px] text-slate-400">Receive alert cues before assignment deadlines.</span>
              </div>
              <input
                type="checkbox"
                checked={taskReminders}
                onChange={(e) => setTaskReminders(e.target.checked)}
                className="w-4 h-4 accent-[#9B6BFF] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="gradient-btn-purple font-bold text-xs px-6 py-3 rounded-xl cursor-pointer flex items-center space-x-2 shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
