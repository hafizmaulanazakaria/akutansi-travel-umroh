import { ChartOfAccount, TravelPackage, DepartureKloter, Jamaah, JamaahRegistration, PaymentSchedule, JamaahPaymentTransaction, JournalEntry, Vendor, VendorBill, VendorPayment, Mitra, MitraCommission } from '../types';

export const INITIAL_COA: ChartOfAccount[] = [
  { id: 'coa-1101', code: '1101', name: 'Kas Kecil Operational', category: 'ASSET', currency: 'IDR', balance: 15000000, isSystem: true, description: 'Kas fisik kantor IDR' },
  { id: 'coa-1102', code: '1102', name: 'Bank Syariah Indonesia (BSI) IDR', category: 'ASSET', currency: 'IDR', balance: 485000000, isSystem: true, description: 'Rekening penampungan jamaah IDR' },
  { id: 'coa-1103', code: '1103', name: 'Bank Mandiri IDR', category: 'ASSET', currency: 'IDR', balance: 220000000, isSystem: true, description: 'Rekening operasional travel IDR' },
  { id: 'coa-1104', code: '1104', name: 'Bank USD Syariah', category: 'ASSET', currency: 'USD', balance: 25000, isSystem: true, description: 'Rekening khusus pembayaran Vendor LA USD' },
  { id: 'coa-1120', code: '1120', name: 'Piutang Paket Jamaah', category: 'ASSET', currency: 'IDR', balance: 142500000, isSystem: true, description: 'Tagihan jamaah belum lunas' },
  
  // Liabilities (Unearned Revenue & Payables)
  { id: 'coa-2101', code: '2101', name: 'Pendapatan Diterima di Muka - Jamaah Umrah', category: 'LIABILITY', currency: 'IDR', balance: 320000000, isSystem: true, description: 'Uang Muka/Cicilan Umrah belum berangkat (Unearned Revenue)' },
  { id: 'coa-2102', code: '2102', name: 'Pendapatan Diterima di Muka - Jamaah Haji Plus', category: 'LIABILITY', currency: 'IDR', balance: 250000000, isSystem: true, description: 'DP/Pelunasan Haji belum berangkat' },
  { id: 'coa-2103', code: '2103', name: 'Utang Vendor Airline & LA Saudi', category: 'LIABILITY', currency: 'IDR', balance: 110000000, isSystem: true, description: 'Tagihan maskapai & LA belum dibayar' },

  // Equity
  { id: 'coa-3101', code: '3101', name: 'Modal Disetor Pemilik', category: 'EQUITY', currency: 'IDR', balance: 200000000, isSystem: true, description: 'Modal awal pendirian PT Travel' },
  { id: 'coa-3201', code: '3201', name: 'Laba Ditahan', category: 'EQUITY', currency: 'IDR', balance: 75000000, isSystem: true, description: 'Akumulasi laba periode sebelumnya' },

  // Revenue
  { id: 'coa-4101', code: '4101', name: 'Pendapatan Paket Umrah', category: 'REVENUE', currency: 'IDR', balance: 570000000, isSystem: true, description: 'Diakui saat Kloter Umrah resmi berangkat' },
  { id: 'coa-4102', code: '4102', name: 'Pendapatan Paket Haji Plus', category: 'REVENUE', currency: 'IDR', balance: 0, isSystem: true, description: 'Diakui saat Kloter Haji berangkat' },
  { id: 'coa-4103', code: '4103', name: 'Pendapatan Visa & Handling Add-on', category: 'REVENUE', currency: 'IDR', balance: 12500000, isSystem: true, description: 'Pendapatan sampingan pembuatan visa / upgrade kamar' },

  // COGS (HPP)
  { id: 'coa-5101', code: '5101', name: 'HPP - Tiket Pesawat Maskapai', category: 'COGS', currency: 'IDR', balance: 180000000, isSystem: true, description: 'Beli tiket Saudi / Saudia / Lion / Garuda' },
  { id: 'coa-5102', code: '5102', name: 'HPP - Hotel Makkah & Madinah', category: 'COGS', currency: 'IDR', balance: 145000000, isSystem: true, description: 'Sewa hotel Makkah & Madinah' },
  { id: 'coa-5103', code: '5103', name: 'HPP - Visa & Asuransi Saudi', category: 'COGS', currency: 'IDR', balance: 32000000, isSystem: true, description: 'Biaya penerbitan visa & tasreh' },
  { id: 'coa-5104', code: '5104', name: 'HPP - Land Arrangement (LA) Saudi', category: 'COGS', currency: 'IDR', balance: 55000000, isSystem: true, description: 'Provider LA, catering, ziarah, bus' },
  { id: 'coa-5105', code: '5105', name: 'HPP - Perlengkapan & Handling Koper', category: 'COGS', currency: 'IDR', balance: 18000000, isSystem: true, description: 'Koper, batik, ihram, mukena, buku doa' },

  // Expenses
  { id: 'coa-6101', code: '6101', name: 'Beban Operasional Kantor', category: 'EXPENSE', currency: 'IDR', balance: 12000000, isSystem: false, description: 'Listrik, sewa kantor, internet' },
  { id: 'coa-6102', code: '6102', name: 'Beban Gaji & Bonus Tour Leader/Muthawwif', category: 'EXPENSE', currency: 'IDR', balance: 24000000, isSystem: false, description: 'Honorarium tim lapangan & staf' },
  { id: 'coa-6103', code: '6103', name: 'Beban Marketing & Syiar', category: 'EXPENSE', currency: 'IDR', balance: 8500000, isSystem: false, description: 'Iklan Meta, brosur, event pameran' },
  { id: 'coa-6104', code: '6104', name: 'Beban Komisi Mitra & Agen', category: 'EXPENSE', currency: 'IDR', balance: 1250000, isSystem: true, description: 'Komisi referral agen / mitra travel' }
];

