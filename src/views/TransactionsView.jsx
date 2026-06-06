import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import logoImg from '../assets/logo.png';
import { Search, Eye, FileText, Printer, Share2 } from 'lucide-react';

export const TransactionsView = () => {
  const { transactions, salespersons, currentUser } = useApp();
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Semua');
  const [selectedSalesperson, setSelectedSalesperson] = useState('Semua');

  // Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTx, setActiveTx] = useState(null);

  // Format Helper
  const handleFormatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Filtered transactions
  const filteredTx = transactions.filter((tx) => {
    // Search by invoice, salesperson, or item details (model, imei)
    const matchesSearch = 
      tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.salesperson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.items.some(
        (item) =>
          item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.imei && item.imei.includes(searchQuery))
      );

    const matchesMethod = 
      selectedMethod === 'Semua' || 
      tx.paymentMethod === selectedMethod;

    const matchesSalesperson = 
      selectedSalesperson === 'Semua' || 
      tx.salesperson === selectedSalesperson;

    return matchesSearch && matchesMethod && matchesSalesperson;
  });

  const handleOpenDetail = (tx) => {
    setActiveTx(tx);
    setShowDetailModal(true);
  };

  const getSubtotal = (items) => {
    return items.reduce((acc, item) => acc + item.hargaJual * item.qty, 0);
  };

  return (
    <div className="p-4 flex flex-col gap-6 text-left dark:text-slate-200">
      {/* Header Block */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300">
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
          <FileText size={22} className="text-orange-500 dark:text-orange-400" />
          Riwayat Penjualan & Transaksi Toko
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
          Cari nota penjualan lama berdasarkan nomor Invoice, nama Sales, nama produk, atau nomor IMEI untuk memverifikasi klaim garansi pelanggan.
        </p>
      </div>

      <Card
        title="Daftar Nota / Invoice Transaksi"
        headerBg="bg-orange-100/70"
        bodyClassName="p-4 flex flex-col gap-4"
        headerAction={
          <div className="flex gap-2 w-full overflow-x-auto scrollbar-none pb-0.5">
            {['Semua', 'Tunai', 'QRIS', 'Transfer Bank', 'Kartu Kredit', 'Paylater'].map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`
                  px-3 py-1.5 rounded-xl font-extrabold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer border border-transparent shrink-0
                  ${selectedMethod === method 
                    ? 'bg-slate-800 dark:bg-orange-500 text-white dark:text-slate-950 shadow-sm' 
                    : 'bg-slate-100/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95'
                  }
                `}
              >
                {method}
              </button>
            ))}
          </div>
        }
      >
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-2">
          <div className="w-full md:max-w-sm">
            <Input
              placeholder="Cari No Invoice, Sales, Produk, IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap">Filter Sales:</span>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="Semua">Semua Sales</option>
              {salespersons.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
              <option value="Tanpa Sales">Tanpa Sales</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <Table
          headers={['No Invoice', 'Tanggal Transaksi', 'Karyawan (Sales)', 'Item Produk', 'Potongan', 'Total Bayar', 'Metode', 'Aksi']}
          rows={filteredTx}
          renderRow={(tx) => (
            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-350">
              <td className="px-4 py-3.5 font-mono">
                <div className="font-extrabold text-slate-800 dark:text-slate-100">{tx.invoiceNo}</div>
                <span className={`
                  text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border border-white/50 dark:border-slate-800/30 mt-1 inline-block shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)]
                  ${tx.type === 'Tukar Tambah' 
                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' 
                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  }
                `}>
                  {tx.type || 'Penjualan'}
                </span>
              </td>
              <td className="px-4 py-3.5">
                {new Date(tx.date).toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-3.5 font-bold">
                {tx.salesperson}
              </td>
              <td className="px-4 py-3.5 max-w-[200px]">
                <div className="flex flex-col gap-1">
                  {tx.items.map((item, idx) => (
                    <div key={idx} className="border-b border-slate-50 dark:border-slate-800/30 pb-1 last:pb-0">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.qty}x {item.model}</span>
                      {item.imei && <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">IMEI: {item.imei} ({item.kondisi})</div>}
                    </div>
                  ))}
                  {tx.tradeInDetails && (
                    <div className="mt-1 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800/40 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-1.5 text-[9px] text-slate-600 dark:text-slate-400">
                      <span className="font-black text-blue-600 dark:text-blue-400 block">HP LAMA DIRETUR:</span>
                      <span>{tx.tradeInDetails.brand} {tx.tradeInDetails.model} (IMEI: {tx.tradeInDetails.imei})</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5 text-red-500 dark:text-red-400 font-mono font-bold">
                {tx.discount > 0 ? `-${handleFormatRupiah(tx.discount)}` : 'Rp0'}
              </td>
              <td className="px-4 py-3.5 font-black font-mono text-slate-800 dark:text-slate-100">
                {handleFormatRupiah(tx.total)}
              </td>
              <td className="px-4 py-3.5 text-center font-bold uppercase text-[9px]">
                {tx.paymentMethod}
              </td>
              <td className="px-4 py-3.5 text-center">
                <button
                  onClick={() => handleOpenDetail(tx)}
                  title="Lihat Detail Nota"
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-700 dark:hover:text-orange-400 hover:scale-105 active:scale-95 shadow-sm dark:shadow-none transition-all cursor-pointer flex items-center gap-1.5 mx-auto font-bold uppercase text-[9px]"
                >
                  <Eye size={11} strokeWidth={2.5} />
                  <span>Detail</span>
                </button>
              </td>
            </tr>
          )}
        />
      </Card>

      {/* DETAIL MODAL (Nota Struk Copy) */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Salinan Struk Transaksi"
        maxWidth="max-w-sm"
      >
        {activeTx && (
          <div className="flex flex-col gap-4 text-center">
            {/* Struk Content */}
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
                  <span className="font-bold text-slate-700 dark:text-slate-200">{activeTx.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="dark:text-slate-300">{new Date(activeTx.date).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operator:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{activeTx.salesperson}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jenis:</span>
                  <span className="font-bold uppercase text-slate-700 dark:text-slate-200">{activeTx.type || 'Penjualan'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800/40 py-2.5 flex flex-col gap-2">
                {activeTx.items.map((item, idx) => (
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

                {/* If trade in details */}
                {activeTx.tradeInDetails && (
                  <div className="mt-1 pt-1.5 border-t border-dotted border-slate-200 dark:border-slate-800/40 flex flex-col bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-2 text-[9px] text-slate-600 dark:text-slate-400">
                    <span className="font-black text-blue-600 dark:text-blue-400 block">TUKAR TAMBAH (HP DITERIMA TOKO):</span>
                    <span className="font-bold">{activeTx.tradeInDetails.brand} {activeTx.tradeInDetails.model}</span>
                    <span>IMEI: {activeTx.tradeInDetails.imei}</span>
                    <span className="font-bold text-right text-red-500 dark:text-red-400">-{handleFormatRupiah(activeTx.tradeInDetails.taksiranHarga)}</span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-1 text-[9px] text-slate-550 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="dark:text-slate-300">{handleFormatRupiah(getSubtotal(activeTx.items))}</span>
                </div>
                {activeTx.discount > 0 && (
                  <div className="flex justify-between text-red-500 dark:text-red-400">
                    <span>Diskon:</span>
                    <span>-{handleFormatRupiah(activeTx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 text-slate-800 dark:text-slate-100">
                  <span>TOTAL:</span>
                  <span>{handleFormatRupiah(activeTx.total)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Bayar ({activeTx.paymentMethod}):</span>
                  <span className="uppercase dark:text-slate-300">{handleFormatRupiah(activeTx.cashAmount)}</span>
                </div>
                {activeTx.paymentMethod === 'Tunai' && (
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span className="dark:text-slate-300">{handleFormatRupiah(activeTx.changeAmount)}</span>
                  </div>
                )}
              </div>

              {activeTx.tradeInDetails && (
                <div className="border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-2 text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
                  <div className="text-[9px] font-black text-slate-500 dark:text-slate-400">DATA HUKUM PENJUAL:</div>
                  <div>Nama: {activeTx.tradeInDetails.sellerName}</div>
                  <div>KTP: {activeTx.tradeInDetails.sellerKtp}</div>
                  <div>HP: {activeTx.tradeInDetails.sellerPhone}</div>
                </div>
              )}

              <div className="text-center border-t border-dashed border-slate-200 dark:border-slate-800/40 pt-3 mt-2 text-[8px] text-slate-400 dark:text-slate-500 font-bold">
                <span>TERIMA KASIH ATAS KUNJUNGAN ANDA</span>
                <span className="block mt-0.5">Garansi Toko wajib membawa nota ini / IMEI tercatat.</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="white"
                className="flex-1 flex items-center justify-center gap-1.5 !rounded-xl"
                onClick={() => alert('Mencetak ulang salinan struk transaksi...')}
              >
                <Printer size={14} />
                <span>Cetak Nota</span>
              </Button>
              <Button
                variant="blue"
                className="flex-1 flex items-center justify-center gap-1.5 !rounded-xl"
                onClick={() => alert(`Membagikan salinan nota ke WhatsApp...`)}
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </Button>
            </div>
            
            <Button
              variant="green"
              className="w-full mt-1 py-3 !rounded-xl"
              onClick={() => setShowDetailModal(false)}
            >
              Selesai
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default TransactionsView;
