import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { Users, UserPlus, ShieldAlert, Trash2, Edit2 } from 'lucide-react';

export const UserManagementView = () => {
  const {
    usersList,
    addUser,
    deleteUser,
    updateUserRole,
    currentUser
  } = useApp();

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    role: 'kasir',
    pin: ''
  });

  // Edit Role State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserObj, setEditUserObj] = useState(null);
  const [editRole, setEditRole] = useState('kasir');

  const handleOpenAdd = () => {
    setNewUser({
      username: '',
      name: '',
      role: 'kasir',
      pin: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name || !newUser.pin || newUser.pin.length !== 4) {
      alert('Isi semua data lengkap! PIN wajib berisi 4 angka.');
      return;
    }

    // Check unique username
    const exists = usersList.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      alert('Username sudah terpakai!');
      return;
    }

    addUser(newUser);
    alert('User baru berhasil ditambahkan.');
    setShowAddModal(false);
  };

  const handleOpenEdit = (user) => {
    setEditUserObj(user);
    setEditRole(user.role);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateUserRole(editUserObj.id, editRole);
    alert('Role user berhasil diupdate.');
    setShowEditModal(false);
  };

  const handleDelete = (userId) => {
    if (userId === currentUser.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif!');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus user ini dari sistem?')) {
      const success = deleteUser(userId);
      if (success) {
        alert('User berhasil dihapus.');
      } else {
        alert('Gagal menghapus user.');
      }
    }
  };

  return (
    <div className="p-4 flex flex-col gap-6 text-left">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-white/60 dark:border-slate-800/40 shadow-neo dark:shadow-neo-dark p-5 transition-all duration-300">
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
          <Users size={22} className="text-indigo-500 dark:text-indigo-400" />
          Manajemen Hak Akses & Akun Staf (Owner Only)
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
          Kelola seluruh staf toko Anda. Tambah user baru, hapus akun staf, atau ubah tingkat otoritas (Kasir / Admin / Owner).
        </p>
      </div>

      <Card
        title="Daftar Akun Pengguna POS"
        headerBg="bg-orange-100/70"
        bodyClassName="p-4"
        headerAction={
          <Button variant="green" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 !rounded-xl">
            <UserPlus size={14} strokeWidth={2.5} />
            <span>Tambah User</span>
          </Button>
        }
      >
        <Table
          headers={['Nama Karyawan', 'Username', 'PIN Otorisasi', 'Tingkat Otoritas (Role)', 'Aksi']}
          rows={usersList}
          renderRow={(user) => {
            const isSelf = user.id === currentUser.id;
            return (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs font-semibold border-b border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-300">
                <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                  {user.name} {isSelf && <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-white/50 dark:border-emerald-900/30 text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] ml-1">Aktif</span>}
                </td>
                <td className="px-4 py-3.5 font-mono">
                  {user.username}
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                  {user.pin}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`
                    text-[8px] font-black uppercase border border-white/50 dark:border-slate-800/30 rounded-lg px-2 py-0.5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)]
                    ${user.role === 'owner' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400' : user.role === 'admin' ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'}
                  `}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3.5 flex gap-2 justify-center">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    title="Ubah Role"
                    className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm dark:shadow-none"
                  >
                    <Edit2 size={12} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={isSelf}
                    title="Hapus Akun"
                    className={`
                      p-2 rounded-xl transition-all cursor-pointer shadow-sm
                      ${isSelf 
                        ? 'bg-slate-50 dark:bg-slate-900/60 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/40 cursor-not-allowed' 
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 dark:hover:text-red-400 hover:scale-105 active:scale-95'
                      }
                    `}
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            );
          }}
        />
      </Card>

      {/* MODAL 1: ADD USER */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Daftar Pengguna Baru"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Roni Setiawan"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <Input
            label="Username Login"
            placeholder="Contoh: roni_izystore"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s+/g,'') })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="PIN Otorisasi (4 Angka)"
              type="password"
              placeholder="Contoh: 7788"
              value={newUser.pin}
              onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g,'') })}
              maxLength={4}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Role / Jabatan</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200"
              >
                <option value="kasir">Kasir / Sales</option>
                <option value="admin">Admin Back-Office</option>
                <option value="owner">Owner Staf</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-3">
            <Button variant="white" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button variant="green" type="submit">
              Tambah Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT USER ROLE */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Ubah Jabatan (Role) Staf"
        maxWidth="max-w-xs"
      >
        {editUserObj && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-left">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.05)]">
              <div>Nama: <span className="font-extrabold text-slate-800 dark:text-slate-200">{editUserObj.name}</span></div>
              <div className="mt-1">Username: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{editUserObj.username}</span></div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Jabatan Baru</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/50 outline-none transition-all duration-200"
              >
                <option value="kasir">Kasir / Sales</option>
                <option value="admin">Admin Back-Office</option>
                <option value="owner">Owner Toko</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="white" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button variant="green" type="submit">
                Simpan Jabatan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default UserManagementView;