export const INITIAL_PACKAGES: TravelPackage[] = [
  {
    id: 'pkg-01',
    code: 'UMR-REG-9D',
    name: 'Umroh Reguler 9 Hari',
    category: 'UMRAH_REGULER_9D',
    priceQuad: 28500000,
    priceTriple: 30500000,
    priceDouble: 32500000,
    currency: 'IDR',
    durationDays: 9,
    hotelMakkah: 'Anjum Hotel Makkah (5★)',
    hotelMadinah: 'Grand Plaza Madinah (4★)',
    airline: 'Saudi Arabian Airlines (Direct JED)',
    description: 'Paket Umrah Reguler 9 Hari penerbangan langsung Jakarta - Jeddah.',
    isActive: true
  },
  {
    id: 'pkg-02',
    code: 'UMR-PRV',
    name: 'Umroh Private',
    category: 'UMRAH_PRIVATE',
    priceQuad: 35000000,
    priceTriple: 38000000,
    priceDouble: 42000000,
    currency: 'IDR',
    durationDays: 9,
    hotelMakkah: 'Fairmont Makkah Clock Tower (5★ VIP)',
    hotelMadinah: 'Oberoi Madinah (5★ VIP)',
    airline: 'Saudia / Garuda Executive Class',
    description: 'Layanan Umrah Private eksklusif untuk keluarga & grup kecil.',
    isActive: true
  },
  {
    id: 'pkg-03',
    code: 'UMR-PLS-DXB',
    name: 'Umroh Plus Dubai',
    category: 'UMRAH_PLUS_DUBAI',
    priceQuad: 36500000,
    priceTriple: 39000000,
    priceDouble: 41500000,
    currency: 'IDR',
    durationDays: 12,
    hotelMakkah: 'Pullman Zamzam Makkah (5★)',
    hotelMadinah: 'Movenpick Anwar Madinah (5★)',
    airline: 'Emirates Airlines (Transit Dubai)',
    description: 'Ibadah Umrah khusyuk dikombinasikan dengan tour kota Dubai & Desert Safari.',
    isActive: true
  },
  {
    id: 'pkg-04',
    code: 'UMR-PLS-TRK',
    name: 'Umroh Plus Turki',
    category: 'UMRAH_PLUS_TURKI',
    priceQuad: 38000000,
    priceTriple: 40000000,
    priceDouble: 42500000,
    currency: 'IDR',
    durationDays: 12,
    hotelMakkah: 'Pullman Zamzam Makkah (5★)',
    hotelMadinah: 'Movenpick Anwar Madinah (5★)',
    airline: 'Turkish Airlines (Transit Istanbul)',
    description: 'Umrah ibadah dilanjutkan dengan wisata sejarah di Istanbul & Cappadocia.',
    isActive: true
  },
  {
    id: 'pkg-05',
    code: 'HAJ-PLS',
    name: 'Haji Plus',
    category: 'HAJI_PLUS',
    priceQuad: 165000000,
    priceTriple: 175000000,
    priceDouble: 190000000,
    currency: 'IDR',
    durationDays: 25,
    hotelMakkah: 'Swissotel Makkah (5★ Depan Haram)',
    hotelMadinah: 'Dar Al Taqwa Madinah (5★)',
    airline: 'Garuda Indonesia',
    description: 'Program Haji Plus tanpa antre lama dengan maktab VIP Mina/Arafah.',
    isActive: true
  }
];

