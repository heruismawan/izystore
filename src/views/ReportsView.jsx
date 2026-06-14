import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { TrendingUp, Award, Plus, FileText, Trash2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const ReportsView = () => {
  const { transactions, salespersons, expenses, addExpense, deleteExpense } = useApp();

  // Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: ''
  });

  // 1. Calculate General Dashboard Stats
  let totalRevenue = 0;
  let totalCost = 0;
  let totalTransactions = transactions.length;

  // Sales commissions map
  const salesStats = {};
  salespersons.forEach((s) => {
    salesStats[s.name] = {
      transactionsCount: 0,
      totalSalesRevenue: 0,
      totalSalesProfit: 0,
      commissionRate: s.commissionRate
    };
  });

  // Process all completed transactions
  transactions.forEach((tx) => {
    totalRevenue += tx.total;
    
    // Sum up items inside transaction
    tx.items.forEach((item) => {
      const itemCost = (item.hargaBeli || 0) * item.qty;
      totalCost += itemCost;
    });

    // Track salesperson commission stats
    if (tx.salesperson && salesStats[tx.salesperson]) {
      salesStats[tx.salesperson].totalSalesRevenue += tx.total;
      
      const txCost = tx.items.reduce((sum, item) => sum + (item.hargaBeli || 0) * item.qty, 0);
      salesStats[tx.salesperson].totalSalesProfit += (tx.total - txCost);
    }

    if (tx.salesperson && salesStats[tx.salesperson]) {
      salesStats[tx.salesperson].transactionsCount += 1;
    }
  });

  // Calculate total expenses
  const totalExpenses = expenses ? expenses.reduce((acc, exp) => acc + exp.amount, 0) : 0;

  // Calculate Net Profit
  const netProfit = totalRevenue - totalCost - totalExpenses;

  // Calculate overall figures
  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Expense Handlers
  const handleOpenExpenseModal = () => {
    setExpenseForm({
      amount: '',
      description: ''
    });
    setShowExpenseModal(true);
  };

  const handleOpenDetailModal = () => {
    setShowDetailModal(true);
  };

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      alert('Nominal biaya wajib diisi dan harus lebih besar dari 0.');
      return;
    }
    if (!expenseForm.description.trim()) {
      alert('Keterangan biaya wajib diisi.');
      return;
    }

    addExpense({
      category: 'Operasional',
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description.trim()
    });

    alert('Biaya operasional berhasil dicatat.');
    setShowExpenseModal(false);
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan biaya operasional ini?')) {
      deleteExpense(id);
    }
  };

  // Formatter helper
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
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="Izy Store Logo" className="w-12 h-12 object-contain rounded-full shadow-sm border border-slate-150 dark:border-slate-800/40" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
              <TrendingUp size={22} className="text-rose-500 dark:text-rose-455" />
              Laporan Keuangan
            </h2>
          </div>
        </div>
      </div>

      {/* DASHBOARD STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="TOTAL OMSET (REVENUE)" headerBg="bg-orange-100/70" bodyClassName="p-4">
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {handleFormatRupiah(totalRevenue)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Total pendapatan bersih toko
          </span>
        </Card>

        <Card title="BIAYA OPERASIONAL" headerBg="bg-rose-100/70" bodyClassName="p-4">
          <div className="text-2xl font-black text-red-500 dark:text-red-400">
            {handleFormatRupiah(totalExpenses)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Biaya minuman, cemilan, dll
          </span>
        </Card>

        <Card title="LABA BERSIH" headerBg="bg-emerald-100/70" bodyClassName="p-4">
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-red-500'}`}>
            {handleFormatRupiah(netProfit)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Omset - HPP - Biaya Operasional
          </span>
        </Card>

        <Card title="RINGKASAN TRANSAKSI" headerBg="bg-purple-100/70" bodyClassName="p-4">
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {totalTransactions} Transaksi
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Rata-rata: {handleFormatRupiah(averageTicket)}
          </span>
        </Card>
      </div>

      {/* SALES COMMISSION TRACKER */}
      <div className="w-full">
        <Card title="Performa Penjualan Sales Karyawan" headerBg="bg-emerald-100/70" bodyClassName="p-4">
          <Table
            headers={['Nama Salesperson', 'Jumlah Transaksi', 'Total Omset Sales']}
            rows={salespersons}
            renderRow={(sales) => {
              const stats = salesStats[sales.name] || { transactionsCount: 0, totalSalesRevenue: 0 };
              
              return (
                <tr key={sales.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-350">
                  <td className="px-3 py-3 font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <Award size={14} className="text-amber-500" />
                    {sales.name}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {stats.transactionsCount}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-700 dark:text-slate-300">
                    {handleFormatRupiah(stats.totalSalesRevenue)}
                  </td>
                </tr>
              );
            }}
          />
        </Card>
      </div>

      {/* OPERATIONAL BUTTONS ROW (BOTTOM) */}
      <div className="flex gap-3 justify-end mt-2">
        <Button 
          variant="white" 
          onClick={handleOpenDetailModal} 
          className="flex items-center gap-1.5 !rounded-xl text-[10px] font-black uppercase tracking-wider py-2.5 px-5 cursor-pointer shadow-sm"
        >
          <FileText size={14} strokeWidth={2.5} />
          <span>Rekap Biaya</span>
        </Button>
        <Button 
          variant="red" 
          onClick={handleOpenExpenseModal} 
          className="flex items-center gap-1.5 !rounded-xl text-[10px] font-black uppercase tracking-wider py-2.5 px-5 cursor-pointer shadow-md"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Biaya Operasional</span>
        </Button>
      </div>

      {/* EXPENSE ADD MODAL */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Catat Biaya Operasional Baru"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddExpenseSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Nominal Biaya (Rp) *"
            type="number"
            placeholder="Masukkan nominal pengeluaran"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            required
            autoFocus
          />

          <Input
            label="Keterangan Pengeluaran *"
            placeholder="Contoh: Beli air mineral gelas 1 dus untuk pelanggan"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-3">
            <Button variant="white" onClick={() => setShowExpenseModal(false)}>
              Batal
            </Button>
            <Button variant="green" type="submit">
              Simpan Pengeluaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* EXPENSE DETAIL RECAP MODAL */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Rekap Detail Biaya Operasional"
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-xs font-semibold text-slate-500 m-0">
            Berikut adalah rincian pengeluaran operasional toko yang telah dicatat oleh admin.
          </p>
          <div className="max-h-96 overflow-y-auto border border-slate-100 dark:border-slate-800/40 rounded-2xl">
            <Table
              headers={['Tanggal', 'Keterangan Pengeluaran', 'Nominal Biaya', 'Aksi']}
              rows={expenses || []}
              renderRow={(exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-350">
                  <td className="px-4 py-3 text-slate-550 dark:text-slate-400 font-mono text-[10px]">
                    {new Date(exp.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100 truncate max-w-[220px]" title={exp.description}>
                    {exp.description}
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-red-500 dark:text-red-400">
                    {handleFormatRupiah(exp.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      title="Hapus Pengeluaran"
                      className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-405 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-400 hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              )}
            />
            {(!expenses || expenses.length === 0) && (
              <p className="text-center py-6 font-bold text-slate-400 dark:text-slate-500 m-0 text-xs bg-slate-50 dark:bg-slate-900/40">
                Belum ada catatan biaya operasional.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-2 border-t border-slate-100 dark:border-slate-800/40 pt-3">
            <Button variant="white" onClick={() => setShowDetailModal(false)} className="w-full sm:w-auto">
              Tutup Rekap
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsView;
