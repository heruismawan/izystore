import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  headerBg = 'bg-white', // 'bg-neoYellow', 'bg-neoGreen', etc. (automatically pastel now)
  headerAction,
  className = '',
  bodyClassName = 'p-5',
  ...props
}) => {
  return (
    <div 
      className={`bg-white dark:bg-slate-900/90 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark flex flex-col overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${headerBg} dark:bg-slate-900/50`}>
          <div className="text-left">
            {title && <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200">{title}</h3>}
            {subtitle && <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center w-full md:w-auto overflow-x-auto scrollbar-none">{headerAction}</div>}
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};
export default Card;