export const INITIAL_KLOTERS: DepartureKloter[] = [
  {
    id: 'klt-01',
    packageId: 'pkg-01',
    code: 'KLOTER-2026-UMR-01',
    name: 'Kloter Rombongan Syawal Alpha',
    departureDate: '2026-08-15',
    returnDate: '2026-08-24',
    targetQuota: 45,
    filledQuota: 3,
    status: 'OPEN',
    estimatedCOGS: {
      flightTicketPerPax: 12500000,
      hotelPerPax: 8500000,
      visaPerPax: 2200000,
      landArrangementPerPax: 2800000,
      handlingEquipmentPerPax: 1100000,
      otherPerPax: 400000
    },
    isRevenueRecognized: false,
    notes: 'Penerbangan SV817 CGK-JED pkl 11:30 WIB.'
  },
  {
    id: 'klt-02',
    packageId: 'pkg-01',
    code: 'KLOTER-2026-UMR-02',
    name: 'Kloter Rombongan Awal Ramadan',
    departureDate: '2026-05-10',
    returnDate: '2026-05-19',
    targetQuota: 50,
    filledQuota: 20,
    status: 'DEPARTED',
    estimatedCOGS: {
      flightTicketPerPax: 13000000,
      hotelPerPax: 9000000,
      visaPerPax: 2200000,
      landArrangementPerPax: 3000000,
      handlingEquipmentPerPax: 1100000,
      otherPerPax: 500000
    },
    isRevenueRecognized: true,
    revenueRecognitionDate: '2026-05-10',
    notes: 'Kloter sudah berangkat dan pendapatan diakui.'
  }
];

export const INITIAL_JAMAAH: Jamaah[] = [
  {
    id: 'jam-01',
    nik: '3273011208800003',
    fullName: 'H. Ahmad Subagja',
    passportNumber: 'C8912341',
    passportExpiry: '2029-04-12',
    phone: '081234567890',
    email: 'ahmad.subagja@gmail.com',
    address: 'Jl. Melati No. 45, Bandung',
    gender: 'L',
    birthDate: '1980-08-12',
    emergencyContact: {
      name: 'Siti Rahmawati',
      relation: 'Istri',
      phone: '081298765432'
    }
  },
  {
    id: 'jam-02',
    nik: '3273015509820001',
    fullName: 'Hj. Siti Rahmawati',
    passportNumber: 'C8912342',
    passportExpiry: '2029-04-12',
    phone: '081298765432',
    email: 'siti.rahmawati@gmail.com',
    address: 'Jl. Melati No. 45, Bandung',
    gender: 'P',
    birthDate: '1982-09-15',
    emergencyContact: {
      name: 'H. Ahmad Subagja',
      relation: 'Suami',
      phone: '081234567890'
    }
  },
  {
    id: 'jam-03',
    nik: '3171021004750002',
    fullName: 'Drs. Budi Santoso',
    passportNumber: 'B4412990',
    passportExpiry: '2028-11-20',
    phone: '081311223344',
    email: 'budi.santoso@yahoo.com',
    address: 'Komp. Mentari Blok B3, Jakarta Selatan',
    gender: 'L',
    birthDate: '1975-04-10',
    emergencyContact: {
      name: 'Dewi Lestari',
      relation: 'Istri',
      phone: '081399887766'
    }
  }
];

