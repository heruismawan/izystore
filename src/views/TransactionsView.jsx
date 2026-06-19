import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import logoImg from '../assets/logo.png';
import { Search, Eye, FileText, Printer, Share2, Calendar, X } from 'lucide-react';

export const TransactionsView = () => {
  const { transactions, salespersons, currentUser } = useApp();
  const isOwner = currentUser.role === 'owner';
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSalesperson, setSelectedSalesperson] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate, selectedSalesperson]);

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
    // Search by invoice, salesperson, or item details (model, imei, barcode)
    const matchesSearch = 
      tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.salesperson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.items.some(
        (item) =>
          item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.imei && item.imei.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesSalesperson = 
      selectedSalesperson === 'Semua' || 
      tx.salesperson === selectedSalesperson;

    // Filter by date range (local time comparison)
    let matchesDate = true;
    if (startDate || endDate) {
      const txLocalDate = new Date(tx.date);
      const year = txLocalDate.getFullYear();
      const month = String(txLocalDate.getMonth() + 1).padStart(2, '0');
      const day = String(txLocalDate.getDate()).padStart(2, '0');
      const txDateStr = `${year}-${month}-${day}`;
      
      if (startDate && txDateStr < startDate) {
        matchesDate = false;
      }
      if (endDate && txDateStr > endDate) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesSalesperson && matchesDate;
  });

  const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const displayedTx = filteredTx.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, activePage - 2);
      let end = Math.min(totalPages, activePage + 2);
      if (start === 1) {
        end = 5;
      } else if (end === totalPages) {
        start = totalPages - 4;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const handleOpenDetail = (tx) => {
    setActiveTx(tx);
    setShowDetailModal(true);
  };

  const getSubtotal = (items) => {
    return items.reduce((acc, item) => acc + item.hargaJual * item.qty, 0);
  };

  const handleExportCSV = () => {
    const headers = [
      'No Invoice',
      'Tanggal Transaksi',
      'Jenis Transaksi',
      'Karyawan (Sales)',
      'Helper',
      'Peran',
      'Item Produk',
      'Kode Barcode',
      'Item Tukar Tambah',
      'Taksiran Harga Tukar Tambah',
      ...(isOwner ? ['Modal', 'Harga Jual'] : []),
      'Total Bayar',
      'Metode Pembayaran'
    ];

    const csvRows = [headers.join(',')];

    filteredTx.forEach((tx) => {
      const itemsString = tx.items
        .map((item) => `${item.qty}x ${item.model} (IMEI: ${item.imei || '-'})`)
        .join('; ');
      
      const barcodesString = tx.items
        .map((item) => item.barcode || item.imei || '-')
        .join('; ');

      const tradeInModel = tx.tradeInDetails ? tx.tradeInDetails.model : '-';
      const tradeInTaksiran = tx.tradeInDetails ? tx.tradeInDetails.taksiranHarga : 0;

      const totalModal = tx.items.reduce((acc, item) => acc + (item.hargaBeli || 0) * item.qty, 0);
      const totalHargaJual = tx.items.reduce((acc, item) => acc + (item.hargaJual || 0) * item.qty, 0);

      const row = [
        `"${tx.invoiceNo}"`,
        `"${new Date(tx.date).toLocaleString('id-ID')}"`,
        `"${tx.type || 'Penjualan'}"`,
        `"${tx.salesperson}"`,
        `"${tx.helper || '-'}"`,
        `"${tx.salespersonRole || '-'}"`,
        `"${itemsString.replace(/"/g, '""')}"`,
        `"${barcodesString.replace(/"/g, '""')}"`,
        `"${tradeInModel.replace(/"/g, '""')}"`,
        tradeInTaksiran,
        ...(isOwner ? [totalModal, totalHargaJual] : []),
        tx.total,
        `"${tx.paymentMethod}"`
      ];

      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `riwayat-penjualan-izystore-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 flex flex-col gap-6 text-left dark:text-slate-200">
      {/* Header Block */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
            <FileText size={22} className="text-orange-500 dark:text-orange-400" />
            Riwayat Penjualan & Transaksi Toko
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Cari nota penjualan lama berdasarkan nomor Invoice, nama Sales, nama produk, atau nomor IMEI untuk memverifikasi klaim garansi pelanggan.
          </p>
        </div>
        <Button variant="green" onClick={handleExportCSV} className="flex items-center gap-1.5 !rounded-xl shrink-0">
          <Share2 size={14} strokeWidth={2.5} />
          <span>Ekspor Excel</span>
        </Button>
      </div>

      <Card
        title="Daftar Nota / Invoice Transaksi"
        headerBg="bg-orange-100/70"
        bodyClassName="p-4 flex flex-col gap-4"
      >
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-end justify-between mb-4 border-b border-slate-100 dark:border-slate-800/30 pb-4">
          <div className="w-full lg:max-w-xs">
            <Input
              label="Cari Nota"
              placeholder="No Invoice, Sales, Produk, IMEI, Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          
          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-44">
              <Input
                type="date"
                label="Mulai Tanggal"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                icon={Calendar}
                className="text-xs"
              />
            </div>
            <div className="w-full sm:w-44">
              <Input
                type="date"
                label="Sampai Tanggal"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                icon={Calendar}
                className="text-xs"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="h-[43px] px-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded-2xl hover:bg-red-100 dark:hover:bg-red-950/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                title="Hapus Filter Tanggal"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
          
          <div className="w-full lg:w-auto flex flex-col gap-1.5 text-left">
            <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 pl-1">Filter Sales:</span>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer h-[43px] min-w-[150px]"
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
          headers={
            isOwner
              ? ['No Invoice', 'Tanggal Transaksi', 'Karyawan (Sales)', 'Item Produk', 'Kode Barcode', 'Modal', 'Harga Jual', 'Total Bayar', 'Metode', 'Aksi']
              : ['No Invoice', 'Tanggal Transaksi', 'Karyawan (Sales)', 'Item Produk', 'Kode Barcode', 'Total Bayar', 'Metode', 'Aksi']
          }
          rows={displayedTx}
          renderRow={(tx) => {
            const totalModal = tx.items.reduce((acc, item) => acc + (item.hargaBeli || 0) * item.qty, 0);
            const totalHargaJual = tx.items.reduce((acc, item) => acc + (item.hargaJual || 0) * item.qty, 0);

            return (
              <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-350">
              <td className="px-2 py-2 font-mono">
                <div className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100">{tx.invoiceNo}</div>
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
              <td className="px-2 py-2 text-[9px] leading-tight">
                {new Date(tx.date).toLocaleString('id-ID')}
              </td>
              <td className="px-2 py-2">
                <div className="font-bold text-slate-800 dark:text-slate-100">{tx.salesperson || '-'}</div>
                {tx.helper && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Helper: <span className="font-bold">{tx.helper}</span>
                  </div>
                )}
              </td>
              <td className="px-2 py-2 max-w-[150px]">
                <div className="flex flex-col gap-0.5">
                  {tx.items.map((item, idx) => (
                    <div key={idx} className="border-b border-slate-50 dark:border-slate-800/30 pb-1 last:pb-0">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.qty}x {item.model}</span>
                      {item.imei && <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">IMEI: {item.imei} ({item.kondisi})</div>}
                    </div>
                  ))}
                  {tx.tradeInDetails && (
                    <div className="mt-0.5 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800/40 bg-blue-50/50 dark:bg-blue-950/20 rounded md p-1 text-[8px] text-slate-600 dark:text-slate-400">
                      <span className="font-black text-blue-600 dark:text-blue-400 block">HP LAMA DIRETUR:</span>
                      <div className="flex justify-between items-start mt-0.5">
                        <span>{tx.tradeInDetails.model}</span>
                        <span className="font-bold text-red-600 dark:text-red-400 whitespace-nowrap ml-1">-{handleFormatRupiah(tx.tradeInDetails.taksiranHarga)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-2 py-2 font-mono">
                <div className="flex flex-col gap-0.5">
                  {tx.items.map((item, idx) => (
                    <span key={idx} className="block text-[10px] text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 truncate max-w-[120px] font-bold" title={item.barcode || item.imei || '-'}>
                      {item.barcode || item.imei || '-'}
                    </span>
                  ))}
                </div>
              </td>
              {isOwner && (
                <>
                  <td className="px-2 py-2 font-bold font-mono text-red-600 dark:text-red-400">
                    {handleFormatRupiah(totalModal)}
                  </td>
                  <td className="px-2 py-2 font-bold font-mono text-blue-600 dark:text-blue-400">
                    {handleFormatRupiah(totalHargaJual)}
                  </td>
                </>
              )}
              <td className="px-2 py-2 font-black font-mono text-[11px] text-slate-800 dark:text-slate-100">
                {handleFormatRupiah(tx.total)}
              </td>
              <td className="px-2 py-2 text-center font-bold uppercase text-[8px]">
                {tx.paymentMethod}
              </td>
              <td className="px-2 py-2 text-center">
                <button
                  onClick={() => handleOpenDetail(tx)}
                  title="Lihat Detail Nota"
                  className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-700 dark:hover:text-orange-400 hover:scale-105 active:scale-95 shadow-sm dark:shadow-none transition-all cursor-pointer flex items-center gap-1 mx-auto font-bold uppercase text-[8px]"
                >
                  <Eye size={11} strokeWidth={2.5} />
                  <span>Detail</span>
                </button>
              </td>
            </tr>
            );
          }}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40 mt-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Menampilkan {Math.min((activePage - 1) * itemsPerPage + 1, filteredTx.length)} - {Math.min(activePage * itemsPerPage, filteredTx.length)} dari {filteredTx.length} transaksi
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-200/40 dark:border-slate-700/50 hover:bg-slate-200/70 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                Sebelumnya
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`
                    w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-xl border transition-all cursor-pointer
                    ${activePage === page 
                      ? 'bg-slate-800 dark:bg-orange-500 text-white dark:text-slate-950 border-transparent shadow-sm' 
                      : 'bg-slate-550 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border-slate-200/40 dark:border-slate-700/50 hover:scale-105 active:scale-95'
                    }
                  `}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={activePage === totalPages}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-200/40 dark:border-slate-700/50 hover:bg-slate-200/70 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
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
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {activeTx.salesperson || '-'}
                  </span>
                </div>
                {activeTx.helper && (
                  <div className="flex justify-between">
                    <span>Helper:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {activeTx.helper}
                    </span>
                  </div>
                )}
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
                    <span className="font-bold">{activeTx.tradeInDetails.model}</span>
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
              {activeTx.isSplitPayment && activeTx.splitDetails ? (
                <div className="flex flex-col gap-0.5 border-t border-dotted border-slate-200 dark:border-slate-800/40 pt-1.5 mt-1 text-[8px] text-slate-400 dark:text-slate-500 font-bold">
                  <div className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-450 mb-0.5">Rincian Split Payment:</div>
                  <div className="flex justify-between">
                    <span>- {activeTx.splitDetails.method1}:</span>
                    <span>{handleFormatRupiah(activeTx.splitDetails.amount1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- {activeTx.splitDetails.method2}:</span>
                    <span>{handleFormatRupiah(activeTx.splitDetails.amount2)}</span>
                  </div>
                  {activeTx.changeAmount > 0 && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-200 mt-0.5 border-t border-dashed border-slate-200 dark:border-slate-800/20 pt-1">
                      <span>Kembalian Tunai:</span>
                      <span>{handleFormatRupiah(activeTx.changeAmount)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
              </div>



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
