import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Search, 
  DollarSign, 
  FileText,
  User,
  Smartphone,
  Info
} from 'lucide-react';

export const ServisView = () => {
  const {
    inventory,
    salespersons,
    completeTransaction,
    currentUser
  } = useApp();

  // Consumer & HP States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [jasaServis, setJasaServis] = useState('');

  // Selected Sparepart State
  const [selectedSparepartId, setSelectedSparepartId] = useState('');
  const [sparepartSearchQuery, setSparepartSearchQuery] = useState('');
  const [sparepartQty, setSparepartQty] = useState('1');
  const [usedSpareparts, setUsedSpareparts] = useState([]);

  // Checkout & Payment States
  const [selectedSales, setSelectedSales] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashReceived, setCashReceived] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Split Payment States
  const [isSplit, setIsSplit] = useState(false);
  const [splitMethod1, setSplitMethod1] = useState('Tunai');
  const [splitAmount1, setSplitAmount1] = useState('');
  const [splitMethod2, setSplitMethod2] = useState('Transfer Bank');
  const [splitAmount2, setSplitAmount2] = useState('');

  // Filter Spareparts (items with kategori === 'Aksesoris' or 'Sparepart' and stock > 0)
  const availableSpareparts = inventory.filter(
    (item) => (item.kategori === 'Aksesoris' || item.kategori === 'Sparepart') && item.stok > 0
  );

  const sparepartSearchResults = sparepartSearchQuery.trim()
    ? availableSpareparts.filter(
        (item) =>
          item.model.toLowerCase().includes(sparepartSearchQuery.toLowerCase()) ||
          (item.sku && item.sku.toLowerCase().includes(sparepartSearchQuery.toLowerCase()))
      )
    : [];

  const handleAddSparepart = (e) => {
    e.preventDefault();
    if (!selectedSparepartId) {
      alert('Silakan pilih sparepart terlebih dahulu.');
      return;
    }

    const sparepartObj = inventory.find((p) => p.id === selectedSparepartId);
    if (!sparepartObj) return;

    const qtyVal = parseInt(sparepartQty) || 1;
    if (qtyVal <= 0) {
      alert('Kuantitas sparepart harus lebih besar dari 0.');
      return;
    }

    if (qtyVal > sparepartObj.stok) {
      alert(`Stok tidak mencukupi. Hanya tersedia ${sparepartObj.stok} unit.`);
      return;
    }

    // Check if already in local list
    const existingIndex = usedSpareparts.findIndex((item) => item.id === selectedSparepartId);
    if (existingIndex > -1) {
      const newQty = usedSpareparts[existingIndex].qty + qtyVal;
      if (newQty > sparepartObj.stok) {
        alert(`Jumlah total melebihi stok yang tersedia (${sparepartObj.stok} unit).`);
        return;
      }
      setUsedSpareparts((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: newQty } : item
        )
      );
    } else {
      setUsedSpareparts((prev) => [
        ...prev,
        {
          id: sparepartObj.id,
          sku: sparepartObj.sku,
          model: sparepartObj.model,
          hargaJual: sparepartObj.hargaJual,
          qty: qtyVal,
          imei: sparepartObj.imei,
          kategori: sparepartObj.kategori
        }
      ]);
    }

    // Reset input
    setSelectedSparepartId('');
    setSparepartSearchQuery('');
    setSparepartQty('1');
  };

  const handleRemoveSparepart = (id) => {
    setUsedSpareparts((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const sparepartsTotal = usedSpareparts.reduce(
    (acc, item) => acc + item.hargaJual * item.qty,
    0
  );
  const jasaVal = parseFloat(jasaServis) || 0;
  const grandTotal = sparepartsTotal + jasaVal;

  const handleOpenCheckout = (e) => {
    e.preventDefault();
    if (!deviceModel) {
      alert('Model iPhone yang diservis wajib diisi!');
      return;
    }
    if (selectedSparepartId) {
      const sparepartObj = inventory.find((p) => p.id === selectedSparepartId);
      const name = sparepartObj ? sparepartObj.model : 'sparepart';
      alert(`Peringatan: Anda telah memilih sparepart '${name}' tetapi belum mengklik tombol 'Tambahkan'! Silakan klik 'Tambahkan' terlebih dahulu agar masuk ke tagihan, atau kosongkan pilihan sparepart jika tidak digunakan.`);
      return;
    }
    if (jasaVal <= 0 && usedSpareparts.length === 0) {
      alert('Transaksi harus memiliki biaya jasa servis or minimal satu sparepart.');
      return;
    }
    if (!selectedSales) {
      alert('Silakan pilih karyawan/sales yang melayani.');
      return;
    }

    // Set default cash input
    setCashReceived(grandTotal);
    setSplitAmount1(Math.round(grandTotal / 2));
    setSplitAmount2(Math.round(grandTotal / 2));
    setShowPaymentModal(true);
  };

  const handleProcessServis = () => {
    let cash = parseFloat(cashReceived) || grandTotal;
    if (!isSplit && paymentMethod === 'Tunai' && cash < grandTotal) {
      alert('Uang yang diterima kurang dari total tagihan!');
      return;
    }

    if (isSplit) {
      const sumAmount = (parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0);
      if (sumAmount < grandTotal) {
        alert('Total nominal split payment kurang dari total tagihan!');
        return;
      }
      const hasCash = splitMethod1 === 'Tunai' || splitMethod2 === 'Tunai';
      if (!hasCash && sumAmount !== grandTotal) {
        alert('Untuk non-tunai, jumlah nominal split payment harus pas dengan total tagihan!');
        return;
      }
    }

    const change = isSplit
      ? ((splitMethod1 === 'Tunai' || splitMethod2 === 'Tunai') ? Math.max(0, ((parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0)) - grandTotal) : 0)
      : (paymentMethod === 'Tunai' ? Math.max(0, cash - grandTotal) : 0);

    const payMethodName = isSplit ? `${splitMethod1} + ${splitMethod2}` : paymentMethod;

    // Prepare items for completed transaction
    const finalItems = [...usedSpareparts];
    if (jasaVal > 0) {
      finalItems.push({
        id: 'jasa_servis_' + Date.now(),
        sku: 'SRV-JASA',
        model: `Jasa Servis (${deviceModel})`,
        qty: 1,
        hargaJual: jasaVal,
        hargaBeli: 0, // Explicitly set cost to 0 for service fee
        kategori: 'Servis',
        imei: '-'
      });
    }

    const res = completeTransaction({
      items: finalItems,
      salesperson: selectedSales,
      salespersonRole: '-',
      discount: 0,
      total: grandTotal,
      paymentMethod: payMethodName,
      cashAmount: isSplit ? (splitMethod1 === 'Tunai' ? parseFloat(splitAmount1) : (splitMethod2 === 'Tunai' ? parseFloat(splitAmount2) : 0)) : (paymentMethod === 'Tunai' ? cash : grandTotal),
      changeAmount: change,
      isSplitPayment: isSplit,
      splitDetails: isSplit ? { method1: splitMethod1, amount1: parseFloat(splitAmount1), method2: splitMethod2, amount2: parseFloat(splitAmount2) } : null,
      type: 'Servis' // Set custom type to Servis
    });

    if (res.success) {
      setReceiptData({
        invoiceNo: res.invoiceNo,
        date: res.transaction.date,
        customerName,
        customerPhone,
        deviceModel,
        issueDescription,
        spareparts: [...usedSpareparts], // Clone to avoid state reset reference issues
        jasaVal,
        salesperson: selectedSales,
        salespersonRole: '-',
        total: grandTotal,
        paymentMethod: payMethodName,
        cashAmount: isSplit ? ((splitMethod1 === 'Tunai' ? parseFloat(splitAmount1) : 0) + (splitMethod2 === 'Tunai' ? parseFloat(splitAmount2) : 0)) : (paymentMethod === 'Tunai' ? cash : grandTotal),
        changeAmount: change,
        isSplitPayment: isSplit,
        splitDetails: isSplit ? { method1: splitMethod1, amount1: parseFloat(splitAmount1), method2: splitMethod2, amount2: parseFloat(splitAmount2) } : null
      });

      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Reset Form
      setCustomerName('');
      setCustomerPhone('');
      setDeviceModel('');
      setIssueDescription('');
      setJasaServis('');
      setUsedSpareparts([]);
      setSelectedSales('');
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
    <div className="p-4 flex flex-col gap-6 text-left dark:text-slate-200">
      
      {/* Header Block */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300">
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
          <Wrench size={22} className="text-amber-500 animate-pulse" />
          Modul Transaksi Servis & Sparepart
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
          Catat transaksi perbaikan perangkat konsumen, pilih suku cadang/aksesoris yang digunakan, masukkan biaya jasa, dan cetak invoice struk servis.
        </p>
      </div>

      <form onSubmit={handleOpenCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL LEFT: FORM DATA & SPAREPART (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card 1: Customer & Device Info */}
          <Card title="1. Informasi Konsumen & Unit iPhone" headerBg="bg-amber-100/70" bodyClassName="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nama Pelanggan"
                placeholder="Contoh: Budi Cahyono"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                icon={User}
              />
              <Input
                label="No. Telepon / WA"
                placeholder="Contoh: 0812xxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div className="w-full">
              <Input
                label="Model iPhone"
                placeholder="Contoh: iPhone 11 Pro, iPhone 13"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                required
                icon={Smartphone}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Masalah / Deskripsi Kerusakan</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Jelaskan jenis perbaikan (contoh: Ganti Baterai Health Drop, LCD Pecah)..."
                required
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-950/50 outline-none transition-all duration-200"
              />
            </div>
          </Card>

          {/* Card 2: Spareparts Selection */}
          <Card title="2. Penggunaan Sparepart / Aksesoris" headerBg="bg-orange-100/70" bodyClassName="p-4 flex flex-col gap-4" className="!overflow-visible z-40">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              
              <div className="flex-1 flex flex-col gap-1 text-left relative">
                <Input
                  label="Pilih Sparepart / Aksesoris"
                  placeholder="Ketik nama sparepart atau SKU..."
                  value={sparepartSearchQuery}
                  onChange={(e) => {
                    setSparepartSearchQuery(e.target.value);
                    if (selectedSparepartId) setSelectedSparepartId('');
                  }}
                />
                {sparepartSearchResults.length > 0 && !selectedSparepartId && (
                  <div className="absolute top-[62px] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-neo dark:shadow-neo-dark z-50 max-h-48 overflow-y-auto flex flex-col p-1 gap-1">
                    {sparepartSearchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedSparepartId(p.id);
                          setSparepartSearchQuery(p.model);
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <div>
                          <span className="block font-extrabold text-slate-800 dark:text-slate-100">{p.model}</span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">SKU: {p.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-slate-800 dark:text-slate-100 font-mono">{handleFormatRupiah(p.hargaJual)}</span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500">Stok: {p.stok} unit</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {sparepartSearchQuery && sparepartSearchResults.length === 0 && !selectedSparepartId && (
                  <div className="text-[10px] font-bold text-red-500 dark:text-red-400 pl-1 mt-0.5">
                    Sparepart tidak ditemukan.
                  </div>
                )}
              </div>

              <div className="w-full md:w-28">
                <Input
                  label="Jumlah (Qty)"
                  type="number"
                  value={sparepartQty}
                  onChange={(e) => setSparepartQty(e.target.value)}
                  min="1"
                />
              </div>

              <Button
                variant="green"
                type="button"
                onClick={handleAddSparepart}
                className="h-[43px] flex items-center justify-center gap-1.5 !rounded-xl"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Tambahkan</span>
              </Button>
            </div>

            {/* Local Spareparts Table */}
            {usedSpareparts.length > 0 ? (
              <div className="border border-slate-100 dark:border-slate-800/40 rounded-2xl overflow-hidden mt-2">
                <Table
                  headers={['SKU', 'Nama Sparepart', 'Qty', 'Harga', 'Subtotal', 'Hapus']}
                  rows={usedSpareparts}
                  renderRow={(item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold text-slate-750 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/40">
                      <td className="px-4 py-2 font-mono">{item.sku}</td>
                      <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200">{item.model}</td>
                      <td className="px-4 py-2 text-center">{item.qty} pcs</td>
                      <td className="px-4 py-2 font-mono">{handleFormatRupiah(item.hargaJual)}</td>
                      <td className="px-4 py-2 font-bold font-mono text-slate-850 dark:text-slate-100">{handleFormatRupiah(item.hargaJual * item.qty)}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSparepart(item.id)}
                          className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  )}
                />
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 bg-slate-50/40 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5">
                <Info size={14} />
                Belum ada sparepart/suku cadang yang ditambahkan untuk servis ini (Servis Jasa Saja).
              </div>
            )}
          </Card>

          {/* Card 3: Service Fee */}
          <Card title="3. Biaya Jasa Servis Teknis" headerBg="bg-sky-100/70" bodyClassName="p-4">
            <div className="w-full md:max-w-xs">
              <Input
                label="Biaya Jasa Servis (Rp) *"
                type="number"
                placeholder="Masukkan biaya jasa teknisi"
                value={jasaServis}
                onChange={(e) => setJasaServis(e.target.value)}
                required
                icon={DollarSign}
              />
            </div>
          </Card>
        </div>

        {/* PANEL RIGHT: CHECKOUT SUMMARY (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card title="Ringkasan Biaya Servis" headerBg="bg-purple-100/70" bodyClassName="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Total Sparepart:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{handleFormatRupiah(sparepartsTotal)}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800/60 pb-2.5">
                <span>Biaya Jasa Teknis:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{handleFormatRupiah(jasaVal)}</span>
              </div>
              
              <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-3.5 mt-1">
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">TOTAL BIAYA SERVIS</span>
                <span className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono">{handleFormatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Sales Melayani */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
                Teknisi / Sales Melayani
              </label>
              <select
                value={selectedSales}
                onChange={(e) => setSelectedSales(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-amber-105 outline-none transition-all duration-200"
              >
                <option value="">-- Pilih Karyawan --</option>
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
              className="w-full py-3.5 flex items-center justify-center gap-2 !rounded-2xl mt-2"
            >
              <DollarSign size={16} strokeWidth={2.5} />
              <span>Proses Pembayaran Servis</span>
            </Button>
          </Card>
        </div>
      </form>

      {/* MODAL 1: CHOOSE PAYMENT METHOD */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pembayaran Transaksi Servis"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-left">
          
          <div className="bg-amber-100 dark:bg-amber-950/45 text-amber-700 dark:text-amber-400 rounded-2xl border border-white/50 dark:border-slate-800/40 p-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 block">TOTAL TAGIHAN SERVIS</span>
            <span className="text-2xl font-black font-mono">{handleFormatRupiah(grandTotal)}</span>
          </div>

          {/* Split Payment Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/35 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-3.5 mt-1 select-none">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-150">Split Payment (Metode Ganda)</span>
              <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500">Mendukung kombinasi 2 cara pembayaran yang berbeda</span>
            </div>
            <input 
              type="checkbox" 
              checked={isSplit} 
              onChange={(e) => setIsSplit(e.target.checked)}
              className="w-5.5 h-5.5 rounded-lg border-slate-200 dark:border-slate-800 text-orange-500 focus:ring-orange-400 cursor-pointer"
            />
          </div>

          {!isSplit ? (
            // SINGLE PAYMENT METHOD
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Tunai', 'Transfer Bank'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        px-1 py-2.5 text-center rounded-xl border border-transparent font-extrabold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer
                        ${paymentMethod === method 
                          ? 'bg-slate-800 dark:bg-orange-500 text-white shadow-sm' 
                          : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-350 hover:scale-105 active:scale-95'
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
                            ? 'bg-slate-800 dark:bg-orange-500 text-white shadow-sm' 
                            : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-350 hover:scale-105 active:scale-95'
                          }
                        `}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'Tunai' ? (
                <div className="flex flex-col gap-3">
                  <Input
                    label="Uang Diterima (Rp) *"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    required
                    className="font-black text-lg text-slate-850 dark:text-slate-100"
                    autoFocus
                  />
                  <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 p-4 flex justify-between items-center">
                    <span className="font-extrabold text-xs text-slate-450 dark:text-slate-500">KEMBALIAN:</span>
                    <span className="font-black text-base text-slate-850 dark:text-slate-200 font-mono">
                      {handleFormatRupiah(Math.max(0, (parseFloat(cashReceived) || grandTotal) - grandTotal))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-slate-50/60 dark:bg-slate-950/30 p-5 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">
                    {paymentMethod.startsWith('Paylater') ? `Simulasi Paylater (${paymentMethod.replace('Paylater - ', '')})` : 'GESEK EDC / TRANSFER BANK'}
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {paymentMethod.startsWith('Paylater')
                      ? `Silakan lakukan proses pengajuan limit/transaksi melalui aplikasi ${paymentMethod.replace('Paylater - ', '')} pelanggan. Transaksi akan tercatat setelah menekan tombol "Selesaikan Transaksi".`
                      : 'Silakan gunakan mesin EDC toko atau minta pelanggan melakukan transfer bank untuk melunasi biaya servis ini.'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            // SPLIT PAYMENT METHOD
            <div className="flex flex-col gap-4 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 p-4">
              
              {/* Payment 1 */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500">Pembayaran 1</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={splitMethod1}
                    onChange={(e) => setSplitMethod1(e.target.value)}
                    className="border border-slate-200 dark:border-slate-855 rounded-xl px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    {['Tunai', 'Transfer Bank', 'Paylater - Indodana', 'Paylater - Kredivo', 'Paylater - Spaylater', 'Paylater - Akulaku'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Nominal"
                    value={splitAmount1}
                    onChange={(e) => setSplitAmount1(parseFloat(e.target.value) || '')}
                    className="border border-slate-200 dark:border-slate-850 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Payment 2 */}
              <div className="flex flex-col gap-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500">Pembayaran 2</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={splitMethod2}
                    onChange={(e) => setSplitMethod2(e.target.value)}
                    className="border border-slate-200 dark:border-slate-855 rounded-xl px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    {['Tunai', 'Transfer Bank', 'Paylater - Indodana', 'Paylater - Kredivo', 'Paylater - Spaylater', 'Paylater - Akulaku'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Nominal"
                    value={splitAmount2}
                    onChange={(e) => setSplitAmount2(parseFloat(e.target.value) || '')}
                    className="border border-slate-200 dark:border-slate-850 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Validation Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3 flex flex-col gap-1 text-[10px] font-bold text-slate-500 mt-1">
                <div className="flex justify-between">
                  <span>Total Terbayar:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {handleFormatRupiah((parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Selisih / Sisa:</span>
                  <span className={`font-black ${
                    ((parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0)) >= grandTotal ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {handleFormatRupiah(Math.max(0, grandTotal - ((parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0))))}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 border-t border-slate-50 dark:border-slate-800/40 pt-3">
            <Button variant="white" onClick={() => setShowPaymentModal(false)}>
              Batal
            </Button>
            <Button variant="green" onClick={handleProcessServis}>
              Selesaikan Transaksi
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: SERVICE RECEIPT */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Nota Invoice Servis"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 font-mono text-[11px] text-left flex flex-col gap-3 relative overflow-hidden shadow-sm transition-all duration-300">
            
            <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-800/40 pb-3">
              <span className="text-xs font-black tracking-wider block text-slate-700 dark:text-slate-200">IZYSTORE GADGET</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block">ITC Kuningan Lt. 3, Jakarta</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block">Nota Servis & Perbaikan</span>
            </div>

            <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>No Invoice:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{receiptData?.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{receiptData ? new Date(receiptData.date).toLocaleString('id-ID') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{receiptData?.customerName} ({receiptData?.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span>Perangkat:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{receiptData?.deviceModel}</span>
              </div>
              <div className="flex justify-between">
                <span>Teknisi / Sales:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {receiptData?.salesperson}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800/40 py-2.5 flex flex-col gap-2">
              <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 block">DESKRIPSI KERUSAKAN:</span>
              <p className="text-[9px] text-slate-650 dark:text-slate-350 m-0 leading-relaxed font-bold bg-slate-50 dark:bg-slate-900 rounded p-1.5 border border-slate-100 dark:border-slate-800/30">
                {receiptData?.issueDescription}
              </p>

              {receiptData?.spareparts && receiptData.spareparts.length > 0 && (
                <div className="border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-2 flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 block">SPAREPARTS / SUKU CADANG:</span>
                  {receiptData.spareparts.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-750 dark:text-slate-250">
                      <span>{item.qty}x {item.model}</span>
                      <span>{handleFormatRupiah(item.hargaJual * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}

              {receiptData?.jasaVal > 0 && (
                <div className="border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-2 flex justify-between font-bold text-slate-755 dark:text-slate-250">
                  <span>Jasa Teknis Servis</span>
                  <span>{handleFormatRupiah(receiptData.jasaVal)}</span>
                </div>
              )}
            </div>

            {/* Total Calculations */}
            <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <div className="flex justify-between font-black text-xs border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 text-slate-850 dark:text-slate-100">
                <span>TOTAL AKHIR:</span>
                <span>{handleFormatRupiah(receiptData?.total || 0)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Bayar ({receiptData?.paymentMethod}):</span>
                <span>{handleFormatRupiah(receiptData?.cashAmount || 0)}</span>
              </div>
              {receiptData?.paymentMethod.includes('Tunai') && (
                <div className="flex justify-between">
                  <span>Kembalian:</span>
                  <span>{handleFormatRupiah(receiptData?.changeAmount || 0)}</span>
                </div>
              )}
            </div>

            <div className="text-center border-t border-dashed border-slate-200 dark:border-slate-800/40 pt-3 mt-2 text-[8px] text-slate-400 dark:text-slate-500 font-bold">
              <span>TERIMA KASIH ATAS KEPERCAYAAN ANDA</span>
              <span className="block mt-0.5">Garansi servis 1 bulan wajib membawa nota struk ini.</span>
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

export default ServisView;
