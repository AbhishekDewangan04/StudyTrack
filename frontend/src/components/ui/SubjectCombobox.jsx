import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const DEFAULT_SUBJECT_SUGGESTIONS = [
  'Data Structures',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Theory of Computation',
  'Mathematics',
  'Machine Learning',
  'Web Development',
  'UI/UX Design',
  'Personal',
  'Project Work',
  'Gym',
];

const SubjectCombobox = ({
  value = '',
  onChange,
  existingTasks = [],
  disabled = false,
  placeholder = 'Type any subject...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);

  // Sync internal input value when external value prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Dynamically extract all unique subject strings from user tasks + defaults
  const suggestions = useMemo(() => {
    const taskSubjects = existingTasks
      .map((t) => t.subject)
      .filter((s) => s && typeof s === 'string' && s.trim().length > 0);

    const set = new Set([...taskSubjects, ...DEFAULT_SUBJECT_SUGGESTIONS]);
    return Array.from(set);
  }, [existingTasks]);

  // Filter suggestions based on typed input
  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return suggestions;
    const query = inputValue.toLowerCase().trim();
    return suggestions.filter((s) => s.toLowerCase().includes(query));
  }, [inputValue, suggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    onChange(newVal);
    setIsOpen(true);
  };

  const handleSelectSuggestion = (subject) => {
    setInputValue(subject);
    onChange(subject);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs disabled:bg-slate-50 disabled:text-slate-500"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          tabIndex={-1}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && !disabled && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-52 bg-white border border-slate-200 rounded-2xl shadow-modal z-50 overflow-y-auto p-1 text-xs text-slate-800 space-y-0.5">
          {filteredSuggestions.map((subj) => {
            const isSelected = subj.toLowerCase() === inputValue.toLowerCase().trim();
            return (
              <button
                key={subj}
                type="button"
                onClick={() => handleSelectSuggestion(subj)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-600 font-bold'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="truncate">{subj}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectCombobox;