export const INITIAL_REGISTRATIONS: JamaahRegistration[] = [
  {
    id: 'reg-01',
    registrationNumber: 'REG-202607-001',
    jamaahId: 'jam-01',
    packageId: 'pkg-01',
    kloterId: 'klt-01',
    registrationDate: '2026-07-01',
    roomType: 'DOUBLE',
    basePrice: 32500000,
    discount: 1000000,
    addOnPrice: 0,
    totalBill: 31500000,
    paidAmount: 15000000, // DP + Cicilan 1
    balanceDue: 16500000,
    unearnedRevenueRecognized: 0,
    status: 'PARTIAL',
    notes: 'Kamar Double bersama istri (Hj. Siti)'
  },
  {
    id: 'reg-02',
    registrationNumber: 'REG-202607-002',
    jamaahId: 'jam-02',
    packageId: 'pkg-01',
    kloterId: 'klt-01',
    registrationDate: '2026-07-01',
    roomType: 'DOUBLE',
    basePrice: 32500000,
    discount: 1000000,
    addOnPrice: 0,
    totalBill: 31500000,
    paidAmount: 31500000, // Fully Paid
    balanceDue: 0,
    unearnedRevenueRecognized: 0,
    status: 'PAID_OFF',
    notes: 'Pelunasan tunai via transfer BSI'
  },
  {
    id: 'reg-03',
    registrationNumber: 'REG-202607-003',
    jamaahId: 'jam-03',
    packageId: 'pkg-01',
    kloterId: 'klt-01',
    registrationDate: '2026-07-10',
    roomType: 'QUAD',
    basePrice: 28500000,
    discount: 0,
    addOnPrice: 1000000, // Addon Paspor & perlengkapan ekspres
    totalBill: 29500000,
    paidAmount: 5000000, // DP only
    balanceDue: 24500000,
    unearnedRevenueRecognized: 0,
    status: 'PARTIAL',
    notes: 'DP 5 Juta, sisa dicicil 4x'
  }
];

export const INITIAL_SCHEDULES: PaymentSchedule[] = [
  // Schedules for Reg 01 (H. Ahmad Subagja) - Total 31,500,000
  { id: 'sch-01-1', registrationId: 'reg-01', installmentNumber: 1, title: 'DP / Booking Fee', dueDate: '2026-07-01', amount: 5000000, paidAmount: 5000000, status: 'PAID' },
  { id: 'sch-01-2', registrationId: 'reg-01', installmentNumber: 2, title: 'Cicilan Ke-1', dueDate: '2026-07-15', amount: 10000000, paidAmount: 10000000, status: 'PAID' },
  { id: 'sch-01-3', registrationId: 'reg-01', installmentNumber: 3, title: 'Cicilan Ke-2', dueDate: '2026-07-30', amount: 8000000, paidAmount: 0, status: 'PENDING' },
  { id: 'sch-01-4', registrationId: 'reg-01', installmentNumber: 4, title: 'Pelunasan', dueDate: '2026-08-05', amount: 8500000, paidAmount: 0, status: 'PENDING' },

  // Schedules for Reg 02 (Hj. Siti) - Total 31,500,000 (PAID OFF)
  { id: 'sch-02-1', registrationId: 'reg-02', installmentNumber: 1, title: 'DP / Booking Fee', dueDate: '2026-07-01', amount: 5000000, paidAmount: 5000000, status: 'PAID' },
  { id: 'sch-02-2', registrationId: 'reg-02', installmentNumber: 2, title: 'Pelunasan Langsung', dueDate: '2026-07-05', amount: 26500000, paidAmount: 26500000, status: 'PAID' },

  // Schedules for Reg 03 (Drs. Budi) - Total 29,500,000
  { id: 'sch-03-1', registrationId: 'reg-03', installmentNumber: 1, title: 'DP / Booking Fee', dueDate: '2026-07-10', amount: 5000000, paidAmount: 5000000, status: 'PAID' },
  { id: 'sch-03-2', registrationId: 'reg-03', installmentNumber: 2, title: 'Cicilan Ke-1', dueDate: '2026-07-25', amount: 8000000, paidAmount: 0, status: 'OVERDUE' },
  { id: 'sch-03-3', registrationId: 'reg-03', installmentNumber: 3, title: 'Cicilan Ke-2', dueDate: '2026-08-01', amount: 8000000, paidAmount: 0, status: 'PENDING' },
  { id: 'sch-03-4', registrationId: 'reg-03', installmentNumber: 4, title: 'Pelunasan', dueDate: '2026-08-08', amount: 8500000, paidAmount: 0, status: 'PENDING' }
];

