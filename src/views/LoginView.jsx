import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, Lock, User, AlertCircle, ArrowLeft, Sun, Moon, Check, Delete } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const LoginView = () => {
  const { usersList, setCurrentUser, theme, toggleTheme } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Reset PIN when selected user changes
  useEffect(() => {
    setPin('');
    setError('');
    setIsSuccess(false);
    setIsShaking(false);
  }, [selectedUser]);

  // Handle number click on PIN Pad
  const handleNumberClick = (num) => {
    if (pin.length < 4 && !isSuccess) {
      setError('');
      const newPin = pin + num;
      setPin(newPin);

      // Auto check when pin length reaches 4
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    if (pin.length > 0 && !isSuccess) {
      setError('');
      setPin(pin.slice(0, -1));
    }
  };

  // Handle Clear
  const handleClear = () => {
    if (!isSuccess) {
      setPin('');
      setError('');
    }
  };

  // Verify Pin
  const verifyPin = (enteredPin) => {
    if (selectedUser.pin === enteredPin) {
      setIsSuccess(true);
      setError('');
      
      // Delay transition to dashboard for the premium ripple/check effect
      setTimeout(() => {
        setCurrentUser(selectedUser);
      }, 700);
    } else {
      setIsShaking(true);
      setError('PIN Otorisasi Salah!');
      
      // Shake for 400ms, then reset pin
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 400);
    }
  };

  // Get user role styling
  const getRoleStyle = (role) => {
    switch (role) {
      case 'owner':
        return {
          bg: 'bg-orange-100 dark:bg-orange-950/40',
          text: 'text-orange-700 dark:text-orange-400',
          avatarBg: 'bg-gradient-to-br from-orange-400 to-amber-500 text-white'
        };
      case 'admin':
        return {
          bg: 'bg-sky-100 dark:bg-sky-950/40',
          text: 'text-sky-700 dark:text-sky-400',
          avatarBg: 'bg-gradient-to-br from-sky-400 to-blue-500 text-white'
        };
      default:
        return {
          bg: 'bg-purple-100 dark:bg-purple-950/40',
          text: 'text-purple-700 dark:text-purple-400',
          avatarBg: 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white'
        };
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-400/20 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism POS Container */}
      <div className="w-full max-w-md p-8 bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark-lg backdrop-blur-xl rounded-3xl relative z-10 flex flex-col justify-between min-h-[580px] transition-all duration-300 select-none">
        
        {/* Header Action: Theme toggle */}
        <div className="flex justify-between items-center select-none mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {selectedUser ? 'Autentikasi PIN Staf' : 'Pilih Profil Anda'}
          </span>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/50 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-slate-600" />}
          </button>
        </div>

        {/* Card Selection Mode */}
        {!selectedUser ? (
          <div className="my-auto py-2 text-left flex flex-col gap-4">
            <div className="flex flex-col items-center text-center gap-2 mb-1">
              <img src={logoImg} alt="Izy Store Logo" className="w-20 h-20 object-contain rounded-full shadow-md border border-slate-100 dark:border-slate-800" />
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 mt-1">
                  Selamat Datang
                </h2>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  Silakan pilih akun Anda di bawah untuk masuk.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {usersList.map((user) => {
                const style = getRoleStyle(user.role);
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/30 rounded-2xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.99] transition-all hover:bg-orange-50/50 dark:hover:bg-orange-950/10 hover:border-orange-200 dark:hover:border-orange-900/30 group text-left cursor-pointer shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${style.avatarBg} group-hover:scale-105 transition-transform duration-200`}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
                          {user.name}
                        </h4>
                        <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-none border border-white/60 dark:border-transparent ${style.bg} ${style.text}`}>
                      {user.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* PIN Entry Mode */
          <div className="my-auto py-2 flex flex-col items-center">
            
            {/* Back Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="self-start flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:translate-x-[-2px] transition-all cursor-pointer mb-5"
            >
              <ArrowLeft size={12} strokeWidth={3} />
              Kembali
            </button>

            {/* Header profile info */}
            <div className="flex flex-col items-center mb-4 select-none">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-md mb-2 ${getRoleStyle(selectedUser.role).avatarBg}`}>
                {getInitials(selectedUser.name)}
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{selectedUser.name}</h3>
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 mt-1 rounded-lg border border-white/60 dark:border-transparent ${getRoleStyle(selectedUser.role).bg} ${getRoleStyle(selectedUser.role).text}`}>
                {selectedUser.role}
              </span>
            </div>

            {/* PIN Dots display */}
            <div className={`flex gap-4 mb-4 items-center justify-center h-8 ${isShaking ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`
                      w-3.5 h-3.5 rounded-full border-2 transition-all duration-200
                      ${isSuccess 
                        ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-110' 
                        : isShaking 
                          ? 'bg-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                          : filled 
                            ? 'bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)] scale-110' 
                            : 'bg-transparent border-slate-300 dark:border-slate-700'
                      }
                    `}
                  />
                );
              })}
            </div>

            {/* Error & Success Feedback Message */}
            <div className="h-6 mb-3 flex items-center justify-center text-center">
              {error && (
                <span className="text-xs font-bold text-red-500 flex items-center gap-1 animate-pulse">
                  <AlertCircle size={14} />
                  {error}
                </span>
              )}
              {isSuccess && (
                <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                  <Check size={14} strokeWidth={3} />
                  Verifikasi Sukses...
                </span>
              )}
            </div>

            {/* Neomorphic PIN Pad */}
            <div className="grid grid-cols-3 gap-2.5 w-60 max-w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={isSuccess}
                  className="h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-base flex items-center justify-center shadow-neo dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.35)] active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:bg-orange-500 active:text-white dark:active:bg-orange-500 dark:active:text-slate-950 transition-all border border-slate-100 dark:border-slate-800/30 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              
              {/* Button Clear */}
              <button
                onClick={handleClear}
                disabled={isSuccess}
                className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs flex items-center justify-center hover:text-red-500 dark:hover:text-red-400 active:scale-95 transition-all border border-slate-150 dark:border-slate-800/30 cursor-pointer shadow-sm"
                title="Hapus Semua"
              >
                C
              </button>

              {/* Button 0 */}
              <button
                onClick={() => handleNumberClick(0)}
                disabled={isSuccess}
                className="h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-base flex items-center justify-center shadow-neo dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.35)] active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:bg-orange-500 active:text-white dark:active:bg-orange-500 dark:active:text-slate-950 transition-all border border-slate-100 dark:border-slate-800/30 cursor-pointer"
              >
                0
              </button>

              {/* Button Backspace */}
              <button
                onClick={handleBackspace}
                disabled={isSuccess}
                className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-sm flex items-center justify-center hover:text-slate-800 dark:hover:text-slate-200 active:scale-95 transition-all border border-slate-150 dark:border-slate-800/30 cursor-pointer shadow-sm"
                title="Hapus Satu"
              >
                <Delete size={16} />
              </button>
            </div>

          </div>
        )}

        {/* Footer view info */}
        <div className="text-[9px] font-black text-slate-350 dark:text-slate-650 uppercase tracking-widest text-center select-none mt-2">
          IZYSTORE SECURITY ACCESS SYSTEM
        </div>

      </div>

    </div>
  );
};

export default LoginView;
