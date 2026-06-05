import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { RefreshCw, Calculator, FileText, Camera, ShieldAlert } from 'lucide-react';

export const TradeInView = () => {
  const {
    inventory,
    salespersons,
    completeTransaction
  } = useApp();

  // Selected HP Baru (from inventory)
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // HP Lama Specs
  const [oldBrand, setOldBrand] = useState('');
  const [oldModel, setOldModel] = useState('');
  const [oldWarna, setOldWarna] = useState('');
  const [oldRam, setOldRam] = useState('');
  const [oldRom, setOldRom] = useState('');
  const [oldImei, setOldImei] = useState('');
  const [oldBatteryHealth, setOldBatteryHealth] = useState('80');
  const [oldGaransiAsal, setOldGaransiAsal] = useState('Inter');
  const [oldGradeFisik, setOldGradeFisik] = useState('B');
  const [oldFaceId, setOldFaceId] = useState(true);
  const [oldTrueTone, setOldTrueTone] = useState(true);
  const [taksiranHarga, setTaksiranHarga] = useState('');

  // Seller Info (Legal Log)
  const [sellerName, setSellerName] = useState('');
  const [sellerKtp, setSellerKtp] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [ktpPreview, setKtpPreview] = useState(null); // String Base64 or Mock image url

  // Checkout States
  const [selectedSales, setSelectedSales] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashReceived, setCashReceived] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // List of new gadgets in inventory
  const availableNewGadgets = inventory.filter(
    (item) => item.kategori === 'Gadget' && item.kondisi === 'Baru' && item.stok > 0
  );

  const newProductObj = inventory.find((p) => p.id === selectedProduct);
  const hargaBaru = newProductObj ? newProductObj.hargaJual : 0;
  const taksiranVal = parseFloat(taksiranHarga) || 0;
  const sisaBayar = Math.max(0, hargaBaru - taksiranVal);
  const isApple = oldBrand.toLowerCase() === 'apple' || oldBrand.toLowerCase() === 'iphone';

  // Handle Mock KTP Image File Upload
  const handleKtpUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateMockKtp = () => {
    // Set a mock KTP image for easier simulation without file upload
    setKtpPreview('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=250&h=160');
  };

  const handleOpenCheckout = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Silakan pilih HP Baru yang ingin dibeli pelanggan.');
      return;
    }
    if (!oldImei || oldImei.length !== 15) {
      alert('Nomor IMEI HP lama 15 digit wajib diisi!');
      return;
    }
    if (!taksiranHarga || parseFloat(taksiranHarga) <= 0) {
      alert('Taksiran harga HP lama wajib diisi.');
      return;
    }
    if (!sellerName || !sellerKtp || sellerKtp.length !== 16 || !sellerPhone) {
      alert('Identitas Penjual lengkap dan valid (No KTP 16 digit) wajib diisi untuk keamanan hukum.');
      return;
    }
    if (!ktpPreview) {
      alert('Foto KTP Penjual wajib diunggah/diambil untuk log keamanan tadahan.');
      return;
    }
    if (!selectedSales) {
      alert('Silakan pilih Salesperson untuk komisi transaksi.');
      return;
    }

    setCashReceived(sisaBayar);
    setShowPaymentModal(true);
  };

  const handleProcessTradeIn = () => {
    let cash = parseFloat(cashReceived) || sisaBayar;
    if (paymentMethod === 'Tunai' && cash < sisaBayar) {
      alert('Uang yang diterima kurang dari sisa bayar!');
      return;
    }

    const change = paymentMethod === 'Tunai' ? Math.max(0, cash - sisaBayar) : 0;

    // Compile Trade-In attributes
    const tradeInDetails = {
      isTradeIn: true,
      brand: oldBrand,
      model: oldModel,
      warna: oldWarna,
      ram: oldRam,
      rom: oldRom,
      imei: oldImei,
      taksiranHarga: taksiranVal,
      batteryHealth: isApple ? parseInt(oldBatteryHealth) : null,
      garansiAsal: oldGaransiAsal,
      gradeFisik: oldGradeFisik,
      faceId: oldFaceId,
      trueTone: oldTrueTone,
      // Seller info
      sellerName,
      sellerKtp,
      sellerPhone,
      ktpImage: ktpPreview
    };

    const res = completeTransaction({
      items: [{ ...newProductObj, qty: 1 }], // Checkout 1 HP Baru
      salesperson: selectedSales,
      discount: 0,
      total: sisaBayar,
      paymentMethod,
      cashAmount: paymentMethod === 'Tunai' ? cash : sisaBayar,
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
        total: sisaBayar,
        paymentMethod,
        cashAmount: paymentMethod === 'Tunai' ? cash : sisaBayar,
        changeAmount: change
      });

      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Reset form
      setSelectedProduct('');
      setOldBrand('');
      setOldModel('');
      setOldWarna('');
      setOldRam('');
      setOldRom('');
      setOldImei('');
      setTaksiranHarga('');
      setSellerName('');
      setSellerKtp('');
      setSellerPhone('');
      setKtpPreview(null);
      setSelectedSales('');
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
          Proses transaksi tukar tambah gadget baru dengan HP lama pelanggan. Data IMEI HP lama & berkas KTP penjual terintegrasi otomatis.
        </p>
      </div>

      <form onSubmit={handleOpenCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL 1: CALCULATOR STOK (Lg: 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: HP Baru yang Dibeli */}
          <Card title="1. Pilih HP Baru Toko" headerBg="bg-orange-100/70" bodyClassName="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">HP Baru</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200"
              >
                <option value="">-- Pilih HP Baru di Stok --</option>
                {availableNewGadgets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.model} ({p.warna} • {p.ram}/{p.rom}) - {handleFormatRupiah(p.hargaJual)}
                  </option>
                ))}
              </select>
            </div>

            {newProductObj && (
              <div className="bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3.5 text-xs flex justify-between font-bold shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-none text-slate-600 dark:text-slate-400">
                <span>Harga HP Baru Toko:</span>
                <span className="text-slate-800 dark:text-slate-200">{handleFormatRupiah(hargaBaru)}</span>
              </div>
            )}
          </Card>

          {/* Section 2: HP Lama Pelanggan */}
          <Card title="2. Spesifikasi HP Lama Pelanggan" headerBg="bg-sky-100/70" bodyClassName="p-4 flex flex-col gap-4 text-slate-700 dark:text-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Brand / Merk"
                placeholder="Contoh: Apple, Samsung"
                value={oldBrand}
                onChange={(e) => setOldBrand(e.target.value)}
                required
              />
              <Input
                label="Model HP"
                placeholder="Contoh: iPhone X, Galaxy S10"
                value={oldModel}
                onChange={(e) => setOldModel(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Warna"
                placeholder="Contoh: Space Gray"
                value={oldWarna}
                onChange={(e) => setOldWarna(e.target.value)}
                required
              />
              <Input
                label="RAM"
                placeholder="Contoh: 4 GB"
                value={oldRam}
                onChange={(e) => setOldRam(e.target.value)}
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

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nomor IMEI HP Lama (15 Digit)"
                placeholder="IMEI unit HP lama"
                value={oldImei}
                onChange={(e) => setOldImei(e.target.value.replace(/\D/g, ''))}
                maxLength={15}
                required
              />
              <Input
                label="Taksiran Harga Beli HP Lama (Rp)"
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
                Kondisi & Grade HP Lama (Auto Masuk Stok Bekas)
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Garansi Asal</label>
                  <select
                    value={oldGaransiAsal}
                    onChange={(e) => setOldGaransiAsal(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all duration-200"
                  >
                    <option value="iBox">iBox / Resmi Indo</option>
                    <option value="Inter">Inter / Internasional</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Grade Kemulusan</label>
                  <select
                    value={oldGradeFisik}
                    onChange={(e) => setOldGradeFisik(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all duration-200"
                  >
                    <option value="A">Grade A (Mulus)</option>
                    <option value="B">Grade B (Normal)</option>
                    <option value="C">Grade C (Minus Fisik)</option>
                  </select>
                </div>

                {isApple ? (
                  <Input
                    label="Battery Health (%)"
                    type="number"
                    value={oldBatteryHealth}
                    onChange={(e) => setOldBatteryHealth(e.target.value)}
                    placeholder="80"
                  />
                ) : (
                  <div className="flex flex-col gap-1 opacity-50">
                    <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">BH %</label>
                    <div className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">-</div>
                  </div>
                )}
              </div>

              {isApple && (
                <div className="grid grid-cols-2 gap-3 mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 rounded-xl p-2.5 shadow-sm dark:shadow-none">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">FaceID / TouchID</label>
                    <select
                      value={oldFaceId}
                      onChange={(e) => setOldFaceId(e.target.value === 'true')}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-800 outline-none"
                    >
                      <option value="true">Normal (ON)</option>
                      <option value="false">Mati (OFF)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">TrueTone</label>
                    <select
                      value={oldTrueTone}
                      onChange={(e) => setOldTrueTone(e.target.value === 'true')}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-800 outline-none"
                    >
                      <option value="true">Normal (ON)</option>
                      <option value="false">Mati (OFF)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* PANEL 2: LEGAL LOG & CALCULATION RESULT (Lg: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Section 3: Legal Log Penjual */}
          <Card title="3. Berkas Hukum Penjual" headerBg="bg-rose-100/70" headerAction={<ShieldAlert size={16} className="text-slate-600 dark:text-slate-400 animate-pulse" />} bodyClassName="p-4 flex flex-col gap-4">
            <span className="text-[9px] font-bold text-red-500 dark:text-red-400 uppercase leading-normal">
              *Hukum: Log ini wajib dicatat untuk melindungi toko dari risiko penadahan barang kriminal.
            </span>
            <Input
              label="Nama Lengkap Penjual"
              placeholder="Sesuai KTP"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              required
            />
            <Input
              label="Nomor KTP (16 Digit)"
              placeholder="320xxxxxxxxxxxxx"
              value={sellerKtp}
              onChange={(e) => setSellerKtp(e.target.value.replace(/\D/g,''))}
              maxLength={16}
              required
            />
            <Input
              label="Nomor HP Aktif"
              placeholder="08xxxxxxxxxx"
              value={sellerPhone}
              onChange={(e) => setSellerPhone(e.target.value)}
              required
            />

            {/* Foto KTP Upload Simulation */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Upload / Foto KTP</label>
              {ktpPreview ? (
                <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl w-full h-[140px] overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                  <img src={ktpPreview} alt="KTP Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setKtpPreview(null)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl h-[140px] flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/30 text-center gap-2">
                  <Camera size={24} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Unggah foto KTP fisik penjual</span>
                  <div className="flex gap-2">
                    <label className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-700 dark:hover:text-orange-400 hover:scale-105 transition-all shadow-sm">
                      Pilih File
                      <input type="file" accept="image/*" onChange={handleKtpUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateMockKtp}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-700 dark:hover:text-orange-400 hover:scale-105 transition-all cursor-pointer shadow-sm"
                    >
                      Mock KTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

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
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">SISA HARUS DIBAYAR PELANGGAN</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100">{handleFormatRupiah(sisaBayar)}</span>
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

      {/* MODAL 1: PAY SISA BAYAR */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pembayaran Selisih Trade-In"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 rounded-2xl border border-white/50 dark:border-slate-800/40 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7)] dark:shadow-none p-4 text-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-500 block">SISA PEMBAYARAN</span>
            <span className="text-2xl font-black">{handleFormatRupiah(sisaBayar)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {['Tunai', 'QRIS', 'Transfer Bank', 'Kartu Kredit', 'Paylater'].map((method) => (
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
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">SIMULASI VERIFIKASI QRIS/TF</span>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Pindai kode QR atau lakukan transfer bank untuk melunasi sisa selisih trade-in.
              </p>
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
                <span className="font-bold text-slate-700 dark:text-slate-200">{receiptData?.salesperson}</span>
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
                  <span>1x {receiptData?.oldDevice?.brand} {receiptData?.oldDevice?.model}</span>
                  <span className="text-red-500 dark:text-red-400">-{handleFormatRupiah(receiptData?.oldDevice?.taksiranHarga || 0)}</span>
                </div>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 block mt-0.5 font-bold">IMEI: {receiptData?.oldDevice?.imei}</span>
              </div>
            </div>

            {/* Calculations */}
            <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <div className="flex justify-between font-black text-xs border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 text-slate-800 dark:text-slate-100">
                <span>SELISIH BAYAR:</span>
                <span>{handleFormatRupiah(receiptData?.total || 0)}</span>
              </div>
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
            </div>

            <div className="border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-2 text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
              <div>Penjual: {receiptData?.oldDevice?.sellerName} (KTP: {receiptData?.oldDevice?.sellerKtp})</div>
              <div className="mt-1 text-center font-black uppercase text-emerald-500 dark:text-emerald-400">DOKUMEN HUKUM DISIMPAN</div>
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