export const INITIAL_PAYMENTS: JamaahPaymentTransaction[] = [
  {
    id: 'pay-01',
    receiptNumber: 'KW-202607-001',
    registrationId: 'reg-01',
    installmentId: 'sch-01-1',
    paymentDate: '2026-07-01',
    amount: 5000000,
    paymentMethod: 'BANK_TRANSFER',
    bankAccountId: 'coa-1102',
    currency: 'IDR',
    exchangeRate: 1,
    notes: 'DP Booking Fee Umrah Reguler 9 Hari',
    createdBy: 'Kasir Finance',
    journalEntryId: 'jv-01'
  },
  {
    id: 'pay-02',
    receiptNumber: 'KW-202607-002',
    registrationId: 'reg-01',
    installmentId: 'sch-01-2',
    paymentDate: '2026-07-15',
    amount: 10000000,
    paymentMethod: 'BANK_TRANSFER',
    bankAccountId: 'coa-1102',
    currency: 'IDR',
    exchangeRate: 1,
    notes: 'Cicilan ke-1 BSI Transfer',
    createdBy: 'Kasir Finance',
    journalEntryId: 'jv-02'
  },
  {
    id: 'pay-03',
    receiptNumber: 'KW-202607-003',
    registrationId: 'reg-02',
    installmentId: 'sch-02-1',
    paymentDate: '2026-07-01',
    amount: 5000000,
    paymentMethod: 'BANK_TRANSFER',
    bankAccountId: 'coa-1102',
    currency: 'IDR',
    exchangeRate: 1,
    notes: 'DP Booking Fee Hj. Siti',
    createdBy: 'Kasir Finance',
    journalEntryId: 'jv-03'
  },
  {
    id: 'pay-04',
    receiptNumber: 'KW-202607-004',
    registrationId: 'reg-02',
    installmentId: 'sch-02-2',
    paymentDate: '2026-07-05',
    amount: 26500000,
    paymentMethod: 'BANK_TRANSFER',
    bankAccountId: 'coa-1102',
    currency: 'IDR',
    exchangeRate: 1,
    notes: 'Pelunasan Paket Umrah Syawal Alpha',
    createdBy: 'Kasir Finance',
    journalEntryId: 'jv-04'
  },
  {
    id: 'pay-05',
    receiptNumber: 'KW-202607-005',
    registrationId: 'reg-03',
    installmentId: 'sch-03-1',
    paymentDate: '2026-07-10',
    amount: 5000000,
    paymentMethod: 'CASH',
    bankAccountId: 'coa-1101',
    currency: 'IDR',
    exchangeRate: 1,
    notes: 'DP Cash Kasir Kantor',
    createdBy: 'Kasir Finance',
    journalEntryId: 'jv-05'
  }
];

