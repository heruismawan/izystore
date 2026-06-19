import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Barcode,
  Smartphone,
  Share2
} from 'lucide-react';

export const InventoryView = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    currentUser
  } = useApp();

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Form States (Add/Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    sku: '',
    brand: 'Apple',
    model: '',
    warna: '',
    ram: '',
    rom: '',
    kondisi: 'Baru', // 'Baru' / 'Bekas'
    kategori: 'Gadget',
    hargaBeli: '',
    hargaJual: '',
    stok: '1',
    imei: '',
    // Atribut Khusus Bekas
    garansiAsal: 'iBox', // 'iBox' / 'Inter'
    garansiAktif: false, // true / false
    gradeFisik: 'A', // 'A' / 'B' / 'C'
    minus: '' // Catatan minus/kerusakan manual
  });

  // Barcode Printing State
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilter, setExportFilter] = useState('Semua');

  // Role restrictions
  const isKasir = currentUser.role === 'kasir';
  const canModify = currentUser.role === 'admin' || currentUser.role === 'owner';
  const isOwner = currentUser.role === 'owner';

  // Filters
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.imei && item.imei.includes(searchQuery));
    const matchesCategory = categoryFilter === 'Semua' || item.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const displayedInventory = filteredInventory.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

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

  // Open add item form
  const handleOpenAdd = () => {
    setFormData({
      id: '',
      sku: '',
      brand: 'Apple',
      model: '',
      warna: '',
      ram: '',
      rom: '',
      kondisi: 'Baru',
      kategori: 'Gadget',
      hargaBeli: '',
      hargaJual: '',
      stok: '1',
      imei: '',
      garansiAsal: 'iBox',
      garansiAktif: false,
      gradeFisik: 'A',
      minus: ''
    });
    setIsEditing(false);
    setShowFormModal(true);
  };

  // Open edit item form
  const handleOpenEdit = (product) => {
    setFormData({
      ...product,
      hargaBeli: (product.hargaBeli ?? 0).toString(),
      hargaJual: (product.hargaJual ?? 0).toString(),
      stok: (product.stok ?? 0).toString(),
      garansiAsal: product.garansiAsal || 'iBox',
      garansiAktif: product.garansiAktif || false,
      gradeFisik: product.gradeFisik || 'A',
      minus: product.minus || ''
    });
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleKategoriChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      kategori: val,
      // If Aksesoris or Sparepart, lock kondisi to 'Baru'
      kondisi: (val === 'Aksesoris' || val === 'Sparepart') ? 'Baru' : prev.kondisi
    }));
  };

  // Submit Form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.imei) {
      alert('Kode Barcode / Batch Supplier wajib diisi!');
      return;
    }

    const itemPayload = {
      ...formData,
      hargaBeli: isOwner
        ? (parseFloat(formData.hargaBeli) || 0)
        : (isEditing ? (inventory.find(item => item.id === formData.id)?.hargaBeli || 0) : 0),
      hargaJual: parseFloat(formData.hargaJual) || 0,
      stok: parseInt(formData.stok) || 1,
      warna: (formData.kategori === 'Aksesoris' || formData.kategori === 'Sparepart') ? '-' : formData.warna,
      rom: (formData.kategori === 'Aksesoris' || formData.kategori === 'Sparepart') ? '-' : formData.rom,
      batteryHealth: null,
      garansiAsal: formData.kondisi === 'Bekas' ? formData.garansiAsal : null,
      garansiAktif: formData.kondisi === 'Bekas' ? (formData.garansiAktif === 'true' || formData.garansiAktif === true) : null,
      gradeFisik: formData.kondisi === 'Bekas' ? formData.gradeFisik : null,
      minus: formData.kondisi === 'Bekas' ? formData.minus : null
    };

    if (isEditing) {
      updateInventoryItem(itemPayload);
      alert('Produk berhasil diperbarui.');
    } else {
      addInventoryItem(itemPayload);
      alert('Produk baru berhasil ditambahkan.');
    }

    setShowFormModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus barang ini dari stok dagangan?')) {
      deleteInventoryItem(id);
      alert('Produk berhasil dihapus.');
    }
  };

  const handleOpenBarcode = (product) => {
    setBarcodeProduct(product);
    setShowBarcodeModal(true);
  };

  const handleFormatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Barcode / IMEI',
      'Model Produk',
      'Warna',
      'ROM',
      'Kondisi',
      'Stok',
      ...(isOwner ? ['Harga Modal'] : []),
      'Harga Jual',
      'Atribut Tambahan'
    ];

    const csvRows = [headers.join(',')];

    const finalExportItems = filteredInventory.filter(item => {
      if (exportFilter === 'Semua') return true;
      return item.kategori === exportFilter;
    });

    if (finalExportItems.length === 0) {
      alert('Tidak ada data untuk diekspor pada kategori tersebut.');
      return;
    }

    finalExportItems.forEach((item) => {
      let specs = [];
      if (item.kondisi === 'Bekas') {
        if (item.batteryHealth) specs.push(`BH: ${item.batteryHealth}%`);
        specs.push(`Garansi: ${item.garansiAsal || '-'} (${item.garansiAktif ? 'Aktif' : 'Habis'})`);
        if (item.gradeFisik) specs.push(`Grade: ${item.gradeFisik}`);
        if (item.minus) specs.push(`Minus: ${item.minus}`);
      } else {
        specs.push('Baru');
      }
      const specsString = specs.join('; ');

      const row = [
        `"${item.sku}"`,
        `"${item.imei || '-'}"`,
        `"${item.model}"`,
        `"${item.warna || '-'}"`,
        `"${item.rom || '-'}"`,
        `"${item.kondisi}"`,
        item.stok,
        ...(isOwner ? [item.hargaBeli] : []),
        item.hargaJual,
        `"${specsString.replace(/"/g, '""')}"`
      ];

      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stok-inventaris-izystore-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  return (
    <div className="p-4 flex flex-col gap-6 text-left dark:text-slate-200">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
            <Smartphone size={22} className="text-emerald-500 dark:text-emerald-400" />
            Manajemen Stok & Atribut Gadget
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Lihat daftar stok, kelola atribut khusus iPhone bekas, dan cetak label barcode.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="white" onClick={() => setShowExportModal(true)} className="flex items-center gap-1.5 !rounded-xl">
            <Share2 size={14} strokeWidth={2.5} />
            <span>Ekspor Excel</span>
          </Button>
          <Button variant="green" onClick={handleOpenAdd} className="flex items-center gap-1.5 !rounded-xl">
            <Plus size={14} strokeWidth={2.5} />
            <span>Tambah Barang</span>
          </Button>
        </div>
      </div>

      <Card
        title="Daftar Inventaris Toko"
        headerBg="bg-orange-100/70"
        bodyClassName="p-4 flex flex-col gap-4"

      >
        {/* Search & Category filter */}
        <div className="w-full flex flex-col md:flex-row gap-3 mb-2">
          <div className="max-w-sm flex-1">
            <Input
              placeholder="Cari SKU, Model, Brand, IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer w-full md:w-48"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Gadget">Gadget</option>
            <option value="Sparepart">Sparepart</option>
            <option value="Aksesoris">Aksesoris</option>
          </select>
        </div>

        {/* Table inventory list */}
        <Table
          headers={
            isOwner
              ? ['SKU / Barcode', 'Produk', 'Kondisi', 'Stok', 'Harga Modal', 'Harga Jual', 'Atribut Tambahan', 'Aksi']
              : ['SKU / Barcode', 'Produk', 'Kondisi', 'Stok', 'Harga Jual', 'Atribut Tambahan', 'Aksi']
          }
          rows={displayedInventory}
          renderRow={(product, index) => {
            const isAppleBekas = product.kondisi === 'Bekas';

            return (
              <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-350">
                <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30 font-mono">
                  <div className="font-bold text-slate-800 dark:text-slate-100">{product.sku}</div>
                  {product.imei && <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">Barcode: {product.imei}</div>}
                </td>
                <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{product.model}</span>
                  {product.kategori === 'Gadget' && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{product.warna} {product.rom && `• ${product.rom}`}</span>
                  )}
                </td>
                <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30 text-center">
                  <span className={`
                    text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-white/50 dark:border-slate-800/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)]
                    ${product.kondisi === 'Baru' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'}
                  `}>
                    {product.kondisi}
                  </span>
                </td>
                <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30 text-center font-bold text-sm text-slate-800 dark:text-slate-100">
                  {product.stok}
                </td>

                {isOwner && (
                  <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30 font-extrabold font-mono text-sm text-slate-800 dark:text-slate-100">
                    {handleFormatRupiah(product.hargaBeli)}
                  </td>
                )}
                <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30 font-extrabold font-mono text-sm text-slate-800 dark:text-slate-100">
                  {handleFormatRupiah(product.hargaJual)}
                </td>
                <td className="px-4 py-3.5 border-r border-slate-100/50 dark:border-slate-800/30 text-[10px] max-w-[200px]">
                  {product.kondisi === 'Bekas' ? (
                    <div className="flex flex-col gap-0.5 text-slate-600 dark:text-slate-400">
                      {product.batteryHealth && <div>BH: <span className="font-bold text-slate-800 dark:text-slate-200">{product.batteryHealth}%</span></div>}
                      <div>Garansi: <span className="font-bold text-slate-800 dark:text-slate-200">{product.garansiAsal || '-'} ({product.garansiAktif ? 'Aktif' : 'Habis'})</span></div>
                      <div>Fisik Grade: <span className="font-bold text-slate-800 dark:text-slate-200">{product.gradeFisik || '-'}</span></div>
                      <div>Minus: <span className="font-bold text-red-600 dark:text-red-400">{product.minus || 'Mulus (No Minus)'}</span></div>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">Tidak ada atribut khusus</span>
                  )}
                </td>
                <td className="px-4 py-3.5 flex gap-2 justify-center">
                  <button
                    onClick={() => handleOpenBarcode(product)}
                    title="Cetak Barcode SKU"
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-700 dark:hover:text-orange-400 hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer"
                  >
                    <Barcode size={13} strokeWidth={2.5} />
                  </button>
                  {canModify ? (
                    <>
                      <button
                        onClick={() => handleOpenEdit(product)}
                        title="Edit Produk"
                        className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-700 dark:hover:text-blue-400 hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer"
                      >
                        <Edit2 size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        title="Hapus Produk"
                        className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-400 hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer"
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 italic">No Edit</span>
                  )}
                </td>
              </tr>
            );
          }}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40 mt-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Menampilkan {Math.min((activePage - 1) * itemsPerPage + 1, filteredInventory.length)} - {Math.min(activePage * itemsPerPage, filteredInventory.length)} dari {filteredInventory.length} barang
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

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditing ? 'Edit Data Barang Dagangan' : 'Tambah Barang Dagangan Baru'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">

          <div className="grid grid-cols-2 gap-3">
            {/* Kategori Select */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Kategori Barang</label>
              <select
                value={formData.kategori}
                onChange={handleKategoriChange}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer"
              >
                <option value="Gadget">Gadget</option>
                <option value="Aksesoris">Aksesoris</option>
                <option value="Sparepart">Sparepart</option>
              </select>
            </div>

            {/* Kondisi Select */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Kondisi Barang</label>
              <select
                value={formData.kondisi}
                disabled={formData.kategori === 'Aksesoris' || formData.kategori === 'Sparepart'}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Baru">Baru (New)</option>
                <option value="Bekas">Bekas (Second)</option>
              </select>
            </div>
          </div>

          <Input
            label="Model / Nama Produk"
            placeholder="Contoh: iPhone 13 Pro, iPad Pro"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />

          {formData.kategori === 'Gadget' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Warna"
                placeholder="Contoh: Midnight"
                value={formData.warna}
                onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                required
              />
              <Input
                label="ROM / Kapasitas"
                placeholder="Contoh: 128 GB"
                value={formData.rom}
                onChange={(e) => setFormData({ ...formData, rom: e.target.value })}
              />
            </div>
          )}

          <Input
            label="Kode Barcode / Batch Supplier"
            placeholder="Contoh: a1-64-11-64-7"
            value={formData.imei}
            onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
            required
          />

          <div className={`grid ${isOwner ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            {isOwner && (
              <Input
                label="Harga Modal (Rp)"
                type="number"
                placeholder="Harga beli supplier"
                value={formData.hargaBeli}
                onChange={(e) => setFormData({ ...formData, hargaBeli: e.target.value })}
                required
              />
            )}
            <Input
              label="Harga Jual (Rp)"
              type="number"
              placeholder="Harga jual toko"
              value={formData.hargaJual}
              onChange={(e) => setFormData({ ...formData, hargaJual: e.target.value })}
              required
            />
            <Input
              label="Stok Unit"
              type="number"
              value={formData.stok}
              onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
              required
            />
          </div>

          {/* DYNAMIC SPECS FOR APPLE BEKAS / SECOND HP */}
          {formData.kategori === 'Gadget' && formData.kondisi === 'Bekas' && (
            <div className="border border-slate-100 dark:border-slate-800/40 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 p-5 flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800/40 pb-1.5">
                Spesifikasi Kondisi Bekas (iPhone Spec)
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Garansi Asal</label>
                  <select
                    value={formData.garansiAsal}
                    onChange={(e) => setFormData({ ...formData, garansiAsal: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  >
                    <option value="iBox">iBox / Resmi Indonesia</option>
                    <option value="Inter">Inter / Internasional</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Status Garansi Asal</label>
                  <select
                    value={formData.garansiAktif}
                    onChange={(e) => setFormData({ ...formData, garansiAktif: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  >
                    <option value={true}>Aktif / Masih Garansi</option>
                    <option value={false}>Tidak Aktif / Habis</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Grade Kemulusan Fisik</label>
                  <select
                    value={formData.gradeFisik}
                    onChange={(e) => setFormData({ ...formData, gradeFisik: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  >
                    <option value="A">Grade A (Mulus Like New)</option>
                    <option value="B">Grade B (Normal / Wajar)</option>
                    <option value="C">Grade C (Lecet / Minus Fisik)</option>
                  </select>
                </div>
              </div>

              <div className="mt-1">
                <Input
                  label="Catatan Minus / Kerusakan Staf"
                  placeholder="Contoh: TrueTone Off, Layar gores tipis, FaceID Off (kosongkan jika mulus)"
                  value={formData.minus}
                  onChange={(e) => setFormData({ ...formData, minus: e.target.value })}
                  className="!rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-3">
            <Button variant="white" onClick={() => setShowFormModal(false)}>
              Batal
            </Button>
            <Button variant="green" type="submit">
              Simpan Produk
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: BARCODE PRINT PREVIEW */}
      <Modal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        title="Label Barcode Produk"
        maxWidth="max-w-xs"
      >
        {barcodeProduct && (
          <div className="flex flex-col gap-4 text-center items-center justify-center">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 w-[240px] flex flex-col items-center justify-center shadow-sm font-sans transition-all duration-300">
              <span className="text-[8px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 block mb-0.5">
                IZYSTORE GADGET
              </span>
              <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-200 text-center truncate max-w-full">
                {barcodeProduct.model}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                {barcodeProduct.warna} • {barcodeProduct.kondisi}
              </span>

              {/* Fake Barcode Graphic */}
              <div className="w-[180px] h-[55px] border border-slate-200 dark:border-slate-800/60 rounded-xl flex items-center justify-center p-1 bg-white dark:bg-slate-900 my-3 gap-[1px] overflow-hidden">
                {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1].map((width, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-slate-800 dark:bg-slate-200"
                    style={{ width: `${width}px` }}
                  />
                ))}
              </div>

              <span className="font-mono text-[9px] font-black text-slate-700 dark:text-slate-300">
                {barcodeProduct.sku}
              </span>
              {barcodeProduct.imei && (
                <span className="font-mono text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-full">
                  Barcode: {barcodeProduct.imei}
                </span>
              )}
            </div>

            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 m-0 leading-relaxed">
              Format stiker label barcode mini untuk ditempel pada box / unit handphone.
            </p>

            <Button
              variant="green"
              className="w-full mt-2"
              onClick={() => alert(`Simulasi mencetak sticker label barcode...`)}
            >
              Cetak Sticker Barcode
            </Button>
          </div>
        )}
      </Modal>

      {/* MODAL 3: EXPORT MODAL */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Ekspor Data Stok"
        maxWidth="max-w-xs"
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 pl-1">Pilih Kategori Ekspor</label>
            <select
              value={exportFilter}
              onChange={(e) => setExportFilter(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Gadget">Gadget</option>
              <option value="Sparepart">Sparepart</option>
              <option value="Aksesoris">Aksesoris</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="white" onClick={() => setShowExportModal(false)}>Batal</Button>
            <Button variant="green" onClick={handleExportCSV}>Unduh Excel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default InventoryView;
