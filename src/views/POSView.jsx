import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import logoImg from '../assets/logo.png';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { 
  Search, 
  Trash2, 
  Plus, 
  Pause, 
  Play, 
  Check, 
  Printer, 
  Share2, 
  Lock, 
  DollarSign,
  ShoppingBag,
  Smartphone,
  Cpu,
  Layers,
  Award,
  Battery,
  Shield,
  Camera
} from 'lucide-react';

export const POSView = () => {
  const {
    inventory,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemImei,
    salespersons = [],
    helpers = [],
    pendingTransactions,
    holdTransaction,
    resumeTransaction,
    cancelPendingTransaction,
    completeTransaction,
    currentUser
  } = useApp();

  // Combine salespersons and helpers
  const allEmployeesMap = {};
  salespersons.forEach((s) => { if (s && s.name) allEmployeesMap[s.name] = s; });
  helpers.forEach((h) => { if (h && h.name) allEmployeesMap[h.name] = h; });
  const allEmployees = Object.values(allEmployeesMap);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);


  // Cart / Payment States
  const [checkoutForm, setCheckoutForm] = useState({
    salesperson: '',
    helper: ''
  });
  const [discountInput, setDiscountInput] = useState('');
  const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); // 'Tunai', 'QRIS', 'Transfer Bank', 'Paylater'
  const [cashReceived, setCashReceived] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Split Payment States
  const [isSplit, setIsSplit] = useState(false);
  const [splitMethod1, setSplitMethod1] = useState('Tunai');
  const [splitAmount1, setSplitAmount1] = useState('');
  const [splitMethod2, setSplitMethod2] = useState('Transfer Bank');
  const [splitAmount2, setSplitAmount2] = useState('');

  // Resume Drawer State
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Responsive Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState('produk'); // 'produk' / 'keranjang'

  // Filter Inventory (Only show available stock > 0)
  const filteredProducts = inventory.filter((item) => {
    return (
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.imei && item.imei.includes(searchQuery))
    ) && item.stok > 0;
  });

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.hargaJual * item.qty, 0);
  const discountVal = parseFloat(discountInput) || 0;
  const total = Math.max(0, subtotal - discountVal);

  const handleAddToCart = (product) => {
    const res = addToCart(product);
    if (!res.success) {
      alert(res.message);
    }
  };

  // PIN Otorisasi Admin
  const handleApplyDiscount = () => {
    if (discountVal > 100000 && !isDiscountAuthorized) {
      setShowPinModal(true);
      setPinError('');
      setAdminPin('');
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    // PIN admin is 1234, Owner PIN is 9999
    if (adminPin === '1234' || adminPin === '9999') {
      setIsDiscountAuthorized(true);
      setShowPinModal(false);
      alert('Otorisasi Diskon Berhasil!');
    } else {
      setPinError('PIN Salah! Otorisasi ditolak.');
    }
  };

  const handleHoldCart = () => {
    const res = holdTransaction(checkoutForm.salesperson, 'Sales');
    if (res.success) {
      setCheckoutForm({ salesperson: '', helper: '' });
      setDiscountInput('');
      setIsDiscountAuthorized(false);
      alert('Transaksi berhasil ditunda (Hold).');
    } else {
      alert(res.message);
    }
  };

  const handleResumeCart = (holdId) => {
    resumeTransaction(holdId);
    setShowPendingModal(false);
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;

    // Validate that all Gadgets in the cart have a valid 15-digit physical IMEI
    const missingImeiItem = cart.find(
      (item) => item.kategori === 'Gadget' && (!item.physicalImei || item.physicalImei.length !== 15)
    );
    if (missingImeiItem) {
      alert(`Wajib memasukkan Nomor IMEI Fisik 15 digit untuk perangkat ${missingImeiItem.model}!`);
      return;
    }

    // Check authorization for discount > 100k
    if (discountVal > 100000 && !isDiscountAuthorized) {
      setShowPinModal(true);
      setPinError('');
      setAdminPin('');
      return;
    }
    
    // Reset cash input for Tunai
    setCashReceived(total);
    setShowPaymentModal(true);
  };

  const handleCheckout = () => {
    let cash = parseFloat(cashReceived) || total;
    if (!isSplit && paymentMethod === 'Tunai' && cash < total) {
      alert('Uang tunai yang diterima kurang!');
      return;
    }

    if (isSplit) {
      const sumAmount = splitAmount1 + splitAmount2;
      if (sumAmount < total) {
        alert('Total nominal split payment kurang dari total tagihan!');
        return;
      }
      
      const hasCash = splitMethod1 === 'Tunai' || splitMethod2 === 'Tunai';
      if (!hasCash && sumAmount !== total) {
        alert('Untuk non-tunai, jumlah nominal split payment harus pas dengan total tagihan!');
        return;
      }
    }

    const change = isSplit
      ? ((splitMethod1 === 'Tunai' || splitMethod2 === 'Tunai') ? Math.max(0, (splitAmount1 + splitAmount2) - total) : 0)
      : (paymentMethod === 'Tunai' ? Math.max(0, cash - total) : 0);

    const payMethodName = isSplit ? `${splitMethod1} + ${splitMethod2}` : paymentMethod;

    const itemsWithPhysicalImei = cart.map((item) => ({
      ...item,
      barcode: item.imei,
      imei: item.physicalImei || item.imei
    }));

    const res = completeTransaction({
      items: itemsWithPhysicalImei,
      salesperson: checkoutForm.salesperson,
      helper: checkoutForm.helper,
      salespersonRole: 'Sales',
      discount: discountVal,
      total,
      paymentMethod: payMethodName,
      cashAmount: isSplit ? (splitMethod1 === 'Tunai' ? splitAmount1 : (splitMethod2 === 'Tunai' ? splitAmount2 : 0)) : (paymentMethod === 'Tunai' ? cash : total),
      changeAmount: change,
      isSplitPayment: isSplit,
      splitDetails: isSplit ? { method1: splitMethod1, amount1: splitAmount1, method2: splitMethod2, amount2: splitAmount2 } : null
    });

    if (res.success) {
      setReceiptData({
        invoiceNo: res.invoiceNo,
        items: res.transaction.items,
        salesperson: res.transaction.salesperson,
        helper: res.transaction.helper,
        salespersonRole: res.transaction.salespersonRole,
        discount: res.transaction.discount,
        subtotal,
        total: res.transaction.total,
        paymentMethod: res.transaction.paymentMethod,
        cashAmount: res.transaction.cashAmount,
        changeAmount: res.transaction.changeAmount,
        date: res.transaction.date,
        isSplitPayment: res.transaction.isSplitPayment,
        splitDetails: res.transaction.splitDetails
      });
      
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
      // Reset POS form
      setCheckoutForm({ salesperson: '', helper: '' });
      setDiscountInput('');
      setIsDiscountAuthorized(false);
      setIsSplit(false);
    }
  };

  const handleFormatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-1 dark:text-slate-200">
      
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden mb-3 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-1 shrink-0 select-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none">
        <button
          onClick={() => setActiveMobileTab('produk')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
            activeMobileTab === 'produk'
              ? 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-405 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          Daftar Produk
        </button>
        <button
          onClick={() => setActiveMobileTab('keranjang')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 relative ${
            activeMobileTab === 'keranjang'
              ? 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-405 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <span>Keranjang Belanja</span>
          {cart.length > 0 && (
            <span className="bg-orange-500 text-white dark:text-slate-950 text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Main Responsive POS Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-5rem)] overflow-hidden">
        
        {/* LEFT PANEL: PRODUCT SEARCH & GRID */}
        <div className={`flex flex-col gap-4 h-full md:w-[60%] ${activeMobileTab === 'produk' ? 'w-full flex' : 'hidden md:flex'}`}>
        <Card 
          title="Pencarian Produk & Gadget" 
          headerBg="bg-orange-100/70"
          className="flex-1 flex flex-col h-full overflow-hidden"
          bodyClassName="p-4 flex flex-col gap-4 overflow-hidden"
        >
          {/* Search bar & Categories */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2.5 items-center w-full">
              <div className="flex-1">
                <Input
                  placeholder="Cari berdasarkan Brand, Model, SKU, IMEI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                />
              </div>
              <Button
                variant="white"
                onClick={() => setShowScanner(true)}
                className="!p-3 h-[45px] flex items-center justify-center !rounded-2xl border border-slate-200 dark:border-slate-700/40 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all shadow-sm shrink-0"
                title="Scan Barcode"
              >
                <Camera size={20} />
              </Button>
            </div>

          </div>

          {/* Grid Products */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 -mx-2.5">
            <div className="grid grid-cols-2 gap-2.5 md:gap-3.5 pb-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="relative group bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/90 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-3.5 md:p-5 text-left flex flex-col justify-between hover:scale-[1.03] active:scale-[0.98] cursor-pointer transition-all duration-300 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_30px_-5px_rgba(249,115,22,0.12)] dark:hover:shadow-[0_12px_30px_-5px_rgba(249,115,22,0.15)] hover:border-orange-300 dark:hover:border-orange-500/30"
                  >
                    {/* Animated border shine/glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-orange-500/0 dark:from-orange-500/10 dark:to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Giant Backdrop Watermark */}
                    <div className="absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 w-24 h-24 md:w-32 md:h-32 text-slate-100/45 dark:text-slate-800/15 group-hover:text-orange-500/5 dark:group-hover:text-orange-400/5 group-hover:scale-110 transition-all duration-500 pointer-events-none z-0">
                      {product.kategori === 'Gadget' ? (
                        <Smartphone size="100%" strokeWidth={0.5} />
                      ) : (
                        <ShoppingBag size="100%" strokeWidth={0.5} />
                      )}
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Top Row: Icon / Category and Condition Badge */}
                        <div className="flex justify-between items-center mb-2.5 md:mb-3.5">
                          {/* Premium Category Icon */}
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 border bg-gradient-to-br from-orange-50 to-orange-100/60 dark:from-orange-950/40 dark:to-orange-950/20 text-orange-500 dark:text-orange-400 border-orange-200/50 dark:border-orange-900/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-none">
                            <Smartphone size={14} className="md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Stock Indicator Badge */}
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100/65 dark:bg-slate-950/80 border border-slate-200/40 dark:border-slate-800/40">
                              <span className={`w-1 h-1 rounded-full ${
                                product.stok <= 2 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                              }`} />
                              <span className="text-[7.5px] md:text-[8px] font-extrabold text-slate-500 dark:text-slate-400">
                                {product.stok} unit
                              </span>
                            </div>

                            {/* Condition Badge */}
                            <span className={`
                              text-[7.5px] md:text-[8px] font-black uppercase px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm text-white tracking-widest border border-white/20
                              ${product.kondisi === 'Baru' 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/10' 
                                : 'bg-gradient-to-r from-purple-550 to-indigo-500 shadow-purple-500/10'
                              }
                            `}>
                              {product.kondisi}
                            </span>
                          </div>
                        </div>

                        {/* Brand & Model */}
                        <div className="flex flex-col">
                          <h4 className="font-black text-xs md:text-sm text-slate-850 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 leading-tight mb-0.5 md:mb-1 mt-1">
                            {product.model}
                          </h4>
                        </div>

                        {/* Specs Pills */}
                        <div className="flex flex-wrap gap-1 md:gap-1.5 mt-1 md:mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[7px] md:text-[8px] font-bold bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg border border-slate-200/20 dark:border-slate-700/30">
                            <Cpu size={7} className="md:w-2 md:h-2" />
                            <span>{product.rom}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[7px] md:text-[8px] font-bold bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg border border-slate-200/20 dark:border-slate-700/30">
                            <Layers size={7} className="md:w-2 md:h-2" />
                            <span>{product.warna}</span>
                          </span>
                        </div>

                        {/* Condition Specific Badges (Bekas) */}
                        {product.kondisi === 'Bekas' && (
                          <div className="flex flex-wrap gap-1 md:gap-1.5 mt-2 md:mt-2.5 pt-1.5 md:pt-2 border-t border-slate-100/40 dark:border-slate-800/40">
                            {product.batteryHealth && (
                              <span className="inline-flex items-center gap-1 text-[7px] md:text-[8px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200/30 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 font-extrabold px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg">
                                <Battery size={7} className="text-amber-500 md:w-2 md:h-2" />
                                <span>BH {product.batteryHealth}%</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[7px] md:text-[8px] bg-blue-50 dark:bg-blue-950/30 border border-blue-200/30 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-extrabold px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg">
                              <Award size={7} className="text-blue-500 md:w-2 md:h-2" />
                              <span>Grade {product.gradeFisik}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[7px] md:text-[8px] bg-rose-50 dark:bg-rose-950/30 border border-rose-200/30 dark:border-rose-900/30 text-rose-700 dark:text-rose-450 font-extrabold px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg">
                              <Shield size={7} className="text-rose-500 md:w-2 md:h-2" />
                              <span>{product.garansiAsal}</span>
                            </span>
                          </div>
                        )}

                        {/* IMEI Details */}
                        {product.kategori === 'Gadget' && (
                          <div className="mt-2 md:mt-2.5">
                            <span className="text-[7.5px] md:text-[8px] font-bold font-mono text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-950/50 border border-slate-205/30 dark:border-slate-800/40 rounded-md md:rounded-lg px-2 py-0.5 md:py-1 inline-block truncate max-w-full">
                              IMEI: {product.imei}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Price and Add Button */}
                      <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100 dark:border-slate-800/40 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[7.5px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Harga Jual</span>
                          <span className="font-black text-xs md:text-sm text-orange-600 dark:text-orange-400 font-mono tracking-tight">
                            {handleFormatRupiah(product.hargaJual)}
                          </span>
                        </div>

                        {/* Plus Add Button */}
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl md:rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white dark:group-hover:text-slate-950 flex items-center justify-center shadow-neo dark:shadow-none transition-all duration-300 group-hover:scale-110">
                          <Plus size={12} strokeWidth={3} className="md:w-3.5 md:h-3.5 transition-transform duration-300 group-hover:rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/60">
                  Produk tidak ditemukan atau stok habis.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

        {/* RIGHT PANEL: CART & CHECKOUT */}
        <div className={`flex flex-col gap-4 h-full md:w-[40%] ${activeMobileTab === 'keranjang' ? 'w-full flex' : 'hidden md:flex'}`}>
        <Card
          title="Keranjang Belanja"
          headerBg="bg-emerald-100/70"
          className="flex-1 flex flex-col h-full overflow-hidden"
          bodyClassName="p-4 flex flex-col h-full overflow-hidden justify-between"
          headerAction={
            pendingTransactions.length > 0 && (
              <Button
                variant="yellow"
                size="sm"
                onClick={() => setShowPendingModal(true)}
                className="relative flex items-center gap-1.5 !rounded-xl"
              >
                <Play size={10} fill="currentColor" />
                <span>Resume ({pendingTransactions.length})</span>
              </Button>
            )
          }
        >
          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 mb-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div 
                  key={item.cartId || item.id}
                  className="bg-slate-50/70 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/40 p-3 text-left flex justify-between items-center gap-2 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black uppercase border border-slate-100 dark:border-slate-800/40 rounded-md px-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                        {item.kondisi}
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-200 truncate">{item.model}</h5>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">Barcode: {item.imei}</p>
                    <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100 block mb-1">
                      {handleFormatRupiah(item.hargaJual)}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-200/50 dark:border-slate-800/40 pt-1.5">
                      <label className="text-[7.5px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 pl-0.5">IMEI Fisik Perangkat (15 digit) *</label>
                      <input
                        type="text"
                        placeholder="Masukkan IMEI 15 digit"
                        value={item.physicalImei || ''}
                        onChange={(e) => updateCartItemImei(item.cartId || item.id, e.target.value.replace(/\D/g, '').slice(0, 15))}
                        required
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[10px] font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/40 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 select-none">
                    <span className="rounded-xl border border-slate-200/50 dark:border-slate-800/40 px-2.5 py-0.5 bg-white dark:bg-slate-900 font-black text-xs text-slate-700 dark:text-slate-200">
                      {item.qty}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.cartId || item.id)}
                      className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
                <ShoppingBag size={28} className="opacity-40 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Keranjang Kosong</span>
                <span className="text-[9px] mt-1 font-semibold">Pilih produk di panel kiri.</span>
              </div>
            )}
          </div>

          {/* Cart Footer: Inputs, Totals & Checkout */}
          <div className="border-t border-slate-100 dark:border-slate-800/40 pt-4 bg-white dark:bg-slate-900 flex flex-col gap-3 transition-all">
            {/* Discount Manual */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Diskon Manual (Rp)"
                  type="number"
                  placeholder="Contoh: 50000"
                  value={discountInput}
                  onChange={(e) => {
                    setDiscountInput(e.target.value);
                    setIsDiscountAuthorized(false); // Reset PIN authorization on edit
                  }}
                  className="!py-2.5 !text-xs !rounded-2xl"
                />
              </div>
              {parseFloat(discountInput) > 100000 && (
                <div className="mb-0.5">
                  <Button
                    variant={isDiscountAuthorized ? 'green' : 'red'}
                    size="sm"
                    onClick={handleApplyDiscount}
                    className="h-[43px] flex items-center justify-center gap-1.5 !rounded-2xl"
                  >
                    {isDiscountAuthorized ? <Check size={14} strokeWidth={3} /> : <Lock size={14} />}
                    <span>{isDiscountAuthorized ? 'Authorized' : 'Auth'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Employee Split Commission Selection */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
                  Sales (Opsional)
                </label>
                <select
                  value={checkoutForm.salesperson}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, salesperson: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-850 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="">-- Pilih Sales --</option>
                  {allEmployees.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
                  Helper (Opsional)
                </label>
                <select
                  value={checkoutForm.helper}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, helper: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-855 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="">-- Pilih Helper --</option>
                  {allEmployees.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summaries */}
            <div className="bg-slate-50/80 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/40 p-3.5 flex flex-col gap-1.5 text-left shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="dark:text-slate-300">{handleFormatRupiah(subtotal)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-xs font-bold text-red-500 dark:text-red-400">
                  <span>Diskon:</span>
                  <span>-{handleFormatRupiah(discountVal)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-black text-slate-700 dark:text-slate-200 border-t border-dashed border-slate-200 dark:border-slate-800/40 pt-1.5">
                <span>Total Sisa Bayar:</span>
                <span className="text-sm text-orange-700 dark:text-orange-350 bg-orange-100 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-lg border border-white/50 dark:border-orange-900/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]">
                  {handleFormatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Hold and Checkout Buttons */}
            <div className="flex gap-2">
              <Button
                variant="white"
                onClick={handleHoldCart}
                disabled={cart.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 !rounded-2xl"
              >
                <Pause size={14} />
                <span>Hold</span>
              </Button>
              <Button
                variant="green"
                onClick={handleOpenPayment}
                disabled={cart.length === 0}
                className="flex-2 flex items-center justify-center gap-1.5 py-3 text-sm !rounded-2xl"
              >
                <DollarSign size={16} strokeWidth={2.5} />
                <span>Bayar Sekarang</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      </div> {/* Closing tag for Main Responsive POS Layout Container */}

      {/* MODAL 1: PIN AUTORISASI ADMIN */}
      <Modal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="Otorisasi Diskon Admin"
        maxWidth="max-w-xs"
      >
        <form onSubmit={handleVerifyPin} className="flex flex-col gap-4 text-center">
          <p className="text-xs font-semibold text-slate-500 m-0">
            Pemberian diskon melebihi **Rp 100.000** memerlukan otorisasi Owner/Admin.
          </p>
          <div className="flex flex-col gap-1 text-left">
            <Input
              label="Masukkan PIN Otorisasi"
              type="password"
              placeholder="PIN Admin"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              required
              className="text-center font-mono text-lg tracking-widest !rounded-2xl"
              maxLength={4}
              autoFocus
            />
            <p className="text-[9px] font-bold text-slate-400 mt-1 pl-1">
              *Tips Pengujian: Gunakan PIN `1234` (Admin) atau `9999` (Owner).
            </p>
          </div>
          {pinError && <p className="text-xs font-bold text-red-500 m-0 uppercase">{pinError}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="white" size="sm" onClick={() => setShowPinModal(false)}>
              Batal
            </Button>
            <Button variant="green" size="sm" type="submit">
              Konfirmasi
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: PENDING TRANSACTION LIST (RESUME) */}
      <Modal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        title="Daftar Transaksi Ditunda (Hold)"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-3">
          {pendingTransactions.length > 0 ? (
            pendingTransactions.map((hold) => (
              <div 
                key={hold.id}
                className="border border-slate-100 dark:border-slate-800/40 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col gap-2 text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-200">
                      Sales: {hold.salesperson} {hold.salespersonRole ? `(${hold.salespersonRole})` : ''}
                    </h5>
                    <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(hold.date).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/50 dark:border-orange-900/30">
                    {handleFormatRupiah(hold.total)}
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-100 dark:border-slate-800/40 pt-2.5 flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                  {hold.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-bold">{item.qty}x {item.model}</span>
                      <span className="font-semibold">{handleFormatRupiah(item.hargaJual * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end mt-3 border-t border-slate-50 dark:border-slate-800/40 pt-2.5">
                  <Button 
                    variant="red" 
                    size="sm" 
                    onClick={() => cancelPendingTransaction(hold.id)}
                    className="!py-1.5 !px-3 !text-[10px] !rounded-xl"
                  >
                    Hapus
                  </Button>
                  <Button 
                    variant="green" 
                    size="sm" 
                    onClick={() => handleResumeCart(hold.id)}
                    className="!py-1.5 !px-4 !text-[10px] !rounded-xl"
                  >
                    Resume
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-6 font-bold text-slate-400 dark:text-slate-500 m-0">
              Tidak ada transaksi ditunda.
            </p>
          )}
        </div>
      </Modal>

      {/* MODAL 3: PAYMENT SCREEN */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pembayaran Transaksi"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 rounded-2xl border border-white/50 dark:border-orange-900/30 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] p-5 text-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 block">TOTAL TAGIHAN</span>
            <span className="text-2xl font-black">{handleFormatRupiah(total)}</span>
          </div>

          {/* Tipe Pembayaran (Tunggal vs Split) */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-1 select-none">
            <button
              type="button"
              onClick={() => setIsSplit(false)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                !isSplit
                  ? 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow-sm'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-755 dark:hover:text-slate-300'
              }`}
            >
              Single Payment
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSplit(true);
                setSplitAmount1(Math.round(total / 2));
                setSplitAmount2(total - Math.round(total / 2));
              }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                isSplit
                  ? 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow-sm'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-755 dark:hover:text-slate-300'
              }`}
            >
              Split Payment
            </button>
          </div>

          {!isSplit && (
            <>
              {/* Payment Method Tabs */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Tunai', 'Transfer Bank'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        px-2 py-2.5 text-center rounded-xl border border-transparent font-extrabold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer
                        ${paymentMethod === method 
                          ? 'bg-slate-800 dark:bg-orange-500 text-white dark:text-slate-950 shadow-sm' 
                          : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95'
                        }
                      `}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paylater Menu */}
              <div className="flex flex-col gap-1 mt-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Paylater</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Indodana', 'Kredivo', 'Spaylater', 'Akulaku'].map((provider) => {
                    const paylaterMethod = `Paylater - ${provider}`;
                    const isSelected = paymentMethod === paylaterMethod;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setPaymentMethod(paylaterMethod)}
                        className={`
                          px-1 py-2.5 text-center rounded-xl border border-transparent font-extrabold uppercase text-[8px] tracking-wider transition-all duration-200 cursor-pointer
                          ${isSelected 
                            ? 'bg-slate-800 dark:bg-orange-500 text-white dark:text-slate-950 shadow-sm' 
                            : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95'
                          }
                        `}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Input (Only for Tunai) */}
              {paymentMethod === 'Tunai' ? (
                <div className="flex flex-col gap-3">
                  <Input
                    label="Uang Tunai Diterima (Rp)"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    required
                    className="font-black text-lg text-slate-800 dark:text-slate-100 bg-white"
                    autoFocus
                  />
                  
                  {/* Shortcut buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt)}
                        className="px-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-350 hover:text-orange-700 dark:hover:text-orange-400 border border-transparent font-extrabold text-[9px] transition-all cursor-pointer"
                      >
                        {handleFormatRupiah(amt)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCashReceived(total)}
                      className="col-span-2 px-2 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/20 border border-transparent font-extrabold text-[9px] transition-all cursor-pointer"
                    >
                      Uang Pas
                    </button>
                  </div>

                  {/* Kembalian Calculation */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 p-4 flex justify-between items-center mt-1">
                    <span className="font-extrabold text-xs text-slate-400 dark:text-slate-500 font-bold">KEMBALIAN:</span>
                    <span className="font-black text-base text-slate-800 dark:text-slate-100">
                      {handleFormatRupiah(Math.max(0, (parseFloat(cashReceived) || total) - total))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-slate-50/60 dark:bg-slate-950/20 p-6 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">
                    {paymentMethod.startsWith('Paylater') ? `Simulasi Paylater (${paymentMethod.replace('Paylater - ', '')})` : 'SIMULASI TRANSFER BANK / KARTU'}
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-2 leading-relaxed">
                    {paymentMethod.startsWith('Paylater')
                      ? `Silakan lakukan proses pengajuan limit/transaksi melalui aplikasi ${paymentMethod.replace('Paylater - ', '')} pelanggan. Transaksi akan tercatat setelah menekan tombol "Proses Transaksi".`
                      : 'Lakukan transfer bank atau gesek kartu ke EDC toko. Pembayaran akan terverifikasi secara otomatis setelah menekan tombol "Proses Transaksi".'
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {isSplit && (
            <div className="flex flex-col gap-4 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-950/20">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Pembayaran 1</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={splitMethod1}
                    onChange={(e) => setSplitMethod1(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {['Tunai', 'Transfer Bank', 'Paylater - Indodana', 'Paylater - Kredivo', 'Paylater - Spaylater', 'Paylater - Akulaku'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Nominal 1"
                    value={splitAmount1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSplitAmount1(val);
                      setSplitAmount2(Math.max(0, total - val));
                    }}
                    className="!py-2 !text-xs !rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Pembayaran 2</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={splitMethod2}
                    onChange={(e) => setSplitMethod2(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {['Tunai', 'Transfer Bank', 'Paylater - Indodana', 'Paylater - Kredivo', 'Paylater - Spaylater', 'Paylater - Akulaku'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Nominal 2"
                    value={splitAmount2}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSplitAmount2(val);
                      setSplitAmount1(Math.max(0, total - val));
                    }}
                    className="!py-2 !text-xs !rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-slate-500/5 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40 p-3 flex flex-col gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Total Terinput:</span>
                  <span className={splitAmount1 + splitAmount2 >= total ? "text-emerald-500" : "text-rose-500"}>
                    {handleFormatRupiah(splitAmount1 + splitAmount2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tagihan:</span>
                  <span>{handleFormatRupiah(total)}</span>
                </div>
                {(splitMethod1 === 'Tunai' || splitMethod2 === 'Tunai') && (splitAmount1 + splitAmount2 > total) && (
                  <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800/40 pt-1.5 mt-1 text-slate-700 dark:text-slate-200">
                    <span>Kembalian Tunai:</span>
                    <span className="text-emerald-500 font-extrabold">
                      {handleFormatRupiah((splitAmount1 + splitAmount2) - total)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

            <div className="flex justify-end gap-2 mt-4 border-t border-slate-50 dark:border-slate-800/40 pt-3">
              <Button variant="white" onClick={() => setShowPaymentModal(false)}>
                Batal
              </Button>
              <Button variant="green" onClick={handleCheckout}>
                Proses Transaksi
              </Button>
            </div>
        </div>
      </Modal>

      {/* MODAL 4: E-RECEIPT (CETAK STRUK) */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Bukti Transaksi (Digital Receipt)"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4 text-center">
          
          {/* Mock E-Receipt Layout */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 font-mono text-[11px] text-left flex flex-col gap-3 relative overflow-hidden shadow-sm transition-all duration-300">
            
            <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-800/40 pb-3">
              <img src={logoImg} alt="Izy Store Logo" className="w-10 h-10 object-contain mx-auto mb-1.5 rounded-full border border-slate-100 dark:border-slate-800" />
              <span className="text-xs font-black tracking-wider block text-slate-700 dark:text-slate-200">IZYSTORE GADGET</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block">ITC Kuningan Lt. 3, Jakarta</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block">Telp: 0812-9999-8888</span>
            </div>

            <div className="flex flex-col gap-1 text-[9px] text-slate-550 dark:text-slate-400">
              <div className="flex justify-between">
                <span>No Invoice:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{receiptData?.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span className="dark:text-slate-300">{receiptData ? new Date(receiptData.date).toLocaleString('id-ID') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Operator:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {receiptData?.salesperson || '-'}
                </span>
              </div>
              {receiptData?.helper && (
                <div className="flex justify-between">
                  <span>Helper:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {receiptData.helper}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800/40 py-2 flex flex-col gap-2">
              {receiptData?.items.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                    <span>{item.qty}x {item.model}</span>
                    <span>{handleFormatRupiah(item.hargaJual * item.qty)}</span>
                  </div>
                  {item.imei && (
                    <span className="text-[8px] text-slate-400 dark:text-slate-500">IMEI: {item.imei} ({item.kondisi})</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1 text-[9px] text-slate-550 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="dark:text-slate-300">{handleFormatRupiah(receiptData?.subtotal || 0)}</span>
              </div>
              {receiptData?.discount > 0 && (
                <div className="flex justify-between text-red-500 dark:text-red-400">
                  <span>Diskon:</span>
                  <span>-{handleFormatRupiah(receiptData?.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 text-slate-800 dark:text-slate-100">
                <span>TOTAL:</span>
                <span>{handleFormatRupiah(receiptData?.total || 0)}</span>
              </div>
              {receiptData?.isSplitPayment && receiptData?.splitDetails ? (
                <div className="flex flex-col gap-0.5 border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 mt-1 text-[8px] text-slate-400 dark:text-slate-500 font-bold">
                  <div className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-450 mb-0.5">Rincian Split Payment:</div>
                  <div className="flex justify-between">
                    <span>- {receiptData.splitDetails.method1}:</span>
                    <span>{handleFormatRupiah(receiptData.splitDetails.amount1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- {receiptData.splitDetails.method2}:</span>
                    <span>{handleFormatRupiah(receiptData.splitDetails.amount2)}</span>
                  </div>
                  {receiptData?.changeAmount > 0 && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-200 mt-0.5 border-t border-dashed border-slate-200 dark:border-slate-800/20 pt-1">
                      <span>Kembalian Tunai:</span>
                      <span>{handleFormatRupiah(receiptData.changeAmount)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between mt-1">
                    <span>Bayar ({receiptData?.paymentMethod}):</span>
                    <span className="dark:text-slate-300">{handleFormatRupiah(receiptData?.cashAmount || 0)}</span>
                  </div>
                  {receiptData?.paymentMethod === 'Tunai' && (
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span className="dark:text-slate-300">{handleFormatRupiah(receiptData?.changeAmount || 0)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="text-center border-t border-dashed border-slate-200 dark:border-slate-800/40 pt-3 mt-2 text-[8px] text-slate-400 dark:text-slate-500 font-bold">
              <span>TERIMA KASIH ATAS KUNJUNGAN ANDA</span>
              <span className="block mt-0.5">Garansi Toko wajib membawa nota ini / IMEI tercatat.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="white"
              onClick={() => alert('Simulasi Cetak Struk ke Printer...')}
              className="flex-1 flex items-center justify-center gap-1.5 !rounded-xl"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </Button>
            <Button
              variant="blue"
              onClick={() => alert(`Simulasi Mengirim Invoice ke WhatsApp...`)}
              className="flex-1 flex items-center justify-center gap-1.5 !rounded-xl"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </Button>
          </div>

          <Button variant="green" onClick={() => setShowReceiptModal(false)} className="w-full py-3 mt-2 !rounded-xl">
            Selesai
          </Button>
        </div>
      </Modal>

      {/* MODAL 5: BARCODE SCANNER */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={(barcode) => {
          const cleanBarcode = barcode.trim();
          setSearchQuery(cleanBarcode);
          const matchedProduct = inventory.find(
            (item) => 
              (item.imei && item.imei.trim().toLowerCase() === cleanBarcode.toLowerCase()) || 
              (item.sku && item.sku.trim().toLowerCase() === cleanBarcode.toLowerCase())
          );
          if (matchedProduct) {
            handleAddToCart(matchedProduct);
          } else {
            alert(`Produk dengan barcode "${cleanBarcode}" tidak ditemukan.`);
          }
        }}
      />
    </div>
  );
};
export default POSView;
