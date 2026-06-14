import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { RefreshCw, Calculator, FileText } from 'lucide-react';

export const TradeInView = () => {
  const {
    inventory,
    salespersons,
    completeTransaction
  } = useApp();

  // Selected HP Baru (from inventory)
  const [selectedProduct, setSelectedProduct] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  
  // HP Lama Specs
  const [oldModel, setOldModel] = useState('');
  const [oldWarna, setOldWarna] = useState('');
  const [oldRom, setOldRom] = useState('');
  const [oldMinus, setOldMinus] = useState('');
  const [taksiranHarga, setTaksiranHarga] = useState('');



  // Checkout States
  const [selectedSales, setSelectedSales] = useState('');
  const [salesRole, setSalesRole] = useState('Sales'); // 'Sales' or 'Helper'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashReceived, setCashReceived] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const handleBarcodeSearchChange = (e) => {
    const val = e.target.value;
    setBarcodeQuery(val);
    
    // Find matching items (exact match case-insensitive for scan triggers)
    const matches = inventory.filter(
      (item) =>
        item.kategori === 'Gadget' &&
        item.kondisi === 'Baru' &&
        item.stok > 0 &&
        (item.imei?.toLowerCase() === val.trim().toLowerCase() ||
         item.sku?.toLowerCase() === val.trim().toLowerCase())
    );
    
    if (matches.length === 1) {
      setSelectedProduct(matches[0].id);
      setBarcodeQuery(''); // clear search input on match
    }
  };

  // Search matching new gadgets
  const searchResults = barcodeQuery.trim()
    ? inventory.filter(
        (item) =>
          item.kategori === 'Gadget' &&
          item.kondisi === 'Baru' &&
          item.stok > 0 &&
          (item.imei?.toLowerCase().includes(barcodeQuery.toLowerCase()) ||
           item.sku?.toLowerCase().includes(barcodeQuery.toLowerCase()))
      )
    : [];

  const newProductObj = inventory.find((p) => p.id === selectedProduct);
  const hargaBaru = newProductObj ? newProductObj.hargaJual : 0;
  const taksiranVal = parseFloat(taksiranHarga) || 0;
  const netDiff = hargaBaru - taksiranVal;
  const sisaBayar = Math.max(0, netDiff);




  const handleOpenCheckout = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Silakan pilih HP Baru yang ingin dibeli pelanggan.');
      return;
    }
    if (!taksiranHarga || parseFloat(taksiranHarga) <= 0) {
      alert('Taksiran harga HP lama wajib diisi.');
      return;
    }

    if (!selectedSales) {
      alert('Silakan pilih Salesperson untuk komisi transaksi.');
      return;
    }

    setCashReceived(netDiff < 0 ? 0 : netDiff);
    setShowPaymentModal(true);
  };

  const handleProcessTradeIn = () => {
    let cash = parseFloat(cashReceived) || 0;
    if (netDiff >= 0 && paymentMethod === 'Tunai' && cash < sisaBayar) {
      alert('Uang yang diterima kurang dari sisa bayar!');
      return;
    }

    const change = netDiff >= 0
      ? (paymentMethod === 'Tunai' ? Math.max(0, cash - sisaBayar) : 0)
      : Math.abs(netDiff); // Store pays customer the difference

    // Compile Trade-In attributes
    const tradeInDetails = {
      isTradeIn: true,
      brand: 'Apple',
      model: oldModel,
      warna: oldWarna,
      rom: oldRom,
      imei: '-',
      taksiranHarga: taksiranVal,
      batteryHealth: null,
      garansiAsal: null,
      gradeFisik: null,
      minus: oldMinus,
    };

    const res = completeTransaction({
      items: [{ ...newProductObj, qty: 1 }], // Checkout 1 HP Baru
      salesperson: selectedSales,
      salespersonRole: salesRole,
      discount: 0,
      total: netDiff,
      paymentMethod,
      cashAmount: netDiff >= 0 ? (paymentMethod === 'Tunai' ? cash : sisaBayar) : 0,
      changeAmount: change,
      tradeInDetails
    });

    if (res.success) {
      setReceiptData({
        invoiceNo: res.invoiceNo,
        date: res.transaction.date,
        newDevice: newProductObj,
        oldDevice: tradeInDetails,
        salesperson: selectedSales,
        salespersonRole: res.transaction.salespersonRole,
        total: netDiff,
        paymentMethod,
        cashAmount: netDiff >= 0 ? (paymentMethod === 'Tunai' ? cash : sisaBayar) : 0,
        changeAmount: change
      });

      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Reset form
      setSelectedProduct('');
      setOldModel('');
      setOldWarna('');
      setOldRom('');
      setTaksiranHarga('');

      setSelectedSales('');
      setSalesRole('Sales');
      setOldMinus('');
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
    <div className="p-4 flex flex-col gap-6 text-left">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-[inset_0_4px_6px_rgba(255,255,255,0.8),_0_12px_24px_-6px_rgba(15,23,42,0.04)] dark:shadow-neo-dark p-5 transition-all duration-300">
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
          <RefreshCw size={22} className="text-blue-500 animate-spin-slow" />
          Modul Tukar Tambah (Trade-In)
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
          Proses transaksi tukar tambah gadget baru dengan HP lama pelanggan. Data IMEI HP lama terintegrasi otomatis.
        </p>
      </div>

      <form onSubmit={handleOpenCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL 1: CALCULATOR STOK (Lg: 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: HP Baru yang Dibeli */}
          <Card title="1. Pilih HP Baru Toko" headerBg="bg-orange-100/70" bodyClassName="p-4">
            {!selectedProduct ? (
              <div className="flex flex-col gap-1 relative">
                <Input
                  label="Scan Barcode / SKU HP Baru Toko *"
                  placeholder="Scan barcode atau masukkan SKU..."
                  value={barcodeQuery}
                  onChange={handleBarcodeSearchChange}
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-[62px] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-neo dark:shadow-neo-dark z-50 max-h-48 overflow-y-auto flex flex-col p-1 gap-1">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p.id);
                          setBarcodeQuery('');
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <div>
                          <span className="block font-extrabold text-slate-800 dark:text-slate-100">{p.model}</span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">Barcode: {p.imei} • SKU: {p.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-slate-800 dark:text-slate-100 font-mono">{handleFormatRupiah(p.hargaJual)}</span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500">Stok: {p.stok} unit</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {barcodeQuery && searchResults.length === 0 && (
                  <div className="text-[10px] font-bold text-red-500 dark:text-red-400 pl-1 mt-0.5">
                    Produk baru dengan barcode/SKU tersebut tidak ditemukan atau stok kosong.
                  </div>
                )}
              </div>
            ) : (
              // Selected Product Card details
              <div className="bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col gap-3.5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-none font-bold text-xs text-slate-700 dark:text-slate-350">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 block">HP BARU TERPILIH</span>
                    <span className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{newProductObj?.model}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-bold">
                      {newProductObj?.warna} • {newProductObj?.rom}
                    </span>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block mt-0.5 font-mono">
                      Barcode: {newProductObj?.imei} • SKU: {newProductObj?.sku}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct('');
                      setBarcodeQuery('');
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 rounded-lg hover:scale-105 active:scale-95 transition-all text-[9px] font-extrabold uppercase tracking-wider cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
                
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-3 text-slate-600 dark:text-slate-400">
                  <span>Harga Jual Toko:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">{handleFormatRupiah(hargaBaru)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Stok Tersedia (Inventory):</span>
                  <span className="text-slate-800 dark:text-slate-200">{newProductObj?.stok} unit</span>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: HP Lama Pelanggan */}
          <Card title="2. Spesifikasi HP Lama Pelanggan" headerBg="bg-sky-100/70" bodyClassName="p-4 flex flex-col gap-4 text-slate-700 dark:text-slate-200">
            <Input
              label="Model HP"
              placeholder="Contoh: iPhone X, iPhone 11"
              value={oldModel}
              onChange={(e) => setOldModel(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Warna"
                placeholder="Contoh: Space Gray"
                value={oldWarna}
                onChange={(e) => setOldWarna(e.target.value)}
                required
              />
              <Input
                label="ROM / Internal"
                placeholder="Contoh: 64 GB"
                value={oldRom}
                onChange={(e) => setOldRom(e.target.value)}
                required
              />
            </div>

            <div className="w-full">
              <Input
                label="Taksiran Harga Beli HP Lama (Rp) *"
                type="number"
                placeholder="Taksiran nilai tukar HP lama"
                value={taksiranHarga}
                onChange={(e) => setTaksiranHarga(e.target.value)}
                required
              />
            </div>

            {/* Spek Khusus Bekas / iPhone */}
            <div className="border border-slate-100 dark:border-slate-800/40 bg-slate-50/70 dark:bg-slate-950/30 rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-none text-slate-600 dark:text-slate-400">
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 block border-b border-dashed border-slate-200 dark:border-slate-800/60 pb-2">
                Kondisi HP Lama (Auto Masuk Stok Bekas)
              </span>

              <div className="w-full">
                <Input
                  label="Catatan Minus / Kerusakan HP Lama"
                  placeholder="Contoh: TrueTone Off, Layar shadow tipis, FaceID Off (kosongkan jika mulus)"
                  value={oldMinus}
                  onChange={(e) => setOldMinus(e.target.value)}
                  className="!rounded-xl"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* PANEL 2: LEGAL LOG & CALCULATION RESULT (Lg: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          


          {/* Section 4: Kalkulator Sisa & Proses */}
          <Card title="Ringkasan Trade-In" headerBg="bg-purple-100/70" bodyClassName="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Harga HP Baru:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{handleFormatRupiah(hargaBaru)}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800/60 pb-2.5">
                <span>Taksiran HP Lama:</span>
                <span className="font-extrabold text-red-500 dark:text-red-400">-{handleFormatRupiah(taksiranVal)}</span>
              </div>
              
              <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-3.5 mt-1 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-none">
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                  {netDiff >= 0 ? "SISA HARUS DIBAYAR PELANGGAN" : "PENGEMBALIAN TOKO KE PELANGGAN"}
                </span>
                <span className={`text-xl font-black ${netDiff >= 0 ? "text-slate-800 dark:text-slate-100" : "text-emerald-600 dark:text-emerald-450"}`}>
                  {handleFormatRupiah(Math.abs(netDiff))}
                </span>
              </div>
            </div>

            {/* Sales Selector */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
                Sales Melayani
              </label>
              <select
                value={selectedSales}
                onChange={(e) => setSelectedSales(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200"
              >
                <option value="">-- Pilih Sales --</option>
                {salespersons.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Peran Melayani (Sales / Helper) */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
                Peran Melayani
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Helper', label: 'Helper' }
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSalesRole(role.value)}
                    className={`
                      px-3 py-2 text-center rounded-xl border border-transparent font-extrabold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer
                      ${salesRole === role.value 
                        ? 'bg-slate-800 text-white dark:text-slate-950 shadow-sm' 
                        : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95'
                      }
                    `}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="green"
              type="submit"
              className="w-full py-3.5 flex items-center justify-center gap-2 !rounded-2xl"
            >
              <RefreshCw size={16} strokeWidth={2.5} />
              <span>Proses Tukar Tambah</span>
            </Button>
          </Card>
        </div>
      </form>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={netDiff >= 0 ? "Pembayaran Selisih Trade-In" : "Pengembalian Selisih Trade-In"}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-left">
          <div className={`${netDiff >= 0 ? "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400" : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"} rounded-2xl border border-white/50 dark:border-slate-800/40 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7)] dark:shadow-none p-4 text-center mb-1`}>
            <span className="text-[10px] font-black uppercase tracking-widest block">
              {netDiff >= 0 ? "SISA PEMBAYARAN" : "HARUS DIBAYAR TOKO KE PELANGGAN"}
            </span>
            <span className="text-2xl font-black">{handleFormatRupiah(Math.abs(netDiff))}</span>
          </div>

          {netDiff >= 0 ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tunai', 'Transfer Bank', 'Kartu Kredit', 'Paylater'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        px-2 py-2.5 text-center rounded-xl border border-transparent font-extrabold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer
                        ${paymentMethod === method 
                          ? 'bg-slate-800 dark:bg-orange-500 text-white shadow-sm' 
                          : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:scale-105 active:scale-95'
                        }
                      `}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Tunai' ? (
                <div className="flex flex-col gap-3">
                  <Input
                    label="Uang Tunai Selisih (Rp)"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    required
                    className="font-black text-lg text-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                  <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 p-4 flex justify-between items-center mt-1">
                    <span className="font-extrabold text-xs text-slate-400 dark:text-slate-500">KEMBALIAN:</span>
                    <span className="font-black text-base text-slate-800 dark:text-slate-200">
                      {handleFormatRupiah(Math.max(0, (parseFloat(cashReceived) || sisaBayar) - sisaBayar))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-slate-50/60 dark:bg-slate-950/30 p-6 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">SIMULASI TRANSFER BANK / KARTU</span>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Lakukan transfer bank atau gesek kartu ke EDC toko untuk melunasi sisa selisih trade-in.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Metode Pengembalian</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Tunai', 'Transfer Bank'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        px-2 py-2.5 text-center rounded-xl border border-transparent font-extrabold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer
                        ${paymentMethod === method 
                          ? 'bg-slate-800 dark:bg-emerald-500 text-white shadow-sm' 
                          : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-350 hover:scale-105 active:scale-95'
                        }
                      `}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-slate-50/60 dark:bg-slate-950/30 p-5 text-center mt-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">KONFIRMASI PENGEMBALIAN TOKO</span>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Serahkan uang tunai atau lakukan transfer bank sebesar <span className="font-black text-slate-800 dark:text-slate-100">{handleFormatRupiah(Math.abs(netDiff))}</span> kepada pelanggan sebagai selisih tukar tambah.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 border-t border-slate-50 dark:border-slate-800/40 pt-3">
            <Button variant="white" onClick={() => setShowPaymentModal(false)}>
              Batal
            </Button>
            <Button variant="green" onClick={handleProcessTradeIn}>
              Selesaikan Transaksi
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: RECEIPT FOR TRADE-IN */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="E-Receipt Tukar Tambah"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 font-mono text-[11px] text-left flex flex-col gap-3 relative overflow-hidden shadow-sm transition-all duration-300">
            
            <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-800/40 pb-3">
              <span className="text-xs font-black tracking-wider block text-slate-700 dark:text-slate-200">IZYSTORE GADGET</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block">ITC Kuningan Lt. 3, Jakarta</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block">Invoice Tukar Tambah</span>
            </div>

            <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400">
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
                <span className="font-bold text-slate-700 dark:text-slate-200">Owner</span>
              </div>
              <div className="flex justify-between">
                <span>Sales:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {receiptData?.salesperson} {receiptData?.salespersonRole ? `(${receiptData.salespersonRole})` : ''}
                </span>
              </div>
            </div>

            {/* Trade In details */}
            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800/40 py-2.5 flex flex-col gap-2">
              <div>
                <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 block">BELI BARU:</span>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                  <span>1x {receiptData?.newDevice?.model}</span>
                  <span>{handleFormatRupiah(receiptData?.newDevice?.hargaJual || 0)}</span>
                </div>
              </div>
              <div className="border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-2">
                <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 block">TUKAR HP LAMA:</span>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                  <span>1x {receiptData?.oldDevice?.model}</span>
                  <span className="text-red-500 dark:text-red-400">-{handleFormatRupiah(receiptData?.oldDevice?.taksiranHarga || 0)}</span>
                </div>
              </div>
            </div>

            {/* Calculations */}
            <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <div className="flex justify-between font-black text-xs border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 text-slate-800 dark:text-slate-100">
                <span>{receiptData?.total >= 0 ? "SELISIH BAYAR:" : "TOKO BAYAR KE USER:"}</span>
                <span className={receiptData?.total < 0 ? "text-emerald-600 dark:text-emerald-450" : ""}>
                  {handleFormatRupiah(Math.abs(receiptData?.total || 0))}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>{receiptData?.total >= 0 ? `Bayar (${receiptData?.paymentMethod}):` : `Metode Pengembalian:`}</span>
                <span className="dark:text-slate-300">
                  {receiptData?.total >= 0 ? handleFormatRupiah(receiptData?.cashAmount || 0) : receiptData?.paymentMethod}
                </span>
              </div>
              {receiptData?.total >= 0 && receiptData?.paymentMethod === 'Tunai' && (
                <div className="flex justify-between">
                  <span>Kembalian:</span>
                  <span className="dark:text-slate-300">{handleFormatRupiah(receiptData?.changeAmount || 0)}</span>
                </div>
              )}
            </div>


            
            <div className="text-center border-t border-dashed border-slate-200 dark:border-slate-800/40 pt-3 mt-2 text-[8px] text-slate-400 dark:text-slate-500 font-bold">
              <span>TERIMA KASIH ATAS KUNJUNGAN ANDA</span>
              <span className="block mt-0.5">Garansi Toko wajib membawa nota ini / IMEI tercatat.</span>
            </div>
          </div>

          <Button variant="green" onClick={() => setShowReceiptModal(false)} className="w-full py-3 mt-1 !rounded-xl">
            Selesai
          </Button>
        </div>
      </Modal>
    </div>
  );
};
export default TradeInView;
