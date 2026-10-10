import { useState } from 'react';
import { Settings, Bell, Layout, Save, Check, Palette } from 'lucide-react';

const SettingsView = ({ viewMode, onViewModeChange }) => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [accentColor, setAccentColor] = useState('violet'); // 'violet', 'amber', 'cyan'
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3 font-display">
          <Settings className="w-6 h-6 text-[#9B6BFF] shrink-0" />
          <span>App & Interface Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Customize your Midnight Purple experience and notification defaults</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance & Layout Settings (Section 10 of reference image) */}
        <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-display">
            <Layout className="w-4 h-4 text-[#9B6BFF]" />
            <span>Appearance & View Layout</span>
          </h3>

          <div className="space-y-4 pt-2 border-t border-[#111522]">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-white">Default Task Layout</label>
                <p className="text-[11px] text-slate-400">Choose between Table View or Grid Cards layout for tasks.</p>
              </div>
              <select
                value={viewMode}
                onChange={(e) => onViewModeChange(e.target.value)}
                className="px-3.5 py-2 bg-[#111522] border border-[#191B2B] rounded-xl text-xs text-white outline-none focus:border-[#9B6BFF] cursor-pointer"
              >
                <option value="table">Table Layout</option>
                <option value="grid">Grid Layout</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#111522]">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-white">Theme Palette Accent</label>
                <p className="text-[11px] text-slate-400">Midnight Purple active accent highlight</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAccentColor('violet')}
                  className={`w-6 h-6 rounded-full bg-[#9B6BFF] cursor-pointer border-2 ${
                    accentColor === 'violet' ? 'border-white scale-110' : 'border-transparent opacity-70'
                  }`}
                  title="Electric Violet"
                />
                <button
                  type="button"
                  onClick={() => setAccentColor('amber')}
                  className={`w-6 h-6 rounded-full bg-[#FFBF69] cursor-pointer border-2 ${
                    accentColor === 'amber' ? 'border-white scale-110' : 'border-transparent opacity-70'
                  }`}
                  title="Warm Amber"
                />
                <button
                  type="button"
                  onClick={() => setAccentColor('cyan')}
                  className={`w-6 h-6 rounded-full bg-cyan-400 cursor-pointer border-2 ${
                    accentColor === 'cyan' ? 'border-white scale-110' : 'border-transparent opacity-70'
                  }`}
                  title="Cyan"
                />
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
                <span className="text-xs font-bold text-white block">Real-time Header Notifications</span>
                <span className="text-[11px] text-slate-400">Display live WebSocket notification counts in header bell.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#9B6BFF] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="gradient-btn-purple font-bold text-xs px-6 py-3 rounded-xl cursor-pointer flex items-center space-x-2 shadow-lg"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
