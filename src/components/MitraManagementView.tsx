import React, { useState } from 'react';
import { Mitra, MitraCommission, ChartOfAccount, UserRole } from '../types';
import { formatIDR, formatDateIndo } from '../utils/formatters';
import { getRolePermissions } from '../utils/rbac';
import {
  Users,
  UserCheck,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Landmark,
  FileText,
  X,
  Building,
  Phone,
  CreditCard,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight
} from 'lucide-react';

interface MitraManagementViewProps {
  mitraList: Mitra[];
  commissionList: MitraCommission[];
  coaList: ChartOfAccount[];
  userRole?: UserRole;
  onRefreshData: () => void;
}

export const MitraManagementView: React.FC<MitraManagementViewProps> = ({
  mitraList,
  commissionList,
  coaList,
  userRole = 'ACCOUNTANT',
  onRefreshData
}) => {
  const perm = getRolePermissions(userRole);
  const [activeSubTab, setActiveSubTab] = useState<'PAYOUT' | 'MASTER'>('PAYOUT');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State for New/Edit Mitra
  const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
  const [editingMitra, setEditingMitra] = useState<Mitra | null>(null);
  const [mitraName, setMitraName] = useState('');
  const [mitraPhone, setMitraPhone] = useState('');
  const [mitraEmail, setMitraEmail] = useState('');
  const [mitraBankInfo, setMitraBankInfo] = useState('');
  const [mitraDefaultFee, setMitraDefaultFee] = useState('1000000');
  const [mitraNotes, setMitraNotes] = useState('');
  const [isSubmittingMitra, setIsSubmittingMitra] = useState(false);
  const [mitraError, setMitraError] = useState('');

  // Modal State for Commission Payout
  const [selectedCommission, setSelectedCommission] = useState<MitraCommission | null>(null);
  const [payoutBankAccountId, setPayoutBankAccountId] = useState('');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [payoutRefNo, setPayoutRefNo] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // Filter COA for Kas/Bank
  const bankAccounts = coaList.filter(a => a.category === 'ASSET' && a.currency === 'IDR');

  // KPI Calculations
  const activeMitraCount = mitraList.filter(m => m.isActive).length;
  const totalJamaahReferred = commissionList.length;
  const totalPaidCommission = commissionList
    .filter(c => c.status === 'PAID')
    .reduce((acc, c) => acc + (c.feeAmount || 0), 0);
  const totalPendingCommission = commissionList
    .filter(c => c.status === 'PENDING' || c.status === 'APPROVED')
    .reduce((acc, c) => acc + (c.feeAmount || 0), 0);

  // Open Mitra Modal (New or Edit)
  const handleOpenMitraModal = (mitra?: Mitra) => {
    setMitraError('');
    if (mitra) {
      setEditingMitra(mitra);
      setMitraName(mitra.name);
      setMitraPhone(mitra.phone);
      setMitraEmail(mitra.email || '');
      setMitraBankInfo(mitra.bankInfo);
      setMitraDefaultFee(String(mitra.defaultFeePerPax));
      setMitraNotes(mitra.notes || '');
    } else {
      setEditingMitra(null);
      setMitraName('');
      setMitraPhone('');
      setMitraEmail('');
      setMitraBankInfo('');
      setMitraDefaultFee('1000000');
      setMitraNotes('');
    }
    setIsMitraModalOpen(true);
  };

  // Submit Save/Update Mitra
  const handleSaveMitra = async (e: React.FormEvent) => {
    e.preventDefault();
    setMitraError('');
    if (!mitraName.trim() || !mitraPhone.trim()) {
      setMitraError('Nama Mitra dan Nomor WhatsApp/HP wajib diisi.');
      return;
    }

    setIsSubmittingMitra(true);
    try {
      const payload = {
        name: mitraName.trim(),
        phone: mitraPhone.trim(),
        email: mitraEmail.trim(),
        bankInfo: mitraBankInfo.trim() || '-',
        defaultFeePerPax: Number(mitraDefaultFee) || 1000000,
        notes: mitraNotes.trim()
      };

      const url = editingMitra ? `/api/mitra/${editingMitra.id}` : '/api/mitra';
      const method = editingMitra ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan data mitra.');
      }

      setIsMitraModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setMitraError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingMitra(false);
    }
  };

  // Toggle Mitra Status
  const handleToggleMitraStatus = async (mitra: Mitra) => {
    try {
      const res = await fetch(`/api/mitra/${mitra.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !mitra.isActive })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Mitra
  const handleDeleteMitra = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data mitra ini?')) return;
    try {
      const res = await fetch(`/api/mitra/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Payout Modal
  const handleOpenPayoutModal = (com: MitraCommission) => {
    setPayoutError('');
    setSelectedCommission(com);
    setPayoutBankAccountId(bankAccounts[0]?.id || '');
    setPayoutDate(new Date().toISOString().split('T')[0]);
    setPayoutRefNo(`TRF-${Date.now().toString().slice(-6)}`);
    setPayoutNotes(`Pencairan komisi jamaah ${com.jamaahName}`);
  };

  // Submit Payout Commission
  const handleProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission) return;
    setPayoutError('');

    if (!payoutBankAccountId) {
      setPayoutError('Pilih akun Kas/Bank sumber pembayaran.');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await fetch(`/api/commissions/${selectedCommission.id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: payoutBankAccountId,
          paidDate: payoutDate,
          referenceNo: payoutRefNo,
          notes: payoutNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pencairan komisi.');
      }

      setSelectedCommission(null);
      onRefreshData();
    } catch (err: any) {
      setPayoutError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Filtered Lists
  const filteredCommissions = commissionList.filter(c => {
    const m = mitraList.find(x => x.id === c.mitraId);
    const matchSearch =
      c.commissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.jamaahName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m && m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredMitra = mitraList.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.bankInfo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && m.isActive) ||
      (statusFilter === 'INACTIVE' && !m.isActive);

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Modul Agen & Affiliate</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Manajemen Mitra & Komisi Referral
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola master agen/mitra travel, kalkulasi komisi otomatis per jamaah, dan pencairan fee dengan jurnal otomatis.
          </p>
        </div>

        {activeSubTab === 'MASTER' && (
          <button
            onClick={() => handleOpenMitraModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md flex items-center space-x-2 transition-all self-start sm:self-auto shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Mitra Baru</span>
          </button>
        )}
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Mitra Aktif</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {activeMitraCount} <span className="text-xs font-normal text-slate-500">Agen</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jamaah Dari Mitra</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {totalJamaahReferred} <span className="text-xs font-normal text-slate-500">Pax</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Komisi Sudah Dicairkan</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatIDR(totalPaidCommission)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Komisi Pending / Siap Cair</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {formatIDR(totalPendingCommission)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => { setActiveSubTab('PAYOUT'); setSearchTerm(''); setStatusFilter('ALL'); }}
            className={`pb-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              activeSubTab === 'PAYOUT'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tab 1: Ringkasan & Payout Komisi</span>
            {commissionList.filter(c => c.status === 'PENDING').length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-extrabold ml-1">
                {commissionList.filter(c => c.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveSubTab('MASTER'); setSearchTerm(''); setStatusFilter('ALL'); }}
            className={`pb-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              activeSubTab === 'MASTER'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tab 2: Master Data Mitra ({mitraList.length})</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'PAYOUT' ? "Cari jamaah, mitra, no komisi..." : "Cari nama mitra, HP, rekening..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-700 dark:text-slate-200"
            >
              {activeSubTab === 'PAYOUT' ? (
                <>
                  <option value="ALL">Semua Status Komisi</option>
                  <option value="PENDING">PENDING (Belum Cair)</option>
                  <option value="PAID font-bold">PAID (Sudah Cair)</option>
                </>
              ) : (
                <>
                  <option value="ALL">Semua Mitra</option>
                  <option value="ACTIVE">Status: AKTIF</option>
                  <option value="INACTIVE">Status: NON-AKTIF</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* TAB 1: RINGKASAN & PAYOUT KOMISI */}
        {activeSubTab === 'PAYOUT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">No. Referensi</th>
                  <th className="p-3.5">Nama Mitra & Rekening</th>
                  <th className="p-3.5">Nama Jamaah (Referral)</th>
                  <th className="p-3.5">Paket & Kloter</th>
                  <th className="p-3.5 text-right">Nominal Fee (IDR)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Aksi / Pencairan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada data komisi mitra yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((com) => {
                    const m = mitraList.find(x => x.id === com.mitraId);
                    return (
                      <tr key={com.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {com.commissionNumber}
                          <div className="text-[10px] font-sans font-normal text-slate-400 mt-0.5">
                            Tgl: {formatDateIndo(com.createdDate)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{m ? m.name : 'Mitra'}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {m ? m.bankInfo : '-'}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{com.jamaahName}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{com.packageName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{com.kloterName}</div>
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatIDR(com.feeAmount)}
                        </td>

                        <td className="p-3.5 text-center">
                          {com.status === 'PAID' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              PAID (CAIR)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              <Clock className="w-3 h-3 mr-1" />
                              PENDING
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          {com.status === 'PAID' ? (
                            <div className="text-[10px] text-slate-500">
                              Cair: {com.paidDate ? formatDateIndo(com.paidDate) : '-'}
                              <div className="font-mono text-[9px] text-slate-400">Ref: {com.referenceNo || '-'}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenPayoutModal(com)}
                              disabled={perm.isReadOnly}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1 transition-all mx-auto disabled:opacity-50"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Cairkan Komisi</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: MASTER DATA MITRA */}
        {activeSubTab === 'MASTER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">Kode</th>
                  <th className="p-3.5">Nama Mitra / Agen</th>
                  <th className="p-3.5">Kontak WhatsApp / Email</th>
                  <th className="p-3.5">Rekening Bank Transfer</th>
                  <th className="p-3.5 text-right">Standard Fee / Pax</th>
                  <th className="p-3.5 text-center">Total Jamaah</th>
                  <th className="p-3.5 text-right">Komisi Cair</th>
                  <th className="p-3.5 text-right">Komisi Pending</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredMitra.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Tidak ada data mitra yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredMitra.map((mitra) => {
                    const commissions = commissionList.filter(c => c.mitraId === mitra.id);
                    const totalJamaah = commissions.length;
                    const paidAmt = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.feeAmount || 0), 0);
                    const pendingAmt = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + (c.feeAmount || 0), 0);

                    return (
                      <tr key={mitra.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {mitra.code}
                        </td>

                        <td className="p-3.5">
                          <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{mitra.name}</div>
                          {mitra.notes && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">{mitra.notes}</div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{mitra.phone}</span>
                          </div>
                          {mitra.email && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{mitra.email}</div>
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {mitra.bankInfo}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(mitra.defaultFeePerPax)}
                        </td>

                        <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                          {totalJamaah} Pax
                        </td>

                        <td className="p-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatIDR(paidAmt)}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatIDR(pendingAmt)}
                        </td>

                        <td className="p-3.5 text-center">
                          {mitra.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              AKTIF
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              NON-AKTIF
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenMitraModal(mitra)}
                              title="Edit Mitra"
                              className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleMitraStatus(mitra)}
                              title={mitra.isActive ? "Non-Aktifkan Mitra" : "Aktifkan Mitra"}
                              className="p-1.5 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {mitra.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                            </button>
                            <button
                              onClick={() => handleDeleteMitra(mitra.id)}
                              title="Hapus Mitra"
                              className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FORM TAMBAH / EDIT MITRA */}
      {isMitraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">
                  {editingMitra ? 'Edit Master Data Mitra' : 'Tambah Mitra / Agen Baru'}
                </h3>
              </div>
              <button onClick={() => setIsMitraModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMitra} className="p-6 space-y-4">
              {mitraError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{mitraError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap / Instansi Mitra *
                </label>
                <input
                  type="text"
                  placeholder="e.g. H. Ahmad Subarkah (KBIH Al-Falah)"
                  value={mitraName}
                  onChange={(e) => setMitraName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP *
                  </label>
                  <input
                    type="text"
                    placeholder="081298765432"
                    value={mitraPhone}
                    onChange={(e) => setMitraPhone(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="mitra@gmail.com"
                    value={mitraEmail}
                    onChange={(e) => setMitraEmail(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Rekening Bank Transfer (Informasi Pembayaran Komisi) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BSI 7123456789 a.n Ahmad Subarkah"
                  value={mitraBankInfo}
                  onChange={(e) => setMitraBankInfo(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Standard Fee per Jamaah (IDR) *
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={mitraDefaultFee}
                  onChange={(e) => setMitraDefaultFee(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tarif standar ini akan otomatis diisi saat mendaftarkan jamaah baru via mitra ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Wilayah / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan wilayah kerja atau spesifikasi khusus..."
                  value={mitraNotes}
                  onChange={(e) => setMitraNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsMitraModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMitra}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmittingMitra ? 'Menyimpan...' : 'Simpan Data Mitra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM PAYOUT / PENCAIRAN KOMISI */}
      {selectedCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">Form Pencairan Komisi Mitra & Posting Jurnal</h3>
              </div>
              <button onClick={() => setSelectedCommission(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayout} className="p-6 space-y-4">
              {payoutError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}

              {/* Commission Brief Summary */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>No. Komisi:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedCommission.commissionNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Jamaah Referral:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCommission.jamaahName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Paket & Kloter:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCommission.packageName}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Nominal Fee Komisi:</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatIDR(selectedCommission.feeAmount)}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Akun Kas / Bank Sumber Pembayaran *
                </label>
                <select
                  value={payoutBankAccountId}
                  onChange={(e) => setPayoutBankAccountId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="">-- Pilih Akun Kas/Bank --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name} — Saldo: {formatIDR(b.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pencairan *
                  </label>
                  <input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    No. Ref Transfer / Bukti
                  </label>
                  <input
                    type="text"
                    placeholder="TRF-BSI-992120"
                    value={payoutRefNo}
                    onChange={(e) => setPayoutRefNo(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pencairan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Transfer via BSI ke rekening mitra"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              {/* Journal Preview */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1.5 text-[11px] font-mono">
                <div className="font-bold text-slate-700 dark:text-slate-300 font-sans text-xs flex items-center justify-between">
                  <span>Pratinjau Jurnal Otomatis:</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Double-Entry Balanced</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>DEBIT : [6104] Beban Komisi Mitra & Agen</span>
                  <span className="font-bold text-emerald-600">{formatIDR(selectedCommission.feeAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>KREDIT: Kas / Bank Sumber</span>
                  <span className="font-bold text-rose-600">{formatIDR(selectedCommission.feeAmount)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedCommission(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{isSubmittingPayout ? 'Memproses...' : 'Proses Pencairan & Posting Jurnal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
