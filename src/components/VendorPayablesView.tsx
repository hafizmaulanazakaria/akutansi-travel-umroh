import React, { useState } from 'react';
import { Vendor, VendorBill, VendorPayment, DepartureKloter, ChartOfAccount, UserRole, VendorType, VENDOR_TYPE_LABELS } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
import { Building, PlusCircle, CheckCircle2, X, Lock, Users, Edit, Trash2, XCircle, Wallet, History } from 'lucide-react';

interface VendorPayablesViewProps {
  vendors: Vendor[];
  vendorBills: VendorBill[];
  vendorPayments?: VendorPayment[];
  kloters: DepartureKloter[];
  coaList: ChartOfAccount[];
  userRole?: UserRole;
  onRefreshData: () => void;
}

export const VendorPayablesView: React.FC<VendorPayablesViewProps> = ({
  vendors,
  vendorBills,
  vendorPayments = [],
  kloters,
  coaList,
  userRole = 'ACCOUNTANT',
  onRefreshData
}) => {
  const perm = getRolePermissions(userRole);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'BILLS' | 'VENDORS'>('BILLS');

  // Modal States
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  
  // Payment Modal States
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<VendorBill | null>(null);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payBankAccountId, setPayBankAccountId] = useState<string>('');
  const [payReferenceNo, setPayReferenceNo] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payErrorMsg, setPayErrorMsg] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // History Modal States
  const [selectedBillForHistory, setSelectedBillForHistory] = useState<VendorBill | null>(null);

  // Form States (Bill)
  const [vendorId, setVendorId] = useState('');
  const [kloterId, setKloterId] = useState('');
  const [cogsAccountId, setCogsAccountId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [billErrorMsg, setBillErrorMsg] = useState('');
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  // Form States (Vendor)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vName, setVName] = useState('');
  const [vCode, setVCode] = useState('');
  const [vType, setVType] = useState<VendorType>('OTHER');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vBank, setVBank] = useState('');
  const [vIsActive, setVIsActive] = useState(true);
  const [vendorErrorMsg, setVendorErrorMsg] = useState('');
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const cogsAccounts = coaList.filter(a => a.category === 'COGS');
  const activeVendors = vendors.filter(v => v.isActive);
  const bankAccounts = coaList.filter(a => a.category === 'ASSET' && (a.code.startsWith('110') || a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank')));

  // --- Handlers for Payment ---
  const handleOpenPayModal = (bill: VendorBill) => {
    const sisa = bill.totalAmount - (bill.paidAmount || 0);
    setSelectedBillForPayment(bill);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAmount(sisa > 0 ? sisa.toString() : '0');
    const defaultBank = bankAccounts[0];
    setPayBankAccountId(defaultBank ? defaultBank.id : '');
    setPayReferenceNo(`TRX-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPayNotes(`Pembayaran tagihan ${bill.billNumber}`);
    setPayErrorMsg('');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPayment) return;
    setPayErrorMsg('');

    const amt = Number(payAmount);
    const sisa = selectedBillForPayment.totalAmount - (selectedBillForPayment.paidAmount || 0);

    if (!payBankAccountId || amt <= 0) {
      setPayErrorMsg('Mohon lengkapi Akun Pembayaran Kas/Bank dan Nominal Pembayaran.');
      return;
    }

    if (amt > sisa + 0.01) {
      setPayErrorMsg(`Nominal bayar melebihi sisa tagihan (${formatIDR(sisa)}).`);
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await fetch('/api/vendor-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: selectedBillForPayment.id,
          paymentDate: payDate,
          amount: amt,
          bankAccountId: payBankAccountId,
          referenceNo: payReferenceNo,
          notes: payNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal merekam pembayaran vendor.');
      }

      setSuccessMessage('Pembayaran vendor berhasil dicatat & Jurnal Otomatis ter-posting.');
      setTimeout(() => setSuccessMessage(''), 4000);
      setSelectedBillForPayment(null);
      onRefreshData();
    } catch (err: any) {
      setPayErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // --- Handlers for Vendor Bill ---
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillErrorMsg('');

    if (!vendorId || !kloterId || !cogsAccountId || !totalAmount) {
      setBillErrorMsg('Mohon lengkapi Vendor, Kloter, Akun HPP, dan Nominal Tagihan.');
      return;
    }

    try {
      setIsSubmittingBill(true);
      const res = await fetch('/api/vendor-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          kloterId,
          cogsAccountId,
          billDate,
          dueDate: dueDate || billDate,
          totalAmount: Number(totalAmount),
          description
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal merekam tagihan vendor.');
      }

      setSuccessMessage('Tagihan berhasil dicatat.');
      setTimeout(() => setSuccessMessage(''), 3000);
      onRefreshData();
      setIsNewBillOpen(false);
      setTotalAmount('');
      setDescription('');
    } catch (err: any) {
      setBillErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // --- Handlers for Master Vendor ---
  const openNewVendorModal = () => {
    setEditingVendor(null);
    setVName('');
    setVCode(`VND-${Date.now().toString().slice(-4)}`);
    setVType('OTHER');
    setVPhone('');
    setVEmail('');
    setVAddress('');
    setVBank('');
    setVIsActive(true);
    setVendorErrorMsg('');
    setIsVendorModalOpen(true);
  };

  const openEditVendorModal = (v: Vendor) => {
    setEditingVendor(v);
    setVName(v.name);
    setVCode(v.code);
    setVType(v.type);
    setVPhone(v.phone);
    setVEmail(v.email);
    setVAddress(v.address);
    setVBank(v.bankInfo || '');
    setVIsActive(v.isActive);
    setVendorErrorMsg('');
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setVendorErrorMsg('');
    
    if (!vName || !vCode) {
      setVendorErrorMsg('Nama dan Kode Vendor wajib diisi.');
      return;
    }

    try {
      setIsSubmittingVendor(true);
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
      const method = editingVendor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vName,
          code: vCode,
          type: vType,
          phone: vPhone,
          email: vEmail,
          address: vAddress,
          bankInfo: vBank,
          isActive: vIsActive
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data vendor.');
      }

      setSuccessMessage(editingVendor ? 'Vendor berhasil diperbarui.' : 'Vendor baru berhasil ditambahkan.');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      if (!editingVendor && isNewBillOpen) {
        setVendorId(data.id);
      }
      
      setIsVendorModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setVendorErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleToggleVendor = async (v: Vendor) => {
    if (perm.isReadOnly || !perm.canManageVendors) return;
    try {
      const res = await fetch(`/api/vendors/${v.id}/toggle`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengubah status vendor.');
      }
      setSuccessMessage(`Status vendor "${v.name}" diperbarui.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleDeleteVendor = async (v: Vendor) => {
    if (perm.isReadOnly || !perm.canManageVendors) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus vendor "${v.name}"?`)) return;

    try {
      const res = await fetch(`/api/vendors/${v.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus vendor.');
      }
      setSuccessMessage(`Vendor "${v.name}" berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Manajemen Vendor & HPP Operasional</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan Master Vendor, tagihan maskapai, hotel, LA, & pengalokasian HPP per Kloter
          </p>
        </div>

        {perm.canManageVendors && !perm.isReadOnly ? (
          <div className="flex space-x-2">
            <button
              onClick={openNewVendorModal}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Users className="w-4 h-4" />
              <span>+ Vendor Baru</span>
            </button>
            <button
              onClick={() => setIsNewBillOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tagihan HPP</span>
            </button>
          </div>
        ) : (
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-xs rounded-sm flex items-center space-x-1 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Mode Lihat</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-sm border border-emerald-200 dark:border-emerald-800 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('BILLS')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'BILLS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Tagihan & HPP (Utang)
        </button>
        <button
          onClick={() => setActiveTab('VENDORS')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'VENDORS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Master Data Vendor
        </button>
      </div>

      {/* Content based on Tab */}
      {activeTab === 'BILLS' && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0F172A] text-slate-200 border-b border-slate-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Invoice Vendor</th>
                  <th className="py-3.5 px-4">Nama Vendor</th>
                  <th className="py-3.5 px-4">Kloter Dialokasikan</th>
                  <th className="py-3.5 px-4">Tanggal Invoice</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan (HPP)</th>
                  <th className="py-3.5 px-4 text-right">Sisa Tagihan (IDR)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {vendorBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Belum ada tagihan vendor yang tercatat.
                    </td>
                  </tr>
                ) : (
                  vendorBills.map((b) => {
                    const vnd = vendors.find(v => v.id === b.vendorId);
                    const klt = kloters.find(k => k.id === b.kloterId);
                    const sisa = b.totalAmount - (b.paidAmount || 0);
                    const isPaid = b.status === 'PAID' || sisa <= 0;
                    const isPartial = b.status === 'PARTIAL' || (b.paidAmount > 0 && sisa > 0);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{b.billNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {vnd?.name || 'Vendor'}
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">{vnd ? VENDOR_TYPE_LABELS[vnd.type] : ''}</div>
                        </td>
                        <td className="py-3 px-4">{klt?.name || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{b.billDate}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatIDR(b.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {sisa > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">{formatIDR(sisa)}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">Rp 0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPaid ? (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold rounded-sm uppercase text-[10px] tracking-wider">
                              PAID
                            </span>
                          ) : isPartial ? (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 font-bold rounded-sm uppercase text-[10px] tracking-wider">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 font-bold rounded-sm uppercase text-[10px] tracking-wider">
                              UNPAID
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {!isPaid && !perm.isReadOnly ? (
                              <button
                                onClick={() => handleOpenPayModal(b)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-[11px] flex items-center space-x-1 shadow-sm transition-all"
                                title="Catat Pembayaran Vendor"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                <span>Bayar</span>
                              </button>
                            ) : isPaid ? (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold rounded text-[10px] flex items-center space-x-1 border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Lunas</span>
                              </span>
                            ) : null}

                            <button
                              onClick={() => setSelectedBillForHistory(b)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-sm text-[11px] flex items-center space-x-1 border border-slate-300 dark:border-slate-700 transition-all"
                              title="Lihat Riwayat Pembayaran"
                            >
                              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Riwayat</span>
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
        </div>
      )}

      {activeTab === 'VENDORS' && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0F172A] text-slate-200 border-b border-slate-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Kode & Vendor</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Info Rekening</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Tidak ada data vendor.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !v.isActive ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold text-[11px] rounded border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                            {v.code}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{v.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{v.address || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px] rounded border border-slate-200 dark:border-slate-700">
                          {VENDOR_TYPE_LABELS[v.type] || v.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>{v.phone || '-'}</div>
                        <div className="text-slate-500">{v.email || '-'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {v.bankInfo || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {v.isActive ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded-full border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] rounded-full border border-slate-300 dark:border-slate-700">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Non-Aktif</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {perm.canManageVendors && !perm.isReadOnly ? (
                            <>
                              <button
                                onClick={() => openEditVendorModal(v)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Edit Vendor"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleVendor(v)}
                                className={`p-1.5 rounded transition-colors ${
                                  v.isActive
                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                }`}
                                title={v.isActive ? 'Non-aktifkan Vendor' : 'Aktifkan Vendor'}
                              >
                                {v.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteVendor(v)}
                                className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Hapus Vendor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No access</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Catat Pembayaran Vendor */}
      {selectedBillForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Catat Pembayaran Vendor</span>
              </h3>
              <button
                onClick={() => setSelectedBillForPayment(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              {payErrorMsg && (
                <div className="p-3 bg-red-100 text-red-800 rounded-sm border border-red-200 font-medium">
                  {payErrorMsg}
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">No. Invoice:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {selectedBillForPayment.billNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nama Vendor:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {vendors.find(v => v.id === selectedBillForPayment.vendorId)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kloter:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {kloters.find(k => k.id === selectedBillForPayment.kloterId)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Tagihan:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatIDR(selectedBillForPayment.totalAmount)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Sudah Dibayar: </span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatIDR(selectedBillForPayment.paidAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Sisa Tagihan: </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {formatIDR(selectedBillForPayment.totalAmount - (selectedBillForPayment.paidAmount || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pembayaran *
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Bayar (IDR) *
                  </label>
                  <input
                    type="number"
                    placeholder="Masukkan nominal"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 outline-none"
                    required
                  />
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Otomatis sisa tagihan</span>
                    <button
                      type="button"
                      onClick={() => setPayAmount((selectedBillForPayment.totalAmount - (selectedBillForPayment.paidAmount || 0)).toString())}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Bayar Full
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Akun Pembayaran (Sumber Kas/Bank) *
                </label>
                <select
                  value={payBankAccountId}
                  onChange={(e) => setPayBankAccountId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono font-medium text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">-- Pilih Akun Kas/Bank --</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} (Saldo: {formatIDR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No. Referensi / Bukti Transfer
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRX-20260724-001"
                  value={payReferenceNo}
                  onChange={(e) => setPayReferenceNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload / Catatan Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan pelunasan, keterangan transfer, atau referensi berkas..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBillForPayment(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-sm shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingPayment ? 'Memproses...' : 'Konfirmasi & Post Jurnal Pembayaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Riwayat Pembayaran Vendor */}
      {selectedBillForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-400" />
                <span>Riwayat Pembayaran Vendor</span>
              </h3>
              <button
                onClick={() => setSelectedBillForHistory(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Info Invoice */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-sm border border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">No. Invoice:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {selectedBillForHistory.billNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Nama Vendor:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {vendors.find(v => v.id === selectedBillForHistory.vendorId)?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatIDR(selectedBillForHistory.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Sisa Tagihan:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatIDR(selectedBillForHistory.totalAmount - (selectedBillForHistory.paidAmount || 0))}
                  </span>
                </div>
              </div>

              {/* Table History */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">No. Referensi</th>
                      <th className="py-2.5 px-3">Sumber Kas/Bank</th>
                      <th className="py-2.5 px-3 text-right">Nominal Dibayar</th>
                      <th className="py-2.5 px-3 text-right">Sisa Tagihan</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(() => {
                      const historyList = (vendorPayments || []).filter(p => p.billId === selectedBillForHistory.id);
                      if (historyList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500">
                              Belum ada riwayat transaksi pembayaran untuk tagihan ini.
                            </td>
                          </tr>
                        );
                      }

                      let runningPaid = 0;
                      return historyList.map((p) => {
                        runningPaid += p.amount;
                        const remainingAfter = Math.max(0, selectedBillForHistory.totalAmount - runningPaid);
                        const bankCoa = coaList.find(c => c.id === p.bankAccountId);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {p.paymentDate}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {p.referenceNo || p.paymentNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {bankCoa ? `${bankCoa.code} - ${bankCoa.name}` : 'Kas/Bank'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatIDR(p.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {formatIDR(remainingAfter)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {p.notes || '-'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBillForHistory(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-sm shadow-sm transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal New Bill */}
      {isNewBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm">Catat Tagihan Vendor Baru (HPP)</h3>
              <button onClick={() => setIsNewBillOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              {billErrorMsg && <div className="p-3 bg-red-100 text-red-800 rounded-sm border border-red-200 font-medium">{billErrorMsg}</div>}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Vendor (Aktif) *</label>
                <div className="flex space-x-2">
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-medium text-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">-- Pilih Vendor --</option>
                    {activeVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({VENDOR_TYPE_LABELS[v.type]})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openNewVendorModal}
                    className="px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-sm font-bold flex items-center space-x-1 whitespace-nowrap hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Vendor Baru</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alokasi Kloter *</label>
                  <select
                    value={kloterId}
                    onChange={(e) => setKloterId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                    required
                  >
                    <option value="">-- Pilih Kloter --</option>
                    {kloters.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Akun HPP *</label>
                  <select
                    value={cogsAccountId}
                    onChange={(e) => setCogsAccountId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                    required
                  >
                    <option value="">-- Pilih Akun COGS --</option>
                    {cogsAccounts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Nominal Tagihan (IDR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 125000000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-sm text-blue-600 dark:text-blue-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan Invoice</label>
                <input
                  type="text"
                  placeholder="e.g. DP Tiket SV 10 Seat CGK-JED"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewBillOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBill}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm"
                >
                  {isSubmittingBill ? 'Memproses...' : 'Posting Jurnal Utang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal CRUD Vendor */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-400" />
                <span>{editingVendor ? 'Edit Master Vendor' : 'Tambah Master Vendor Baru'}</span>
              </h3>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4 text-xs">
              {vendorErrorMsg && <div className="p-3 bg-red-100 text-red-800 rounded-sm border border-red-200 font-medium">{vendorErrorMsg}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Vendor *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Saudi Arabian Airlines"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-medium text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Vendor *</label>
                  <input
                    type="text"
                    placeholder="Contoh: VND-SV"
                    value={vCode}
                    onChange={(e) => setVCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono font-bold uppercase text-blue-600 dark:text-blue-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Layanan *</label>
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value as VendorType)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  required
                >
                  {Object.entries(VENDOR_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. Kontak / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+62812345678"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Informasi Rekening Bank</label>
                <input
                  type="text"
                  placeholder="e.g. BSI 123456789 a.n PT Saudia"
                  value={vBank}
                  onChange={(e) => setVBank(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={vAddress}
                  onChange={(e) => setVAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/80 rounded-sm border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Status Aktif</p>
                  <p className="text-[11px] text-slate-500">
                    Hanya vendor aktif yang muncul di pilihan Tagihan HPP.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVIsActive(!vIsActive)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    vIsActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {vIsActive ? '✓ AKTIF' : 'NON-AKTIF'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVendor}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingVendor ? 'Menyimpan...' : 'Simpan Data Vendor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