export const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 'jv-01',
    journalNumber: 'JV-202607-001',
    transactionDate: '2026-07-01',
    referenceType: 'JAMAAH_PAYMENT',
    referenceId: 'pay-01',
    description: 'Penerimaan DP Umrah H. Ahmad Subagja (KW-202607-001)',
    totalDebit: 5000000,
    totalCredit: 5000000,
    lines: [
      { id: 'jl-01-1', journalId: 'jv-01', accountId: 'coa-1102', accountCode: '1102', accountName: 'Bank Syariah Indonesia (BSI) IDR', debit: 5000000, credit: 0, memo: 'Setoran BSI Jamaah' },
      { id: 'jl-01-2', journalId: 'jv-01', accountId: 'coa-2101', accountCode: '2101', accountName: 'Pendapatan Diterima di Muka - Jamaah Umrah', debit: 0, credit: 5000000, memo: 'Liabilitas DP Jamaah Belum Berangkat' }
    ],
    createdBy: 'System Engine',
    createdAt: '2026-07-01T10:00:00Z'
  },
  {
    id: 'jv-02',
    journalNumber: 'JV-202607-002',
    transactionDate: '2026-07-15',
    referenceType: 'JAMAAH_PAYMENT',
    referenceId: 'pay-02',
    description: 'Penerimaan Cicilan 1 H. Ahmad Subagja (KW-202607-002)',
    totalDebit: 10000000,
    totalCredit: 10000000,
    lines: [
      { id: 'jl-02-1', journalId: 'jv-02', accountId: 'coa-1102', accountCode: '1102', accountName: 'Bank Syariah Indonesia (BSI) IDR', debit: 10000000, credit: 0, memo: 'Cicilan 1 via BSI' },
      { id: 'jl-02-2', journalId: 'jv-02', accountId: 'coa-2101', accountCode: '2101', accountName: 'Pendapatan Diterima di Muka - Jamaah Umrah', debit: 0, credit: 10000000, memo: 'Tambahan Uang Muka Unearned Revenue' }
    ],
    createdBy: 'System Engine',
    createdAt: '2026-07-15T11:15:00Z'
  },
  {
    id: 'jv-03',
    journalNumber: 'JV-202607-003',
    transactionDate: '2026-07-01',
    referenceType: 'JAMAAH_PAYMENT',
    referenceId: 'pay-03',
    description: 'Penerimaan DP Hj. Siti Rahmawati (KW-202607-003)',
    totalDebit: 5000000,
    totalCredit: 5000000,
    lines: [
      { id: 'jl-03-1', journalId: 'jv-03', accountId: 'coa-1102', accountCode: '1102', accountName: 'Bank Syariah Indonesia (BSI) IDR', debit: 5000000, credit: 0, memo: 'DP via BSI' },
      { id: 'jl-03-2', journalId: 'jv-03', accountId: 'coa-2101', accountCode: '2101', accountName: 'Pendapatan Diterima di Muka - Jamaah Umrah', debit: 0, credit: 5000000, memo: 'Unearned Revenue' }
    ],
    createdBy: 'System Engine',
    createdAt: '2026-07-01T10:30:00Z'
  },
  {
    id: 'jv-04',
    journalNumber: 'JV-202607-004',
    transactionDate: '2026-07-05',
    referenceType: 'JAMAAH_PAYMENT',
    referenceId: 'pay-04',
    description: 'Penerimaan Pelunasan Hj. Siti Rahmawati (KW-202607-004)',
    totalDebit: 26500000,
    totalCredit: 26500000,
    lines: [
      { id: 'jl-04-1', journalId: 'jv-04', accountId: 'coa-1102', accountCode: '1102', accountName: 'Bank Syariah Indonesia (BSI) IDR', debit: 26500000, credit: 0, memo: 'Pelunasan via BSI' },
      { id: 'jl-04-2', journalId: 'jv-04', accountId: 'coa-2101', accountCode: '2101', accountName: 'Pendapatan Diterima di Muka - Jamaah Umrah', debit: 0, credit: 26500000, memo: 'Pelunasan Masuk Liabilitas Umrah' }
    ],
    createdBy: 'System Engine',
    createdAt: '2026-07-05T14:20:00Z'
  },
  {
    id: 'jv-05',
    journalNumber: 'JV-202607-005',
    transactionDate: '2026-07-10',
    referenceType: 'JAMAAH_PAYMENT',
    referenceId: 'pay-05',
    description: 'Penerimaan DP Tunai Drs. Budi Santoso (KW-202607-005)',
    totalDebit: 5000000,
    totalCredit: 5000000,
    lines: [
      { id: 'jl-05-1', journalId: 'jv-05', accountId: 'coa-1101', accountCode: '1101', accountName: 'Kas Kecil Operational', debit: 5000000, credit: 0, memo: 'DP Cash Kantor' },
      { id: 'jl-05-2', journalId: 'jv-05', accountId: 'coa-2101', accountCode: '2101', accountName: 'Pendapatan Diterima di Muka - Jamaah Umrah', debit: 0, credit: 5000000, memo: 'Unearned Revenue' }
    ],
    createdBy: 'System Engine',
    createdAt: '2026-07-10T09:00:00Z'
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'vnd-01', name: 'Saudi Arabian Airlines (Saudia)', code: 'VND-SV', type: 'AIRLINE', phone: '+62215200000', email: 'group@saudia.com', address: 'Menara BTPN Lt. 12 Jakarta', isActive: true },
  { id: 'vnd-02', name: 'Al-Anjum Hotel Group Makkah', code: 'VND-ANJUM', type: 'HOTEL', phone: '+96612500000', email: 'reservation@anjumhotels.com', address: 'Ibrahim Al Khalil Rd, Makkah Saudi Arabia', isActive: true },
  { id: 'vnd-03', name: 'Al-Mawaddah Provider LA Saudi', code: 'VND-LA-MAW', type: 'LA_PROVIDER', phone: '+96650000000', email: 'la@almawaddah.sa', address: 'Madinah Munawwarah', isActive: true }
];

