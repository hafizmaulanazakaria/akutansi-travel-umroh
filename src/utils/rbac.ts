import { UserRole } from '../types';

export interface RolePermission {
  label: string;
  canRegisterJamaah: boolean;
  canReceivePayment: boolean;
  canManageVendors: boolean;
  canManagePackages: boolean;
  canRecognizeRevenue: boolean;
  canManageCOA: boolean;
  canManageJournals: boolean;
  canDeleteData: boolean;
  isReadOnly: boolean;
  allowedTabs: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  ADMIN_CS: {
    label: 'Admin CS / Pendaftaran',
    canRegisterJamaah: true,
    canReceivePayment: false, // TIDAK BISA menerima/mencatat uang tunai
    canManageVendors: false,
    canManagePackages: true, // CS can manage/view travel packages
    canRecognizeRevenue: false, // TIDAK BISA melakukan pengakuan pendapatan
    canManageCOA: false,
    canManageJournals: false,
    canDeleteData: false, // TIDAK BISA menghapus data
    isReadOnly: false,
    allowedTabs: ['dashboard', 'jamaah', 'kloter', 'packages', 'mitra', 'settings']
  },
  KASIR_FINANCE: {
    label: 'Kasir & Keuangan',
    canRegisterJamaah: false, // CS handles registrations
    canReceivePayment: true, // BISA input pembayaran (DP/Cicilan/Pelunasan) & cetak kuitansi
    canManageVendors: true, // BISA bayar tagihan vendor
    canManagePackages: false,
    canRecognizeRevenue: false, // TIDAK BISA menekan tombol Akui Pendapatan Kloter
    canManageCOA: false, // TIDAK BISA mengubah struktur COA
    canManageJournals: false,
    canDeleteData: false,
    isReadOnly: false,
    allowedTabs: ['dashboard', 'jamaah', 'kloter', 'packages', 'vendors', 'mitra', 'settings']
  },
  ACCOUNTANT: {
    label: 'Senior Accountant',
    canRegisterJamaah: true,
    canReceivePayment: true,
    canManageVendors: true,
    canManagePackages: true,
    canRecognizeRevenue: true,
    canManageCOA: true,
    canManageJournals: true,
    canDeleteData: true,
    isReadOnly: false,
    allowedTabs: ['dashboard', 'jamaah', 'kloter', 'packages', 'journals', 'coa', 'vendors', 'mitra', 'reports', 'settings']
  },
  DIREKSI_OWNER: {
    label: 'Direksi / Owner (Executive View)',
    canRegisterJamaah: false,
    canReceivePayment: false,
    canManageVendors: false,
    canManagePackages: false,
    canRecognizeRevenue: false,
    canManageCOA: false,
    canManageJournals: false,
    canDeleteData: false,
    isReadOnly: true, // READ-ONLY: Hanya BISA Melihat Data
    allowedTabs: ['dashboard', 'jamaah', 'kloter', 'packages', 'journals', 'coa', 'vendors', 'mitra', 'reports', 'settings']
  }
};

export function getRolePermissions(role?: string | UserRole): RolePermission {
  if (!role) return ROLE_PERMISSIONS.ACCOUNTANT;
  return (ROLE_PERMISSIONS as Record<string, RolePermission>)[role] || ROLE_PERMISSIONS.ACCOUNTANT;
}
