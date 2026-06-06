import React from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Table from '../components/Table';
import { TrendingUp, Award, Smartphone, ShoppingBag } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const ReportsView = () => {
  const { transactions, salespersons } = useApp();

  // 1. Calculate General Dashboard Stats
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscount = 0;
  let totalTransactions = transactions.length;

  // Category specific stats
  let gadgetRevenue = 0;
  let gadgetCost = 0;
  let gadgetProfit = 0;

  let accRevenue = 0;
  let accCost = 0;
  let accProfit = 0;

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
    totalDiscount += tx.discount;
    
    // Sum up items inside transaction
    tx.items.forEach((item) => {
      const itemRev = item.hargaJual * item.qty;
      const itemCost = item.hargaBeli * item.qty;
      const itemProfit = itemRev - itemCost;

      totalRevenue += itemRev;
      totalCost += itemCost;

      if (item.kategori === 'Gadget') {
        gadgetRevenue += itemRev;
        gadgetCost += itemCost;
        gadgetProfit += itemProfit;
      } else {
        // Accessories
        accRevenue += itemRev;
        accCost += itemCost;
        accProfit += itemProfit;
      }

      // Track salesperson commission stats
      if (tx.salesperson && salesStats[tx.salesperson]) {
        salesStats[tx.salesperson].totalSalesRevenue += itemRev;
        salesStats[tx.salesperson].totalSalesProfit += itemProfit;
      }
    });

    if (tx.salesperson && salesStats[tx.salesperson]) {
      salesStats[tx.salesperson].transactionsCount += 1;
    }
  });

  // Calculate overall figures
  const totalProfitKotor = totalRevenue - totalCost;
  const totalProfitBersih = Math.max(0, totalProfitKotor - totalDiscount);
  const averageTicket = totalTransactions > 0 ? (totalRevenue - totalDiscount) / totalTransactions : 0;

  // Category margins
  const gadgetMargin = gadgetRevenue > 0 ? (gadgetProfit / gadgetRevenue) * 100 : 0;
  const accMargin = accRevenue > 0 ? (accProfit / accRevenue) * 100 : 0;

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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300 flex items-center gap-4">
        <img src={logoImg} alt="Izy Store Logo" className="w-12 h-12 object-contain rounded-full shadow-sm border border-slate-150 dark:border-slate-800/40" />
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
            <TrendingUp size={22} className="text-rose-500 dark:text-rose-450" />
            Laporan Keuangan
          </h2>
        </div>
      </div>

      {/* DASHBOARD STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="TOTAL OMSET (REVENUE)" headerBg="bg-orange-100/70" bodyClassName="p-4">
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {handleFormatRupiah(totalRevenue - totalDiscount)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Sebelum dipotong diskon: {handleFormatRupiah(totalRevenue)}
          </span>
        </Card>

        <Card title="DISCOUNT GIVEN" headerBg="bg-rose-100/70" bodyClassName="p-4">
          <div className="text-2xl font-black text-red-500 dark:text-red-400">
            {handleFormatRupiah(totalDiscount)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Total potongan manual disetujui PIN
          </span>
        </Card>

        <Card title="VOLUME TRANSAKSI" headerBg="bg-purple-100/70" bodyClassName="p-4">
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {totalTransactions} Transaksi
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
            Rata-rata keranjang: {handleFormatRupiah(averageTicket)}
          </span>
        </Card>
      </div>

      {/* DETAILED CATEGORY MARGIN ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Margin breakdown cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card title="Total Penjualan Per Kategori" headerBg="bg-orange-100/70" bodyClassName="p-5 flex flex-col gap-5">
            
            {/* Category: Gadgets */}
            <div className="border border-slate-100 dark:border-slate-800/40 bg-slate-50/70 dark:bg-slate-950/20 rounded-2xl p-4 flex flex-col gap-2 relative shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <Smartphone size={16} />
                  Kategori Gadget / HP
                </span>
                <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-white/50 dark:border-purple-900/30 px-2.5 py-0.5 rounded-lg text-[9px] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] font-black uppercase">
                  Porsi: {((gadgetRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 h-3 mt-1 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-400 h-full rounded-full transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]" 
                  style={{ width: `${Math.min(100, (gadgetRevenue / (totalRevenue || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-700 dark:text-slate-250 mt-1">
                <span>Omset Terjual:</span>
                <span className="font-mono text-sm">{handleFormatRupiah(gadgetRevenue)}</span>
              </div>
            </div>

            {/* Category: Accessories */}
            <div className="border border-slate-100 dark:border-slate-800/40 bg-slate-50/70 dark:bg-slate-950/20 rounded-2xl p-4 flex flex-col gap-2 relative shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <ShoppingBag size={16} />
                  Kategori Aksesoris
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-white/50 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-lg text-[9px] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] font-black uppercase">
                  Porsi: {((accRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 h-3 mt-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]" 
                  style={{ width: `${Math.min(100, (accRevenue / (totalRevenue || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-700 dark:text-slate-250 mt-1">
                <span>Omset Terjual:</span>
                <span className="font-mono text-sm">{handleFormatRupiah(accRevenue)}</span>
              </div>
            </div>

          </Card>
        </div>

        {/* Sales commission tracker table (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
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
      </div>
    </div>
  );
};
export default ReportsView;
