import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const BarcodeScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const html5QrCodeRef = useRef(null);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setIsInitializing(true);
    let html5QrCode = null;

    const startScanner = async () => {
      // Lock to prevent concurrent initialization in React StrictMode double effect run
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      // Wait for element to be present in DOM (polling up to 15 times)
      const elementId = 'barcode-scanner-reader';
      let element = null;
      for (let i = 0; i < 15; i++) {
        element = document.getElementById(elementId);
        if (element) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (!isMountedRef.current || !isOpen) {
        isInitializingRef.current = false;
        return;
      }

      if (!element) {
        setErrorMsg('Elemen kontainer scanner tidak ditemukan di DOM.');
        setIsInitializing(false);
        isInitializingRef.current = false;
        return;
      }

      // Check for secure context. Mobile browsers block camera access on non-secure HTTP (except localhost/127.0.0.1)
      const isSecure = window.isSecureContext || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        setErrorMsg(
          'Kamera diblokir karena koneksi tidak aman (HTTP). Silakan gunakan koneksi HTTPS atau akses dari localhost komputer Anda.'
        );
        setIsInitializing(false);
        isInitializingRef.current = false;
        return;
      }

      try {
        html5QrCode = new Html5Qrcode(elementId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 20,
          // Scan the entire frame (no qrbox) for faster and more accurate barcode recognition
          formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128]
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText, decodedResult) => {
            if (isMountedRef.current) {
              onScanSuccess(decodedText);
              handleClose();
            }
          },
          (errorMessage) => {
            // Ignore verbose match failure logs
          }
        );

        if (isMountedRef.current) {
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('Error starting camera scanner:', err);
        if (isMountedRef.current) {
          setErrorMsg(
            'Gagal membuka kamera belakang. Pastikan izin kamera telah diberikan di browser Anda.'
          );
          setIsInitializing(false);
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    startScanner();

    return () => {
      const stopAndClean = async () => {
        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
              console.log('Scanner stopped successfully on cleanup');
            }
          } catch (err) {
            console.error('Error stopping scanner on cleanup:', err);
          }
        }
      };
      stopAndClean();
      html5QrCodeRef.current = null;
    };
  }, [isOpen]);

  const handleClose = async () => {
    const scanner = html5QrCodeRef.current;
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        console.error('Error stopping scanner on close:', err);
      }
    }
    html5QrCodeRef.current = null;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan Barcode Produk"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 text-center">
        <p className="text-xs font-semibold text-slate-500 m-0">
          Arahkan kamera ke barcode (Code 128) pada produk.
        </p>

        {errorMsg ? (
          <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex flex-col items-center gap-2">
            <AlertCircle className="text-red-500 dark:text-red-400" size={24} />
            <p className="text-xs font-bold text-red-700 dark:text-red-400 m-0 leading-normal">
              {errorMsg}
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center aspect-video shadow-inner">
            {/* The element where video will render. Letting html5-qrcode control the height */}
            <div id="barcode-scanner-reader" className="w-full text-white" />

            {isInitializing && (
              <div className="absolute inset-0 bg-slate-900/90 dark:bg-slate-950/90 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-[3px] border-orange-500/20 border-t-orange-500 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 animate-pulse">
                  Mengaktifkan Kamera...
                </span>
              </div>
            )}

            {/* Visual Guide Lines */}
            {!isInitializing && (
              <>
                <div className="absolute inset-0 border-[3px] border-orange-500/20 pointer-events-none rounded-3xl z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[35%] border-2 border-dashed border-orange-500 animate-pulse pointer-events-none rounded-xl z-10" />
                {/* Scanning red laser line */}
                <div className="absolute top-1/2 left-[7.5%] w-[85%] h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse pointer-events-none z-10" />
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="white" onClick={handleClose} disabled={isInitializing}>
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
