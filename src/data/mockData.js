// Mock Data untuk POS-Gadget (izystore) - Khusus Apple / iPhone & Tanpa Aksesoris

export const initialUsers = [
  { id: 'u1', username: 'owner_toko', name: 'Owner Izystore', role: 'owner', pin: '9999' },
  { id: 'u2', username: 'admin_toko', name: 'Admin Izystore', role: 'admin', pin: '1234' },
  { id: 'u3', username: 'kasir_toko', name: 'Kasir Izystore', role: 'kasir', pin: '0000' }
];

export const initialSalespersons = [
  { id: 's1', name: 'Budi Hartono', commissionRate: 0.01 }, // 1% komisi dari profit
  { id: 's2', name: 'Siti Rahma', commissionRate: 0.01 },
  { id: 's3', name: 'Rian Wijaya', commissionRate: 0.01 }
];

export const initialInventory = [
  // Gadget Baru
  {
    id: 'p1',
    sku: 'IP15P-128-BLU',
    imei: '862491053748291',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    warna: 'Blue Titanium',
    rom: '128 GB',
    kondisi: 'Baru',
    hargaBeli: 17500000,
    hargaJual: 19499000,
    stok: 3,
    kategori: 'Gadget',
    createdAt: '2026-05-10T10:00:00Z'
  },
  {
    id: 'p2',
    sku: 'IP15PM-256-GRY',
    imei: '359482061738492',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    warna: 'Natural Titanium',
    rom: '256 GB',
    kondisi: 'Baru',
    hargaBeli: 19500000,
    hargaJual: 22499000,
    stok: 2,
    kategori: 'Gadget',
    createdAt: '2026-05-12T11:00:00Z'
  },
  
  // Gadget Bekas
  {
    id: 'p3',
    sku: 'IP13P-256-GLD-SECO',
    imei: '358204918273645',
    brand: 'Apple',
    model: 'iPhone 13 Pro',
    warna: 'Gold',
    rom: '256 GB',
    kondisi: 'Bekas',
    hargaBeli: 9000000,
    hargaJual: 11500000,
    stok: 1,
    kategori: 'Gadget',
    batteryHealth: 84,
    garansiAsal: 'iBox',
    garansiAktif: false,
    gradeFisik: 'A',
    minus: 'Tidak ada minus (Mulus)',
    createdAt: '2026-05-20T14:30:00Z'
  },
  {
    id: 'p4',
    sku: 'IP11-128-BLK-SECO',
    imei: '357193820482910',
    brand: 'Apple',
    model: 'iPhone 11',
    warna: 'Black',
    rom: '128 GB',
    kondisi: 'Bekas',
    hargaBeli: 4000000,
    hargaJual: 5200000,
    stok: 1,
    kategori: 'Gadget',
    batteryHealth: 79,
    garansiAsal: 'Inter',
    garansiAktif: false,
    gradeFisik: 'B',
    minus: 'FaceID Rusak/Off',
    createdAt: '2026-05-22T09:15:00Z'
  },
  // Spareparts / Aksesoris untuk Servis
  {
    id: 'sp1',
    sku: 'SP-BAT-IP11',
    imei: 'BAT-IP11-MOCK',
    brand: 'Apple',
    model: 'Baterai iPhone 11',
    warna: 'OEM',
    rom: '-',
    kondisi: 'Baru',
    hargaBeli: 150000,
    hargaJual: 350000,
    stok: 10,
    kategori: 'Aksesoris',
    createdAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'sp2',
    sku: 'SP-LCD-IP13P',
    imei: 'LCD-IP13P-MOCK',
    brand: 'Apple',
    model: 'Layar iPhone 13 Pro',
    warna: 'Original',
    rom: '-',
    kondisi: 'Baru',
    hargaBeli: 1200000,
    hargaJual: 2200000,
    stok: 5,
    kategori: 'Aksesoris',
    createdAt: '2026-06-01T08:30:00Z'
  }
];

export const initialTransactions = [
  {
    id: 't1',
    invoiceNo: 'INV-20260601-001',
    date: '2026-06-01T10:15:00Z',
    items: [
      { id: 'p1', brand: 'Apple', model: 'iPhone 15 Pro', kondisi: 'Baru', imei: '862491053748291', hargaJual: 19499000, hargaBeli: 17500000, qty: 1, kategori: 'Gadget' }
    ],
    salesperson: 'Budi Hartono',
    discount: 100000,
    total: 19399000,
    paymentMethod: 'Transfer Bank',
    cashAmount: 19399000,
    changeAmount: 0,
    type: 'Penjualan'
  },
  {
    id: 't2',
    invoiceNo: 'INV-20260602-002',
    date: '2026-06-02T16:45:00Z',
    items: [
      { id: 'p3', brand: 'Apple', model: 'iPhone 13 Pro', kondisi: 'Bekas', imei: '358204918273645', hargaJual: 11500000, hargaBeli: 9000000, qty: 1, kategori: 'Gadget' }
    ],
    salesperson: 'Siti Rahma',
    discount: 0,
    total: 11500000,
    paymentMethod: 'Tunai',
    cashAmount: 11500000,
    changeAmount: 0,
    type: 'Penjualan'
  }
];

export const initialWarrantyClaims = [
  {
    id: 'w1',
    imei: '862491053748291',
    customerName: 'Ahmad Faisal',
    customerPhone: '081234567890',
    claimDate: '2026-06-03T11:00:00Z',
    issueDescription: 'Layar berkedip hijau setelah pemakaian 3 minggu',
    status: 'Dalam Perbaikan',
    notes: 'Unit dikirim ke Service Center Apple.'
  }
];
