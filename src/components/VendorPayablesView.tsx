import React, { useState } from 'react';
import { Vendor, VendorBill, DepartureKloter, ChartOfAccount, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
import { Building, PlusCircle, Receipt, CheckCircle2, X, Lock } from 'lucide-react';

interface VendorPayablesViewProps {
  vendors: Vendor[];
  vendorBills: VendorBill[];
  kloters: DepartureKloter[];
  coaList: ChartOfAccount[];
  userRole?: UserRole;
  onRefreshData: () => void;
}

export const VendorPayablesView: React.FC<VendorPayablesViewProps> = ({
  vendors,
  vendorBills,
  kloters,
  coaList,
  userRole = 'ACCOUNTANT',
  onRefreshData
}) => {
  const perm = getRolePermissions(userRole);
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);

  // Form States
  const [vendorId, setVendorId] = useState('');
  const [kloterId, setKloterId] = useState('');
  const [cogsAccountId, setCogsAccountId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cogsAccounts = coaList.filter(a => a.category === 'COGS');

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vendorId || !kloterId || !cogsAccountId || !totalAmount) {
      setErrorMsg('Mohon lengkapi Vendor, Kloter, Akun HPP, dan Nominal Tagihan.');
      return;
    }

    try {
      setIsSubmitting(true);
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

      onRefreshData();
      setIsNewBillOpen(false);
      setTotalAmount('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Manajemen Utang Vendor & HPP Operasional Kloter</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan tagihan maskapai, hotel Makkah/Madinah, provider LA, & pengalokasian HPP per Kloter
          </p>
        </div>

        {perm.canManageVendors && !perm.isReadOnly ? (
          <button
            onClick={() => setIsNewBillOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Tagihan Vendor</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-xs rounded-sm flex items-center space-x-1 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Mode Lihat Tagihan</span>
          </div>
        )}
      </div>

      {/* Vendor Bills List */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4">No. Invoice Vendor</th>
              <th className="py-3 px-4">Nama Vendor</th>
              <th className="py-3 px-4">Kloter Dialokasikan</th>
              <th className="py-3 px-4">Tanggal Invoice</th>
              <th className="py-3 px-4 text-right">Total Tagihan (HPP)</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {vendorBills.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Belum ada tagihan vendor yang tercatat.
                </td>
              </tr>
            ) : (
              vendorBills.map((b) => {
                const vnd = vendors.find(v => v.id === b.vendorId);
                const klt = kloters.find(k => k.id === b.kloterId);
                return (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{b.billNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{vnd?.name || 'Vendor'}</td>
                    <td className="py-3 px-4">{klt?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{b.billDate}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatIDR(b.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 font-bold rounded-sm uppercase text-[10px] tracking-wider">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal New Bill */}
      {isNewBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm">Catat Tagihan Vendor Baru (HPP)</h3>
              <button onClick={() => setIsNewBillOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              {errorMsg && <div className="p-3 bg-red-100 text-red-800 rounded-sm border border-red-200 font-medium">{errorMsg}</div>}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Vendor *</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  required
                >
                  <option value="">-- Pilih Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type})
                    </option>
                  ))}
                </select>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm"
                >
                  Posting Jurnal Utang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
