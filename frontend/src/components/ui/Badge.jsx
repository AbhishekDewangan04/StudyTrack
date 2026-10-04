const Badge = ({
  children,
  variant = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'sky'
  size = 'md', // 'sm' | 'md'
  icon: Icon = null,
  className = '',
}) => {
  const variantStyles = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-[11px] gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