export const INITIAL_VENDOR_BILLS: VendorBill[] = [
  {
    id: 'vbill-01',
    billNumber: 'INV-SV-202607-01',
    vendorId: 'vnd-01',
    kloterId: 'klt-01',
    cogsAccountId: 'coa-5101',
    billDate: '2026-07-05',
    dueDate: '2026-08-01',
    totalAmount: 125000000, // Tiket untuk Kloter Alpha
    paidAmount: 50000000,
    status: 'PARTIAL',
    description: 'Deposit Tiket SV 10 Seat Kloter Syawal Alpha',
    journalEntryId: 'jv-vb-01'
  }
];

export const INITIAL_VENDOR_PAYMENTS: VendorPayment[] = [
  {
    id: 'vpay-01',
    paymentNumber: 'VPAY-202607-001',
    billId: 'vbill-01',
    paymentDate: '2026-07-06',
    amount: 50000000,
    bankAccountId: 'coa-1102',
    referenceNo: 'TRX-BSI-991200',
    notes: 'DP 40% Deposit Tiket SV Kloter Syawal Alpha',
    journalEntryId: 'jv-vp-01'
  }
];

export const INITIAL_MITRA: Mitra[] = [
  {
    id: 'mtr-01',
    code: 'MTR-001',
    name: 'H. Ahmad Subarkah (KBIH Al-Falah)',
    phone: '081298765432',
    email: 'subarkah.kbih@gmail.com',
    bankInfo: 'BSI 7123456789 a.n Ahmad Subarkah',
    defaultFeePerPax: 1000000,
    isActive: true,
    notes: 'Mitra Wilayah Jakarta Selatan'
  },
  {
    id: 'mtr-02',
    code: 'MTR-002',
    name: 'Hj. Siti Aminah (Majlis Ta\'lim An-Nur)',
    phone: '081311223344',
    email: 'sitiaminah@yahoo.com',
    bankInfo: 'Bank Mandiri 127000987654 a.n Siti Aminah',
    defaultFeePerPax: 1250000,
    isActive: true,
    notes: 'Mitra Wilayah Depok & Bogor'
  }
];

export const INITIAL_COMMISSIONS: MitraCommission[] = [
  {
    id: 'com-01',
    commissionNumber: 'COM-202607-001',
    mitraId: 'mtr-01',
    registrationId: 'reg-01',
    jamaahName: 'Budi Santoso',
    packageName: 'Umroh Reguler 9 Hari',
    kloterName: 'Umrah Syawal 1447H Group A',
    feeAmount: 1000000,
    status: 'PENDING',
    createdDate: '2026-07-01'
  },
  {
    id: 'com-02',
    commissionNumber: 'COM-202607-002',
    mitraId: 'mtr-02',
    registrationId: 'reg-02',
    jamaahName: 'Siti Rahmah',
    packageName: 'Umroh Plus Dubai 12 Hari',
    kloterName: 'Umrah Plus Dubai Group B',
    feeAmount: 1250000,
    status: 'PAID',
    createdDate: '2026-07-05',
    paidDate: '2026-07-10',
    bankAccountId: 'coa-1102',
    referenceNo: 'TRF-MITRA-002',
    journalEntryId: 'jv-com-02',
    notes: 'Pencairan komisi via BSI IDR'
  }
];
