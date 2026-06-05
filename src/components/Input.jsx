import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={id} className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 pl-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon size={16} strokeWidth={2.5} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-semibold rounded-2xl border border-slate-200/30 dark:border-slate-700/40 
            shadow-[inset_0_2px_4px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] outline-none
            focus:bg-white dark:focus:bg-slate-800 focus:shadow-[inset_0_2px_4px_rgba(15,23,42,0.01),_0_0_0_4px_rgba(253,186,116,0.25)] dark:focus:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.3),_0_0_0_4px_rgba(249,115,22,0.25)] 
            transition-all duration-200
            placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs
            ${Icon ? 'pl-11' : ''}
            ${error ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.15)] dark:focus:shadow-[0_0_0_4px_rgba(239,68,68,0.25)]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mt-0.5 pl-1">{error}</span>}
    </div>
  );
};
export default Input;
