import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md', // 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-2xl'
  className = ''
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`
          relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-3xl border border-white/80 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark-lg z-10 flex flex-col 
          overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all duration-300 ${className}
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-orange-100/70 dark:bg-orange-950/20 border-b border-slate-100 dark:border-slate-800/40 flex justify-between items-center">
          <h2 className="font-extrabold text-xs uppercase tracking-widest text-orange-700 dark:text-orange-400 m-0">
            {title || 'Dialog'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] text-left dark:text-slate-200">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/40 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
export default Modal;
