import React, { useState } from 'react';
import { TravelPackage, PackageCategory, PACKAGE_CATEGORY_LABELS, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
import {
  Boxes,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Tag,
  Building2,
  Plane,
  Calendar
} from 'lucide-react';

interface PackagesViewProps {
  packageList: TravelPackage[];
  userRole?: UserRole;
  onRefreshData: () => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packageList,
  userRole = 'ACCOUNTANT',
  onRefreshData
}) => {
  const perm = getRolePermissions(userRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<PackageCategory>('UMRAH_REGULER_9D');
  const [priceQuad, setPriceQuad] = useState<string>('28500000');
  const [tripleUpgrade, setTripleUpgrade] = useState<string>('2000000');
  const [doubleUpgrade, setDoubleUpgrade] = useState<string>('4000000');
  const [durationDays, setDurationDays] = useState<string>('9');
  const [hotelMakkah, setHotelMakkah] = useState('');
  const [hotelMadinah, setHotelMadinah] = useState('');
  const [airline, setAirline] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filter packages
  const filteredPackages = packageList.filter(pkg => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.hotelMakkah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.airline.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || pkg.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && pkg.isActive) ||
      (statusFilter === 'INACTIVE' && !pkg.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingPackage(null);
    setName('');
    setCode(`PKG-${new Date().getFullYear()}-${String(packageList.length + 1).padStart(2, '0')}`);
    setCategory('UMRAH_REGULER_9D');
    setPriceQuad('28500000');
    setTripleUpgrade('2000000');
    setDoubleUpgrade('4000000');
    setDurationDays('9');
    setHotelMakkah('');
    setHotelMadinah('');
    setAirline('');
    setDescription('');
    setIsActive(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: TravelPackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setCode(pkg.code);
    setCategory(pkg.category);
    setPriceQuad(pkg.priceQuad.toString());
    const tUpgrade = Math.max(0, pkg.priceTriple - pkg.priceQuad);
    const dUpgrade = Math.max(0, pkg.priceDouble - pkg.priceQuad);
    setTripleUpgrade(tUpgrade.toString());
    setDoubleUpgrade(dUpgrade.toString());
    setDurationDays(pkg.durationDays.toString());
    setHotelMakkah(pkg.hotelMakkah);
    setHotelMadinah(pkg.hotelMadinah);
    setAirline(pkg.airline);
    setDescription(pkg.description);
    setIsActive(pkg.isActive);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (pkg: TravelPackage) => {
    if (perm.isReadOnly || !perm.canManagePackages) return;

    try {
      const res = await fetch(`/api/packages/${pkg.id}/toggle`, {
        method: 'PATCH'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengubah status paket.');
      }
      setSuccessMessage(`Status paket "${pkg.name}" berhasil diperbarui.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleDeletePackage = async (pkg: TravelPackage) => {
    if (perm.isReadOnly || !perm.canManagePackages) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus paket "${pkg.name}"?`)) return;

    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus paket.');
      }
      setSuccessMessage(`Paket "${pkg.name}" berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama Paket wajib diisi.');
      return;
    }

    const pQuad = Number(priceQuad) || 0;
    const tUpgrade = Number(tripleUpgrade) || 0;
    const dUpgrade = Number(doubleUpgrade) || 0;

    const priceTriple = pQuad + tUpgrade;
    const priceDouble = pQuad + dUpgrade;

    try {
      setIsSubmitting(true);
      const url = editingPackage ? `/api/packages/${editingPackage.id}` : '/api/packages';
      const method = editingPackage ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          category,
          priceQuad: pQuad,
          priceTriple,
          priceDouble,
          durationDays: Number(durationDays) || 9,
          hotelMakkah,
          hotelMadinah,
          airline,
          description,
          isActive
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data paket.');
      }

      setSuccessMessage(
        editingPackage ? `Paket "${name}" berhasil diperbarui.` : `Paket baru "${name}" berhasil ditambahkan!`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Master Data Paket & Harga Umrah / Haji
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola katalog paket umrah & haji, harga dasar (Quad), biaya tambahan upgrade kamar (Triple/Double), serta status keaktifan paket secara real-time.
          </p>
        </div>

        {perm.canManagePackages && !perm.isReadOnly ? (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Paket Baru</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-xs rounded-sm flex items-center space-x-1 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Mode Lihat Paket</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-sm border border-emerald-200 dark:border-emerald-800 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama paket, hotel, maskapai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs outline-none"
          >
            <option value="ALL">Semua Jenis Paket</option>
            {Object.entries(PACKAGE_CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Saja</option>
            <option value="INACTIVE">Non-Aktif Saja</option>
          </select>
        </div>
      </div>

      {/* Master Packages Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0F172A] text-slate-200 border-b border-slate-800">
                <th className="p-3.5 font-bold uppercase tracking-wider">Kode & Nama Paket</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Jenis Paket</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-right">Harga Dasar (Quad)</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-right">Biaya Upgrade Triple</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-right">Biaya Upgrade Double</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-center">Status</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ada data paket umrah/haji yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const tripleUpgrade = Math.max(0, pkg.priceTriple - pkg.priceQuad);
                  const doubleUpgrade = Math.max(0, pkg.priceDouble - pkg.priceQuad);

                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !pkg.isActive ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-75' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-bold text-[11px] rounded border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                            {pkg.code}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{pkg.name}</span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{pkg.durationDays} Hari</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3" />
                            <span>{pkg.hotelMakkah}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Plane className="w-3 h-3" />
                            <span>{pkg.airline}</span>
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-[11px] rounded border border-blue-200 dark:border-blue-800">
                          {PACKAGE_CATEGORY_LABELS[pkg.category] || pkg.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatIDR(pkg.priceQuad)}
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="text-amber-700 dark:text-amber-400 font-medium">
                          + {formatIDR(tripleUpgrade)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          (Total: {formatIDR(pkg.priceTriple)})
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="text-purple-700 dark:text-purple-400 font-medium">
                          + {formatIDR(doubleUpgrade)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          (Total: {formatIDR(pkg.priceDouble)})
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {pkg.isActive ? (
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

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {perm.canManagePackages && !perm.isReadOnly ? (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(pkg)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Edit Paket"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleToggleStatus(pkg)}
                                className={`p-1.5 rounded transition-colors ${
                                  pkg.isActive
                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                }`}
                                title={pkg.isActive ? 'Non-aktifkan Paket' : 'Aktifkan Paket'}
                              >
                                {pkg.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleDeletePackage(pkg)}
                                className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Hapus Paket"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL FORM: TAMBAH / EDIT PAKET --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingPackage ? 'Edit Master Paket & Harga' : '+ Tambah Paket Umrah / Haji Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-sm border border-red-200 dark:border-red-800 font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Paket */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Paket Umrah/Haji *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Umroh Reguler 9 Hari Syawal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                {/* Kode Paket & Jenis Paket */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Paket *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PKG-UMR-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Paket *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PackageCategory)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    required
                  >
                    {Object.entries(PACKAGE_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                      <option key={catKey} value={catKey}>
                        {catLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                  Struktur Harga & Upgrade Kamar Hotel (IDR)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Harga Dasar / Quad (IDR) *
                    </label>
                    <input
                      type="number"
                      placeholder="28500000"
                      value={priceQuad}
                      onChange={(e) => setPriceQuad(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-blue-600 dark:text-blue-400 outline-none"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Quad = 4 pax/kamar</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tambahan Kamar Triple (IDR)
                    </label>
                    <input
                      type="number"
                      placeholder="2000000"
                      value={tripleUpgrade}
                      onChange={(e) => setTripleUpgrade(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-amber-600 dark:text-amber-400 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Total: {formatIDR((Number(priceQuad) || 0) + (Number(tripleUpgrade) || 0))}
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tambahan Kamar Double (IDR)
                    </label>
                    <input
                      type="number"
                      placeholder="4000000"
                      value={doubleUpgrade}
                      onChange={(e) => setDoubleUpgrade(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-purple-600 dark:text-purple-400 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Total: {formatIDR((Number(priceQuad) || 0) + (Number(doubleUpgrade) || 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maskapai / Airline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saudi Arabian Airlines"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Makkah
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anjum Hotel Makkah (5★)"
                    value={hotelMakkah}
                    onChange={(e) => setHotelMakkah(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Madinah
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Plaza Madinah (4★)"
                    value={hotelMadinah}
                    onChange={(e) => setHotelMadinah(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                  />
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/80 rounded-sm border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Status Keaktifan Paket</p>
                  <p className="text-[11px] text-slate-500">
                    Paket yang AKTIF akan otomatis muncul di form Pendaftaran Jamaah Baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isActive ? '✓ AKTIF' : 'NON-AKTIF'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Simpan Data Paket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
