const Card = ({
  children,
  className = '',
  header = null,
  footer = null,
  hover = false,
  padding = true,
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-sm transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        hover ? 'hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60' : ''
      } ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={`${padding ? 'p-5 sm:p-6' : ''} flex-1`}>{children}</div>
      {footer && (
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
