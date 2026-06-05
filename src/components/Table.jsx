import React from 'react';

export const Table = ({
  headers = [],
  rows = [], // Array of row items (objects)
  renderRow, // Function: (row, index) => <tr key={...}>...</tr>
  emptyMessage = 'Tidak ada data ditemukan.',
  className = '',
  headerBg = 'bg-emerald-100/70 text-emerald-800'
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-[0_4px_12px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 ${className}`}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 transition-colors duration-300">
          <thead>
            <tr className={`${headerBg} dark:bg-slate-950 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/40`}>
              {headers.map((header, idx) => (
                <th 
                  key={idx} 
                  className="px-4 py-3 font-extrabold text-[10px] uppercase tracking-widest border-r border-slate-200/30 dark:border-slate-800/30 last:border-r-0"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {rows.length > 0 ? (
              rows.map((row, index) => renderRow(row, index))
            ) : (
              <tr>
                <td 
                  colSpan={headers.length} 
                  className="px-4 py-8 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Table;
