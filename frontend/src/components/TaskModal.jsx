import { useState, useEffect } from 'react';
import { X, MapPin, FileText, Calendar, Repeat, Globe, Crown } from 'lucide-react';
import { buildGoogleMapsUrl } from '../utils/maps';
import SubjectCombobox from './ui/SubjectCombobox';
import { useAuth } from '../context/AuthContext';

const TaskModal = ({ isOpen, onClose, mode = 'create', initialData = null, onSubmit, existingTasks = [], onOpenProModal }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('basic'); // 'basic' or 'location'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: initialData?.subject || '',
    deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : '',
    status: initialData?.status || 'Pending',
    isRecurring: !!initialData?.isRecurring,
    recurrenceType: initialData?.recurrenceType || 'none',
    recurrenceEndDate: initialData?.recurrenceEndDate ? new Date(initialData.recurrenceEndDate).toISOString().slice(0, 10) : '',
    locationName: initialData?.locationName || '',
    locationAddress: initialData?.locationAddress || '',
    locationLatitude: initialData?.locationLatitude !== null && initialData?.locationLatitude !== undefined ? String(initialData.locationLatitude) : '',
    locationLongitude: initialData?.locationLongitude !== null && initialData?.locationLongitude !== undefined ? String(initialData.locationLongitude) : '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        subject: initialData.subject || '',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : '',
        status: initialData.status || 'Pending',
        isRecurring: !!initialData.isRecurring,
        recurrenceType: initialData.recurrenceType || 'none',
        recurrenceEndDate: initialData.recurrenceEndDate ? new Date(initialData.recurrenceEndDate).toISOString().slice(0, 10) : '',
        locationName: initialData.locationName || '',
        locationAddress: initialData.locationAddress || '',
        locationLatitude: initialData.locationLatitude !== null && initialData.locationLatitude !== undefined ? String(initialData.locationLatitude) : '',
        locationLongitude: initialData.locationLongitude !== null && initialData.locationLongitude !== undefined ? String(initialData.locationLongitude) : '',
      });
    } else {
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date(Date.now() + 86400000);
      tomorrow.setHours(10, 0, 0, 0);

      setFormData({
        title: '',
        description: '',
        subject: '',
        deadline: tomorrow.toISOString().slice(0, 16),
        status: 'Pending',
        isRecurring: false,
        recurrenceType: 'none',
        recurrenceEndDate: '',
        locationName: '',
        locationAddress: '',
        locationLatitude: '',
        locationLongitude: '',
      });
    }
    setActiveSubTab('basic');
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'recurrenceType') {
      setFormData((prev) => ({
        ...prev,
        recurrenceType: value,
        isRecurring: value !== 'none',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please enter a task title');
      return;
    }
    if (!formData.deadline) {
      setError('Please set a deadline date and time');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        locationLatitude: formData.locationLatitude !== '' ? parseFloat(formData.locationLatitude) : null,
        locationLongitude: formData.locationLongitude !== '' ? parseFloat(formData.locationLongitude) : null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Error submitting task modal:', err);
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const isViewMode = mode === 'view';
  const mapsUrl = initialData ? initialData.googleMapsUrl || buildGoogleMapsUrl(initialData) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-modal z-10 overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            {isViewMode ? 'Task Details' : mode === 'edit' ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs (Basic Details / Study Location) */}
        <div className="px-6 pt-4 flex justify-center">
          <div className="bg-slate-100/80 p-1 rounded-2xl inline-flex space-x-1 border border-slate-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSubTab('basic')}
              className={`px-5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'basic'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Basic Details
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('location')}
              className={`px-5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'location'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study Location
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {activeSubTab === 'basic' ? (
            <div className="space-y-4">
              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. DSA Assignment"
                  disabled={isViewMode}
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Add task description..."
                  disabled={isViewMode}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs resize-none"
                />
              </div>

              {/* Subject & Deadline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Subject
                  </label>
                  <SubjectCombobox
                    value={formData.subject}
                    disabled={isViewMode}
                    onChange={(val) => setFormData((prev) => ({ ...prev, subject: val }))}
                    existingTasks={existingTasks}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    disabled={isViewMode}
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                  />
                </div>
              </div>

              {/* Repeat Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Repeat
                  </label>
                  {!user?.isPro && (
                    <span
                      onClick={onOpenProModal}
                      className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Crown className="w-3 h-3 text-amber-500 fill-amber-400/30" /> PRO Feature
                    </span>
                  )}
                </div>
                <select
                  name="recurrenceType"
                  disabled={isViewMode}
                  value={formData.recurrenceType}
                  onChange={(e) => {
                    if (!user?.isPro && e.target.value !== 'none') {
                      if (onOpenProModal) onOpenProModal();
                      return;
                    }
                    handleChange(e);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily {!user?.isPro ? '(PRO)' : ''}</option>
                  <option value="weekly">Weekly {!user?.isPro ? '(PRO)' : ''}</option>
                  <option value="monthly">Monthly {!user?.isPro ? '(PRO)' : ''}</option>
                </select>
              </div>

              {formData.recurrenceType !== 'none' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Recurrence End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="recurrenceEndDate"
                    disabled={isViewMode}
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Location Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Location Name
                </label>
                <input
                  type="text"
                  name="locationName"
                  placeholder="e.g. Central Library"
                  disabled={isViewMode}
                  value={formData.locationName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Location Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Address / Campus
                </label>
                <input
                  type="text"
                  name="locationAddress"
                  placeholder="e.g. NIT Raipur, GE Road"
                  disabled={isViewMode}
                  value={formData.locationAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="locationLatitude"
                    placeholder="21.2497"
                    disabled={isViewMode}
                    value={formData.locationLatitude}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="locationLongitude"
                    placeholder="81.6050"
                    disabled={isViewMode}
                    value={formData.locationLongitude}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Google Maps Link Preview */}
              {mapsUrl && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-indigo-700 font-semibold">
                    <MapPin className="w-4 h-4" />
                    <span>Google Maps Link Ready</span>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                  >
                    Open Maps
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
