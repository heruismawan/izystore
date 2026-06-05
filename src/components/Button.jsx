import React from 'react';

export const Button = ({
  children,
  onClick,
  variant = 'white', // 'yellow', 'green', 'blue', 'red', 'purple', 'white', 'black'
  size = 'md', // 'sm', 'md', 'lg'
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-bold uppercase tracking-wider border border-white/50 rounded-2xl transition-all duration-200 select-none';
  
  const disabledStyles = 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none';
  
  const activeStyles = disabled 
    ? '' 
    : 'hover:scale-[1.02] active:scale-[0.98] hover:brightness-[1.03] active:brightness-[0.97]';

  const variants = {
    yellow: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-white/50 dark:border-orange-900/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),_inset_0_-3px_5px_rgba(249,115,22,0.05),_0_6px_12px_-3px_rgba(249,115,22,0.15)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_4px_8px_rgba(249,115,22,0.08)]',
    green: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-white/50 dark:border-emerald-900/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),_inset_0_-3px_5px_rgba(16,185,129,0.05),_0_6px_12px_-3px_rgba(16,185,129,0.15)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_4px_8px_rgba(16,185,129,0.08)]',
    blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-white/50 dark:border-blue-900/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),_inset_0_-3px_5px_rgba(59,130,246,0.05),_0_6px_12px_-3px_rgba(59,130,246,0.15)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_4px_8px_rgba(59,130,246,0.08)]',
    red: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-white/50 dark:border-red-900/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),_inset_0_-3px_5px_rgba(239,68,68,0.05),_0_6px_12px_-3px_rgba(239,68,68,0.15)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_4px_8px_rgba(239,68,68,0.08)]',
    purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-white/50 dark:border-purple-900/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),_inset_0_-3px_5px_rgba(139,92,246,0.05),_0_6px_12px_-3px_rgba(139,92,246,0.15)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_4px_8px_rgba(139,92,246,0.08)]',
    white: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-white/50 dark:border-slate-700/60 shadow-[inset_0_3px_5px_rgba(255,255,255,0.8),_inset_0_-3px_5px_rgba(0,0,0,0.02),_0_6px_12px_-3px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),_0_4px_8px_rgba(0,0,0,0.25)]',
    black: 'bg-slate-800 dark:bg-orange-500 text-white dark:text-slate-950 border-white/20 dark:border-orange-400/20 shadow-[inset_0_3px_5px_rgba(255,255,255,0.2),_0_6px_12px_-3px_rgba(0,0,0,0.3)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(249,115,22,0.2)]'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-xl',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base rounded-3xl'
  };

  const selectedVariant = variants[variant] || variants.white;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${disabled ? disabledStyles : `${selectedVariant} ${activeStyles}`}
        ${selectedSize}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
