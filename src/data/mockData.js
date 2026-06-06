// Mock Data untuk POS-Gadget (izystore)

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
    ram: '8 GB',
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
    sku: 'S24U-256-GRY',
    imei: '359482061738492',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    warna: 'Titanium Gray',
    ram: '12 GB',
    rom: '256 GB',
    kondisi: 'Baru',
    hargaBeli: 18500000,
    hargaJual: 20999000,
    stok: 2,
    kategori: 'Gadget',
    createdAt: '2026-05-12T11:00:00Z'
  },
  
  // Gadget Bekas & iPhone Atribut Khusus
  {
    id: 'p3',
    sku: 'IP13P-256-GLD-SECO',
    imei: '358204918273645',
    brand: 'Apple',
    model: 'iPhone 13 Pro',
    warna: 'Gold',
    ram: '6 GB',
    rom: '256 GB',
    kondisi: 'Bekas',
    hargaBeli: 9000000,
    hargaJual: 11500000,
    stok: 1,
    kategori: 'Gadget',
    // Atribut Khusus Bekas / iPhone
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
    ram: '4 GB',
    rom: '128 GB',
    kondisi: 'Bekas',
    hargaBeli: 4000000,
    hargaJual: 5200000,
    stok: 1,
    kategori: 'Gadget',
    // Atribut Khusus Bekas
    batteryHealth: 79,
    garansiAsal: 'Inter',
    garansiAktif: false,
    gradeFisik: 'B',
    minus: 'FaceID Rusak/Off',
    createdAt: '2026-05-22T09:15:00Z'
  },
  
  // Aksesoris (Margin profit tebal)
  {
    id: 'a1',
    sku: 'ANK-PD20W-WHT',
    brand: 'Anker',
    model: 'Charger PowerPort PD 20W',
    warna: 'White',
    kondisi: 'Baru',
    hargaBeli: 120000,
    hargaJual: 249000,
    stok: 15,
    kategori: 'Aksesoris',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'a2',
    sku: 'TG-IP15P-PRIV',
    brand: 'Spigen',
    model: 'Tempered Glass Privacy iPhone 15 Pro',
    warna: 'Clear/Tinted',
    kondisi: 'Baru',
    hargaBeli: 95000,
    hargaJual: 199000,
    stok: 25,
    kategori: 'Aksesoris',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'a3',
    sku: 'CASE-IP13-MGSF',
    brand: 'Ringke',
    model: 'Fusion Magnetic Case iPhone 13',
    warna: 'Matte Black',
    kondisi: 'Baru',
    hargaBeli: 150000,
    hargaJual: 320000,
    stok: 10,
    kategori: 'Aksesoris',
    createdAt: '2026-05-02T08:00:00Z'
  }
];

export const initialTransactions = [
  {
    id: 't1',
    invoiceNo: 'INV-20260601-001',
    date: '2026-06-01T10:15:00Z',
    items: [
      { id: 'p1', brand: 'Apple', model: 'iPhone 15 Pro', kondisi: 'Baru', imei: '862491053748291', hargaJual: 19499000, hargaBeli: 17500000, qty: 1, kategori: 'Gadget' },
      { id: 'a1', brand: 'Anker', model: 'Charger PowerPort PD 20W', kondisi: 'Baru', hargaJual: 249000, hargaBeli: 120000, qty: 1, kategori: 'Aksesoris' }
    ],
    salesperson: 'Budi Hartono',
    discount: 100000, // Diskon disetujui (<= 100rb, tidak butuh PIN)
    total: 19648000,
    paymentMethod: 'QRIS',
    cashAmount: 19648000,
    changeAmount: 0,
    type: 'Penjual'
  },
  {
    id: 't2',
    invoiceNo: 'INV-20260602-002',
    date: '2026-06-02T16:45:00Z',
    items: [
      { id: 'a2', brand: 'Spigen', model: 'Tempered Glass Privacy iPhone 15 Pro', kondisi: 'Baru', hargaJual: 199000, hargaBeli: 95000, qty: 2, kategori: 'Aksesoris' }
    ],
    salesperson: 'Siti Rahma',
    discount: 0,
    total: 398000,
    paymentMethod: 'Tunai',
    cashAmount: 400000,
    changeAmount: 2000,
    type: 'Penjual'
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
    status: 'Dalam Perbaikan', // 'Proses', 'Dalam Perbaikan', 'Selesai', 'Ditolak'
    notes: 'Unit dikirim ke Authorized Service Center Apple.'
  }
];
