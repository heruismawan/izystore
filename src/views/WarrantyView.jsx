import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { Search, ShieldCheck, AlertCircle, CheckCircle, Wrench, Plus } from 'lucide-react';

export const WarrantyView = () => {
  const {
    inventory,
    transactions,
    warrantyClaims,
    addWarrantyClaim,
    updateWarrantyClaimStatus,
    currentUser
  } = useApp();

  // Search State
  const [searchImei, setSearchImei] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);

  // New Claim Form State
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimForm, setClaimForm] = useState({
    imei: '',
    customerName: '',
    customerPhone: '',
    issueDescription: '',
    notes: ''
  });

  // Edit Claim Status State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  const [editStatus, setEditStatus] = useState('Proses');
  const [editNotes, setEditNotes] = useState('');

  const isKasir = currentUser.role === 'kasir';

  // Handle Search Device by IMEI
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchImei || searchImei.length !== 15) {
      alert('Masukkan nomor IMEI 15 digit!');
      return;
    }

    setSearched(true);
    let foundDevice = null;
    let foundTx = null;

    // 1. Search in transaction log (devices sold)
    for (const tx of transactions) {
      const item = tx.items.find((i) => i.imei === searchImei);
      if (item) {
        foundDevice = item;
        foundTx = tx;
        break;
      }
    }

    // 2. If not sold, search in inventory (devices in stock)
    if (!foundDevice) {
      const item = inventory.find((i) => i.imei === searchImei);
      if (item) {
        foundDevice = item;
      }
    }

    if (foundDevice) {
      // Calculate store warranty: 1 year for Baru, 1 month for Bekas
      const txDate = foundTx ? new Date(foundTx.date) : new Date(foundDevice.createdAt || Date.now());
      const warrantyPeriodMonths = foundDevice.kondisi === 'Baru' ? 12 : 1;
      const warrantyExpiryDate = new Date(txDate);
      warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + warrantyPeriodMonths);

      const isStoreWarrantyActive = new Date() < warrantyExpiryDate;

      setSearchResult({
        device: foundDevice,
        transaction: foundTx,
        purchaseDate: foundTx ? txDate.toLocaleDateString('id-ID') : 'Belum Terjual (Di Stok)',
        warrantyExpiry: warrantyExpiryDate.toLocaleDateString('id-ID'),
        isWarrantyActive: isStoreWarrantyActive,
        warrantyPeriod: `${warrantyPeriodMonths} Bulan`
      });
    } else {
      setSearchResult(null);
    }
  };

  const handleOpenClaimForm = () => {
    setClaimForm({
      imei: searchImei,
      customerName: searchResult?.transaction?.customerName || '',
      customerPhone: searchResult?.transaction?.customerPhone || '',
      issueDescription: '',
      notes: ''
    });
    setShowClaimForm(true);
  };

  const handleOpenNewClaimForm = () => {
    setClaimForm({
      imei: '',
      customerName: '',
      customerPhone: '',
      issueDescription: '',
      notes: ''
    });
    setShowClaimForm(true);
  };

  const handleCreateClaim = (e) => {
    e.preventDefault();
    if (!claimForm.imei || claimForm.imei.length !== 15) {
      alert('IMEI 15 digit wajib diisi.');
      return;
    }

    addWarrantyClaim({
      imei: claimForm.imei,
      customerName: claimForm.customerName,
      customerPhone: claimForm.customerPhone,
      issueDescription: claimForm.issueDescription,
      notes: claimForm.notes || 'Dalam antrean servis'
    });

    alert('Klaim garansi baru berhasil didaftarkan.');
    setShowClaimForm(false);
  };

  const handleOpenStatusEdit = (claim) => {
    setActiveClaim(claim);
    setEditStatus(claim.status);
    setEditNotes(claim.notes);
    setShowStatusModal(true);
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    updateWarrantyClaimStatus(activeClaim.id, editStatus, editNotes);
    alert('Status garansi diperbarui.');
    setShowStatusModal(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Proses':
        return 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400';
      case 'Dalam Perbaikan':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400';
      case 'Selesai':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400';
      case 'Ditolak':
        return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="p-4 flex flex-col gap-6 text-left dark:text-slate-200">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-500 dark:text-emerald-400" />
            Manajemen & Klaim Garansi Gadget
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Cari masa garansi perangkat berdasarkan nomor IMEI, daftarkan klaim kerusakan, dan pantau status servis.
          </p>
        </div>
        <Button variant="green" onClick={handleOpenNewClaimForm} className="flex items-center gap-1.5 !rounded-xl whitespace-nowrap">
          <Plus size={14} strokeWidth={2.5} />
          <span>Tambah Klaim / Servis</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: SEARCH & DEVICE INFO (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card title="Cek Garansi IMEI Perangkat" headerBg="bg-orange-100/70" bodyClassName="p-4 flex flex-col gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Masukkan IMEI Perangkat (15 digit)"
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value.replace(/\D/g, ''))}
                maxLength={15}
                required
              />
              <Button variant="green" type="submit" className="h-[43px] !rounded-xl">
                Cari
              </Button>
            </form>

            {searched && (
              <div className="border border-slate-100 dark:border-slate-800/40 p-4 bg-slate-50/70 dark:bg-slate-950/20 rounded-2xl flex flex-col gap-3 font-semibold text-xs shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] text-slate-600 dark:text-slate-400 transition-all duration-300">
                {searchResult ? (
                  <>
                    <div className="border-b border-dashed border-slate-200 dark:border-slate-800/40 pb-2.5 text-center">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        STATUS GARANSI TOKO
                      </span>
                      <span className={`
                        text-[10px] font-black uppercase px-3 py-1 border border-white/50 dark:border-slate-800/30 rounded-xl inline-block mt-1.5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]
                        ${searchResult.isWarrantyActive ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'}
                      `}>
                        {searchResult.isWarrantyActive ? 'GARANSI AKTIF' : 'GARANSI HABIS'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Model:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{searchResult.device.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Kondisi / Warna:</span>
                        <span className="text-slate-700 dark:text-slate-300">{searchResult.device.kondisi} ({searchResult.device.warna})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">IMEI:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-100 font-bold">{searchResult.device.imei}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Tanggal Transaksi:</span>
                        <span className="text-slate-700 dark:text-slate-300">{searchResult.purchaseDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Durasi Garansi Toko:</span>
                        <span className="text-slate-700 dark:text-slate-300">{searchResult.warrantyPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Masa Garansi Berakhir:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{searchResult.warrantyExpiry}</span>
                      </div>

                      {/* Brand warranty specs */}
                      {searchResult.device.kondisi === 'Bekas' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 rounded-xl p-2.5 mt-2 flex flex-col gap-1 shadow-sm dark:shadow-none">
                          <span className="font-black uppercase text-slate-400 dark:text-slate-500">INFO ATRIBUT FISIK UNIT:</span>
                          <div className="text-slate-600 dark:text-slate-400">Garansi Asal: <span className="font-bold text-slate-700 dark:text-slate-350">{searchResult.device.garansiAsal} ({searchResult.device.garansiAktif ? 'Aktif' : 'Tidak Aktif'})</span></div>
                          <div className="text-slate-600 dark:text-slate-400">Grade Fisik: <span className="font-bold text-slate-700 dark:text-slate-350">{searchResult.device.gradeFisik}</span></div>
                          <div className="text-slate-600 dark:text-slate-400">Battery Health: <span className="font-bold text-slate-700 dark:text-slate-350">{searchResult.device.batteryHealth ? `${searchResult.device.batteryHealth}%` : '-'}</span></div>
                        </div>
                      )}
                    </div>

                    <Button variant="blue" className="w-full mt-2 !rounded-xl" onClick={handleOpenClaimForm}>
                      Ajukan Klaim Servis / Garansi
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle size={28} className="text-red-500 opacity-80" />
                    <span className="font-extrabold uppercase text-red-500">IMEI TIDAK TERDAFTAR</span>
                    <span className="text-[10px] leading-normal font-semibold">
                      Perangkat ini tidak terdaftar di database inventaris maupun riwayat penjualan toko.
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenClaimForm}
                      className="text-xs font-bold text-blue-500 hover:text-blue-600 underline mt-2 cursor-pointer"
                    >
                      Tetap Daftarkan Klaim Servis Manual
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT PANEL: CLAIMS LIST (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card title="Riwayat Servis & Klaim Garansi" headerBg="bg-emerald-100/70" bodyClassName="p-4">
            <Table
              headers={['Tanggal', 'IMEI Perangkat', 'Pelanggan', 'Kelalaian / Masalah', 'Status']}
              rows={warrantyClaims}
              renderRow={(claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-350">
                  <td className="px-3 py-3">
                    {new Date(claim.claimDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-3 py-3 font-mono">
                    {claim.imei}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{claim.customerName}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{claim.customerPhone}</div>
                  </td>
                  <td className="px-3 py-3 max-w-[150px]">
                    <div className="line-clamp-2 text-slate-700 dark:text-slate-200 font-semibold" title={claim.issueDescription}>{claim.issueDescription}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold italic mt-0.5">{claim.notes}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleOpenStatusEdit(claim)}
                      className={`
                        text-[9px] font-black uppercase border border-white/50 dark:border-slate-800/30 rounded-xl px-2.5 py-1 transition-all duration-200 select-none cursor-pointer hover:scale-105 active:scale-95 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)]
                        ${getStatusBadge(claim.status)}
                      `}
                    >
                      {claim.status}
                    </button>
                  </td>
                </tr>
              )}
            />
          </Card>
        </div>
      </div>

      {/* MODAL 1: CREATE NEW WARRANTY CLAIM */}
      <Modal
        isOpen={showClaimForm}
        onClose={() => setShowClaimForm(false)}
        title="Daftar Klaim Servis Baru"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateClaim} className="flex flex-col gap-4 text-left">
          <Input
            label="IMEI Perangkat (15 digit)"
            value={claimForm.imei}
            onChange={(e) => setClaimForm({ ...claimForm, imei: e.target.value.replace(/\D/g, '') })}
            maxLength={15}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nama Konsumen"
              placeholder="Contoh: Andi Wijaya"
              value={claimForm.customerName}
              onChange={(e) => setClaimForm({ ...claimForm, customerName: e.target.value })}
              required
            />
            <Input
              label="No. Telepon / WA"
              placeholder="08xxxxxxxxxx"
              value={claimForm.customerPhone}
              onChange={(e) => setClaimForm({ ...claimForm, customerPhone: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Deskripsi Kerusakan</label>
            <textarea
              value={claimForm.issueDescription}
              onChange={(e) => setClaimForm({ ...claimForm, issueDescription: e.target.value })}
              placeholder="Jelaskan masalah kerusakan unit (misal: Speaker pecah, layar flicker)..."
              required
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200"
            />
          </div>

          <Input
            label="Catatan Awal Penerimaan"
            placeholder="Contoh: Kondisi unit lecet tipis, kelengkapan hanya unit"
            value={claimForm.notes}
            onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="white" onClick={() => setShowClaimForm(false)}>
              Batal
            </Button>
            <Button variant="green" type="submit">
              Daftarkan Klaim
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT CLAIM STATUS */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status Servis / Klaim"
        maxWidth="max-w-xs"
      >
        <form onSubmit={handleSaveStatus} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Status Servis</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200"
            >
              <option value="Proses">Dalam Antrean (Proses)</option>
              <option value="Dalam Perbaikan">Sedang Dikerjakan (Servis)</option>
              <option value="Selesai">Selesai / Unit Bisa Diambil</option>
              <option value="Ditolak">Ditolak / Garansi Batal</option>
            </select>
          </div>

          <Input
            label="Catatan Servis / Alasan"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Update proses perbaikan atau alasan penolakan"
            required
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="white" onClick={() => setShowStatusModal(false)}>
              Batal
            </Button>
            <Button variant="green" type="submit">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default WarrantyView;
