import { useState } from 'react';
import { Settings, Bell, Layout, Save, Check } from 'lucide-react';
import Button from './ui/Button';

const SettingsView = ({ viewMode, onViewModeChange }) => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-1 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Dashboard & Account Preferences</span>
        </h2>
        <p className="text-xs text-slate-500">Customize how StudyTrack displays your tasks and sends notifications.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Display Settings */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Layout className="w-4 h-4 text-indigo-600" />
            <span>Default Layout & Views</span>
          </h3>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-slate-900">Default Task View Mode</label>
              <p className="text-[11px] text-slate-500">Choose between Grid Cards or Table view layout for assignments.</p>
            </div>
            <select
              value={viewMode}
              onChange={(e) => onViewModeChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="grid">Grid Layout</option>
              <option value="table">Table Layout</option>
            </select>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>Notification & Warning Toggles</span>
          </h3>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Overdue Deadline Badges</span>
                <span className="text-[11px] text-slate-500">Highlight past-due tasks in red with urgency alerts.</span>
              </div>
              <input
                type="checkbox"
                checked={overdueAlerts}
                onChange={(e) => setOverdueAlerts(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Study Digest & Due Soon Summaries</span>
                <span className="text-[11px] text-slate-500">Display due soon warnings in header notification bell.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <Button
            type="submit"
            variant="primary"
            icon={saved ? Check : Save}
          >
            {saved ? 'Preferences Saved!' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
