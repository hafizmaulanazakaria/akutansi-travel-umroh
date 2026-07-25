export type UserRole = 'ADMIN_CS' | 'KASIR_FINANCE' | 'ACCOUNTANT' | 'DIREKSI_OWNER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'COGS' | 'EXPENSE';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  currency: 'IDR' | 'USD';
  balance: number; // Current balance in base currency
  isSystem: boolean; // Cannot be deleted
  description?: string;
}

export type PackageCategory = 
  | 'UMRAH_REGULER_9D' 
  | 'UMRAH_PRIVATE' 
  | 'UMRAH_PLUS_DUBAI' 
  | 'UMRAH_PLUS_TURKI' 
  | 'HAJI_PLUS';

export const PACKAGE_CATEGORY_LABELS: Record<PackageCategory, string> = {
  UMRAH_REGULER_9D: 'Umroh Reguler 9 Hari',
  UMRAH_PRIVATE: 'Umroh Private',
  UMRAH_PLUS_DUBAI: 'Umroh Plus Dubai',
  UMRAH_PLUS_TURKI: 'Umroh Plus Turki',
  HAJI_PLUS: 'Haji Plus',
};

export interface TravelPackage {
  id: string;
  code: string;
  name: string;
  category: PackageCategory;
  priceQuad: number; // Price per pax (Quad room)
  priceTriple: number;
  priceDouble: number;
  currency: 'IDR' | 'USD';
  durationDays: number;
  hotelMakkah: string;
  hotelMadinah: string;
  airline: string;
  description: string;
  isActive: boolean;
}

export type KloterStatus = 'PLANNING' | 'OPEN' | 'FULL' | 'DEPARTED' | 'COMPLETED';

export interface KloterEstimatedCOGS {
  flightTicketPerPax: number;
  hotelPerPax: number;
  visaPerPax: number;
  landArrangementPerPax: number;
  handlingEquipmentPerPax: number;
  otherPerPax: number;
}

export interface DepartureKloter {
  id: string;
  packageId: string;
  code: string; // e.g. KLOTER-2026-UMR-01
  name: string; // e.g. Umrah Syawal 1447H Group A
  departureDate: string; // ISO YYYY-MM-DD
  returnDate: string;
  targetQuota: number;
  filledQuota: number;
  status: KloterStatus;
  estimatedCOGS: KloterEstimatedCOGS;
  isRevenueRecognized: boolean; // Flag if Revenue Recognition journal was auto-executed
  revenueRecognitionDate?: string;
  notes?: string;
}

export interface Jamaah {
  id: string;
  nik: string;
  fullName: string;
  passportNumber: string;
  passportExpiry?: string;
  phone: string;
  email: string;
  address: string;
  gender: 'L' | 'P';
  birthDate: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
}

export type RoomType = 'QUAD' | 'TRIPLE' | 'DOUBLE';
export type BookingStatus = 'BOOKED' | 'PARTIAL' | 'PAID_OFF' | 'CANCELLED' | 'DEPARTED';

export interface JamaahRegistration {
  id: string;
  registrationNumber: string; // e.g. REG-202607-001
  jamaahId: string;
  packageId: string;
  kloterId: string;
  mitraId?: string;
  commissionAmount?: number;
  registrationDate: string;
  roomType: RoomType;
  basePrice: number;
  discount: number;
  addOnPrice: number;
  totalBill: number;
  paidAmount: number;
  balanceDue: number;
  unearnedRevenueRecognized: number; // Amount recognized as real revenue upon departure
  status: BookingStatus;
  notes?: string;
}

export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface PaymentSchedule {
  id: string;
  registrationId: string;
  installmentNumber: number; // 1 = DP, 2..5 = Cicilan 1..4, 6 = Pelunasan
  title: string; // e.g., "DP / Booking Fee", "Cicilan Ke-1", "Pelunasan"
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';

export interface JamaahPaymentTransaction {
  id: string;
  receiptNumber: string; // e.g. KW-202607-008
  registrationId: string;
  installmentId?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId: string; // Kas/Bank COA Account ID
  currency: 'IDR' | 'USD';
  exchangeRate: number; // default 1 for IDR
  notes: string;
  createdBy: string;
  journalEntryId: string;
}

export interface JournalLine {
  id: string;
  journalId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
  kloterId?: string; // For tracking Revenue/COGS per departure group
}

export interface JournalEntry {
  id: string;
  journalNumber: string; // e.g. JV-202607-0001
  transactionDate: string;
  referenceType: 'JAMAAH_PAYMENT' | 'REVENUE_RECOGNITION' | 'VENDOR_BILL' | 'VENDOR_PAYMENT' | 'MITRA_COMMISSION' | 'MANUAL_JOURNAL';
  referenceId?: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalLine[];
  createdBy: string;
  createdAt: string;
}

export type VendorType = 'AIRLINE' | 'HOTEL' | 'VISA_PROVIDER' | 'LA_PROVIDER' | 'TRANSPORT' | 'CATERING' | 'EQUIPMENT' | 'OTHER';

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  AIRLINE: 'Airlines',
  HOTEL: 'Hotel',
  VISA_PROVIDER: 'Provider Visa',
  LA_PROVIDER: 'Provider LA',
  TRANSPORT: 'Transportasi',
  CATERING: 'Catering',
  EQUIPMENT: 'Perlengkapan',
  OTHER: 'Lainnya',
};

export interface Vendor {
  id: string;
  name: string;
  code: string;
  type: VendorType;
  phone: string;
  email: string;
  address: string;
  bankInfo?: string;
  isActive: boolean;
}

export type VendorBillStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface VendorBill {
  id: string;
  billNumber: string; // e.g. INV-VND-001
  vendorId: string;
  kloterId: string; // Assigned to specific Kloter
  cogsAccountId: string; // COA Account for HPP
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: VendorBillStatus;
  description: string;
  journalEntryId: string;
}

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  billId: string;
  paymentDate: string;
  amount: number;
  bankAccountId: string; // COA Kas/Bank
  referenceNo: string;
  notes: string;
  journalEntryId: string;
}

export interface KloterProfitabilityReport {
  kloterId: string;
  kloterCode: string;
  kloterName: string;
  packageId?: string;
  packageCategory?: PackageCategory;
  packageName?: string;
  departureDate: string;
  totalJamaah: number;
  totalRevenueRecognized: number; // Recognized from Unearned Revenue
  totalUnearnedRevenuePending: number; // DP/Installments received but not yet departed
  realizedCOGS: {
    flightTickets: number;
    hotels: number;
    visa: number;
    landArrangement: number;
    handlingEquipment: number;
    others: number;
    total: number;
  };
  grossProfit: number;
  profitMarginPercent: number;
  status: KloterStatus;
}

export interface Mitra {
  id: string;
  code: string; // e.g. MTR-001
  name: string;
  phone: string;
  email?: string;
  bankInfo: string;
  defaultFeePerPax: number;
  isActive: boolean;
  notes?: string;
}

export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID';

export interface MitraCommission {
  id: string;
  commissionNumber: string; // e.g. COM-202607-001
  mitraId: string;
  registrationId: string;
  jamaahName: string;
  packageName: string;
  kloterName: string;
  feeAmount: number;
  status: CommissionStatus;
  createdDate: string;
  paidDate?: string;
  bankAccountId?: string;
  referenceNo?: string;
  journalEntryId?: string;
  notes?: string;
}
