import React, { useState } from 'react';
import { ChartOfAccount, AccountCategory, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR, formatUSD } from '../utils/formatters';
import { Landmark, PlusCircle, Search, Filter, ShieldCheck, CheckCircle2, X, Lock } from 'lucide-react';

interface COAViewProps {
  coaList: ChartOfAccount[];
  userRole?: UserRole;
  onRefreshData: () => void;
}

export const COAView: React.FC<COAViewProps> = ({ coaList, userRole = 'ACCOUNTANT', onRefreshData }) => {
  const perm = getRolePermissions(userRole);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New COA Form States
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AccountCategory>('ASSET');
  const [newCurrency, setNewCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [newDesc, setNewDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCoa = coaList.filter((a) => {
    const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchesSearch =
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newCode || !newName) {
      setErrorMsg('Kode Akun dan Nama Akun wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/coa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          category: newCategory,
          currency: newCurrency,
          description: newDesc
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambah akun COA.');
      }

      onRefreshData();
      setIsAddModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: AccountCategory) => {
    switch (cat) {
      case 'ASSET': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'LIABILITY': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'EQUITY': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'REVENUE': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
      case 'COGS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'EXPENSE': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <span>Chart of Accounts (COA) Travel Umrah & Haji</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Master bagan akun standar PSAK khusus travel (Unearned Revenue, HPP Tiket, Hotel Makkah, LA Saudi)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {perm.canManageCOA ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Akun COA</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-xs rounded-sm flex items-center space-x-1 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Struktur COA Dikunci</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-sm p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari Kode Akun / Nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-bold">
          {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'COGS', 'EXPENSE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-sm border transition-all uppercase tracking-wider text-[11px] ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* COA Table */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4">Kode Akun</th>
              <th className="py-3 px-4">Nama Akun</th>
              <th className="py-3 px-4">Kategori Akun</th>
              <th className="py-3 px-4">Mata Uang</th>
              <th className="py-3 px-4 text-right">Saldo Saat Ini</th>
              <th className="py-3 px-4">Keterangan Akun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredCoa.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{a.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.name}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadge(a.category)}`}>
                    {a.category}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{a.currency}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                  {a.currency === 'USD' ? formatUSD(a.balance) : formatIDR(a.balance)}
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">{a.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add COA Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm">Tambah Akun COA Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCoa} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-100 text-red-800 rounded-sm border border-red-200 font-medium">{errorMsg}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Akun *</label>
                  <input
                    type="text"
                    placeholder="e.g. 5106"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Uang</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono outline-none"
                  >
                    <option value="IDR">IDR (Rupiah)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Akun COA *</label>
                <input
                  type="text"
                  placeholder="e.g. HPP Bus & Transportasi Lokal Saudi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Akun *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-semibold"
                >
                  <option value="ASSET">ASSET (Aset / Aktiva)</option>
                  <option value="LIABILITY">LIABILITY (Kewajiban / Liabilitas)</option>
                  <option value="EQUITY">EQUITY (Modal / Ekuitas)</option>
                  <option value="REVENUE">REVENUE (Pendapatan)</option>
                  <option value="COGS">COGS (Harga Pokok Penjualan - HPP)</option>
                  <option value="EXPENSE">EXPENSE (Beban Operasional)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Deskripsi singkat penggunaan akun ini"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
