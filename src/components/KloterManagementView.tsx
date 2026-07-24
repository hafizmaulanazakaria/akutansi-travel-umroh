import React, { useState } from 'react';
import { DepartureKloter, TravelPackage, JamaahRegistration, JournalEntry, PACKAGE_CATEGORY_LABELS, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR, formatDateIndo } from '../utils/formatters';
import {
  PlaneTakeoff,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  Building,
  Calendar,
  FileCheck,
  ChevronRight,
  Sparkles,
  X,
  Lock
} from 'lucide-react';

interface KloterManagementViewProps {
  kloters: DepartureKloter[];
  packageList: TravelPackage[];
  registrations: JamaahRegistration[];
  userRole?: UserRole;
  onRefreshData: () => void;
}

export const KloterManagementView: React.FC<KloterManagementViewProps> = ({
  kloters,
  packageList,
  registrations,
  userRole = 'ACCOUNTANT',
  onRefreshData
}) => {
  const perm = getRolePermissions(userRole);
  const [selectedKloter, setSelectedKloter] = useState<DepartureKloter | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionSuccessMsg, setRecognitionSuccessMsg] = useState<string>('');
  const [recognitionErrorMsg, setRecognitionErrorMsg] = useState<string>('');

  // Modal Create New Kloter State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPackageId, setNewPackageId] = useState('');
  const [newDepartureDate, setNewDepartureDate] = useState('');
  const [newTargetQuota, setNewTargetQuota] = useState<number | string>(40);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState('');

  // Handle Open Create Modal
  const handleOpenCreateModal = () => {
    const nextNum = String(kloters.length + 1).padStart(2, '0');
    setNewCode(`KLOTER-2026-UMR-${nextNum}`);
    setNewName('');
    setNewPackageId(packageList[0]?.id || '');
    setNewDepartureDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setNewTargetQuota(40);
    setNewNotes('');
    setCreateErrorMsg('');
    setIsCreateModalOpen(true);
  };

  // Handle Create Kloter Submission
  const handleCreateKloter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrorMsg('');

    if (!newName.trim()) {
      setCreateErrorMsg('Nama Kloter tidak boleh kosong.');
      return;
    }
    if (!newPackageId) {
      setCreateErrorMsg('Pilih Jenis Paket untuk kloter ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPkg = packageList.find(p => p.id === newPackageId);
      const duration = selectedPkg?.durationDays || 9;
      
      const depDate = new Date(newDepartureDate);
      const retDate = new Date(depDate.getTime() + duration * 86400000).toISOString().split('T')[0];

      const res = await fetch('/api/kloters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: newPackageId,
          code: newCode || `KLOTER-2026-UMR-${String(kloters.length + 1).padStart(2, '0')}`,
          name: newName,
          departureDate: newDepartureDate,
          returnDate: retDate,
          targetQuota: Number(newTargetQuota) || 40,
          notes: newNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat kloter baru.');
      }

      setIsCreateModalOpen(false);
      setRecognitionSuccessMsg(`Kloter baru "${data.name}" (${data.code}) berhasil dibuat dengan status BELUM BERANGKAT!`);
      onRefreshData();
    } catch (err: any) {
      setCreateErrorMsg(err.message || 'Terjadi kesalahan saat membuat kloter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revenue Recognition Trigger
  const handleRecognizeRevenue = async (kloterId: string) => {
    setIsRecognizing(true);
    setRecognitionSuccessMsg('');
    setRecognitionErrorMsg('');

    try {
      const res = await fetch(`/api/kloters/${kloterId}/recognize-revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengakui pendapatan.');
      }

      setRecognitionSuccessMsg(
        `SUCCESS! Pendapatan sebesar ${formatIDR(data.totalRecognized)} berhasil di-posting dari Liabilitas (Unearned Revenue) ke Pendapatan Diakui!`
      );
      onRefreshData();
    } catch (err: any) {
      setRecognitionErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <PlaneTakeoff className="w-5 h-5 text-blue-600" />
            <span>Manajemen Kloter Keberangkatan & Pengakuan Pendapatan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring rombongan jamaah, estimasi vs realisasi HPP, dan posting otomatis jurnal pengakuan pendapatan saat berangkat
          </p>
        </div>

        {!perm.isReadOnly && perm.canRegisterJamaah && (
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Kloter Baru</span>
          </button>
        )}
      </div>

      {recognitionSuccessMsg && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs rounded-sm flex items-center space-x-2 shadow-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{recognitionSuccessMsg}</span>
        </div>
      )}

      {recognitionErrorMsg && (
        <div className="p-4 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-900 dark:text-red-200 text-xs rounded-sm flex items-center space-x-2 shadow-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{recognitionErrorMsg}</span>
        </div>
      )}

      {/* Kloter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kloters.map((k) => {
          const pkg = packageList.find(p => p.id === k.packageId);
          const regsInK = registrations.filter(r => r.kloterId === k.id && r.status !== 'CANCELLED');
          const totalJamaah = regsInK.length;
          const totalCollected = regsInK.reduce((sum, r) => sum + r.paidAmount, 0);

          return (
            <div
              key={k.id}
              className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-sm border border-slate-300 dark:border-slate-700">
                      {k.code}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                      {k.name}
                    </h3>
                    <p className="text-xs text-slate-500">{pkg?.name}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      k.status === 'DEPARTED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    {k.status === 'DEPARTED' ? 'BERANGKAT' : 'BELUM BERANGKAT'}
                  </span>
                </div>

                {/* Dates & Quota */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-sm space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jadwal Keberangkatan:</span>
                    </span>
                    <span className="font-bold">{formatDateIndo(k.departureDate)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kuota Jamaah:</span>
                    </span>
                    <span className="font-bold">{totalJamaah} / {k.targetQuota} Pax</span>
                  </div>
                </div>

                {/* Financial Unearned Revenue Status */}
                <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm space-y-1.5 text-xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Dana Terkumpul (Unearned Revenue):
                  </div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {formatIDR(totalCollected)}
                  </div>
                  {k.isRevenueRecognized ? (
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Pendapatan Diakui pada: {k.revenueRecognitionDate}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Status: Mengendap di Kewajiban / Liabilitas
                    </div>
                  )}
                </div>

              </div>

              {/* Action Bar for Revenue Recognition */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
                {k.isRevenueRecognized ? (
                  <div className="py-2 text-center text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-900/30 rounded-sm border border-blue-200 dark:border-blue-800">
                    ✓ Pendapatan Kloter Ini Telah Diakui
                  </div>
                ) : perm.canRecognizeRevenue ? (
                  <button
                    onClick={() => handleRecognizeRevenue(k.id)}
                    disabled={isRecognizing || totalCollected === 0}
                    className={`w-full py-2.5 px-3 rounded-sm text-xs font-bold text-white shadow-sm flex items-center justify-center space-x-1.5 transition-all ${
                      totalCollected === 0
                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>{isRecognizing ? 'Memproses Jurnal...' : 'Posting Pengakuan Pendapatan (Berangkat)'}</span>
                  </button>
                ) : (
                  <div className="py-2 px-3 bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] rounded-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-1 cursor-not-allowed" title="Pengakuan pendapatan hanya wewenang Senior Accountant">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Akui Pendapatan (Senior Accountant Only)</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Form Buat Kloter Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <PlaneTakeoff className="w-4 h-4 text-blue-400" />
                <span>Buat Rombongan Kloter Baru</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKloter} className="p-6 space-y-4 text-xs">
              {createErrorMsg && (
                <div className="p-3 bg-red-100 text-red-800 rounded-sm border border-red-200 font-medium">
                  {createErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Kloter *</label>
                  <input
                    type="text"
                    placeholder="e.g. KLOTER-2026-UMR-03"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Paket *</label>
                  <select
                    value={newPackageId}
                    onChange={(e) => setNewPackageId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-medium focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Pilih Jenis Paket Resmi --</option>
                    {packageList.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({PACKAGE_CATEGORY_LABELS[pkg.category] || pkg.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Kloter *</label>
                <input
                  type="text"
                  placeholder="e.g. Kloter Rombongan Syawal Beta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Keberangkatan *</label>
                  <input
                    type="date"
                    value={newDepartureDate}
                    onChange={(e) => setNewDepartureDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kuota Maksimal (Pax) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="40"
                    value={newTargetQuota}
                    onChange={(e) => setNewTargetQuota(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan / Keterangan (Opsional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rombongan Jamaah Wilayah Jawa Barat"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm transition-all"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kloter Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

