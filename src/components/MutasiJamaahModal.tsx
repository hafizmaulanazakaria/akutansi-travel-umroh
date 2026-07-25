import React, { useState, useEffect } from 'react';
import { JamaahRegistration, Jamaah, TravelPackage, DepartureKloter, RoomType } from '../types';
import { formatIDR } from '../utils/formatters';
import {
  ArrowRightLeft,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Bed,
  TrendingUp,
  TrendingDown,
  Info,
  Building2,
  Clock
} from 'lucide-react';

interface MutasiJamaahModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: JamaahRegistration;
  jamaah?: Jamaah;
  packages: TravelPackage[];
  kloters: DepartureKloter[];
  onSuccess: () => void;
}

export const MutasiJamaahModal: React.FC<MutasiJamaahModalProps> = ({
  isOpen,
  onClose,
  registration,
  jamaah,
  packages,
  kloters,
  onSuccess
}) => {
  const [newKloterId, setNewKloterId] = useState<string>(registration.kloterId);
  const [newPackageId, setNewPackageId] = useState<string>(registration.packageId);
  const [newRoomType, setNewRoomType] = useState<RoomType>(registration.roomType || 'QUAD');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Find old package and kloter
  const oldPkg = packages.find((p) => p.id === registration.packageId);
  const oldKlt = kloters.find((k) => k.id === registration.kloterId);

  // Active choices
  const activePackages = packages.filter((p) => p.isActive);
  const selectedNewPkg = packages.find((p) => p.id === newPackageId);

  // Auto-set package when kloter changes (if kloter is linked to a package)
  const handleKloterChange = (kloterId: string) => {
    setNewKloterId(kloterId);
    const klt = kloters.find((k) => k.id === kloterId);
    if (klt && klt.packageId) {
      setNewPackageId(klt.packageId);
    }
  };

  // Real-time calculation
  let newBasePrice = 0;
  if (selectedNewPkg) {
    if (newRoomType === 'TRIPLE') {
      newBasePrice = selectedNewPkg.priceTriple;
    } else if (newRoomType === 'DOUBLE') {
      newBasePrice = selectedNewPkg.priceDouble;
    } else {
      newBasePrice = selectedNewPkg.priceQuad;
    }
  }

  const oldTotalBill = registration.totalBill;
  const newTotalBill = Math.max(0, newBasePrice - (registration.discount || 0) + (registration.addOnPrice || 0));
  const priceDiff = newTotalBill - oldTotalBill;
  const totalPaid = registration.paidAmount;
  const newBalanceDue = newTotalBill - totalPaid;
  const isOverpaid = totalPaid > newTotalBill;
  const overpaidAmount = isOverpaid ? totalPaid - newTotalBill : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newKloterId || !newPackageId) {
      setErrorMsg('Mohon pilih Kloter dan Paket Baru.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Mohon isi alasan / keterangan mutasi paket & kloter.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/registrations/${registration.id}/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPackageId,
          newKloterId,
          newRoomType,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses mutasi.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Mutasi Paket & Kloter Jamaah</h3>
              <p className="text-[11px] text-slate-400">Proses perpindahan kloter, upgrade/downgrade paket, & kalkulasi selisih otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-sm border border-red-200 dark:border-red-800 font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Informasi Jamaah & Status Saat Ini (Read-Only) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-sm border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Jamaah</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{jamaah?.fullName || 'Jamaah'}</span>
                <span className="text-slate-500 text-[11px] ml-2 font-mono">({registration.registrationNumber})</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                STATUS: {registration.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paket Lama</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{oldPkg?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kloter Lama</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{oldKlt?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kamar Lama</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{registration.roomType} Room</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sudah Dibayar</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(registration.paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Form Perubahan (Selection Inputs) */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Form Perubahan Paket, Kloter, & Kamar Baru</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dropdown 1: Pilih Kloter Baru */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kloter Keberangkatan Baru *
                </label>
                <select
                  value={newKloterId}
                  onChange={(e) => handleKloterChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {kloters.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.code} - {k.name} ({k.departureDate}) [{k.filledQuota}/{k.targetQuota} pax]
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2: Pilih Paket Baru */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Master Paket Baru *
                </label>
                <select
                  value={newPackageId}
                  onChange={(e) => setNewPackageId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {activePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatIDR(p.priceQuad)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Radio Options: Tipe Kamar Baru */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Tipe Kamar Baru *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'QUAD' as RoomType, label: 'Quad (Sekamar 4)', price: selectedNewPkg?.priceQuad || 0 },
                  { type: 'TRIPLE' as RoomType, label: 'Triple (Sekamar 3)', price: selectedNewPkg?.priceTriple || 0 },
                  { type: 'DOUBLE' as RoomType, label: 'Double (Sekamar 2)', price: selectedNewPkg?.priceDouble || 0 }
                ].map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setNewRoomType(opt.type)}
                    className={`p-3 rounded-sm border text-left transition-all ${
                      newRoomType === opt.type
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-600 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{opt.label}</div>
                    <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      {formatIDR(opt.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field: Alasan Mutasi */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan / Alasan Mutasi Jamaah *
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Upgrade kamar double / Undur jadwal keberangkatan permintaan jamaah"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Section 3: Kalkulasi Otomatis Keuangan & Selisih (Real-time Calculation) */}
          <div className="bg-slate-900 text-white p-4 rounded-sm space-y-3 shadow-md border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs flex items-center space-x-1.5 text-blue-400">
                <Info className="w-4 h-4" />
                <span>Simulasi Real-time Kalkulasi Keuangan</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Otomatis Terkalkulasi</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Tagihan Lama</span>
                <span className="font-mono font-bold text-slate-300">{formatIDR(oldTotalBill)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Tagihan Baru</span>
                <span className="font-mono font-bold text-blue-400">{formatIDR(newTotalBill)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Selisih Tagihan</span>
                <span
                  className={`font-mono font-bold ${
                    priceDiff > 0 ? 'text-amber-400' : priceDiff < 0 ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {priceDiff > 0 ? `+${formatIDR(priceDiff)}` : priceDiff < 0 ? formatIDR(priceDiff) : 'Rp 0'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Sisa Piutang Baru</span>
                <span className="font-mono font-bold text-amber-400">
                  {newBalanceDue < 0 ? 'Rp 0 (Lunas)' : formatIDR(newBalanceDue)}
                </span>
              </div>
            </div>

            {/* Impact Banner Alert */}
            <div className="pt-2 border-t border-slate-800">
              {priceDiff > 0 && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-sm text-amber-300 text-[11px] font-semibold flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    UPGRADE PAKET: Sisa Piutang Jamaah bertambah sebesar <strong>{formatIDR(priceDiff)}</strong>.
                  </span>
                </div>
              )}

              {priceDiff < 0 && !isOverpaid && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-sm text-emerald-300 text-[11px] font-semibold flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    DOWNGRADE PAKET: Sisa Piutang Jamaah berkurang sebesar <strong>{formatIDR(Math.abs(priceDiff))}</strong>.
                  </span>
                </div>
              )}

              {isOverpaid && (
                <div className="p-2.5 bg-purple-950/60 border border-purple-800/80 rounded-sm text-purple-200 text-[11px] font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    KELEBIHAN BAYAR (DEPOSIT / REFUND): Jamaah memiliki saldo lebih sebesar <strong>{formatIDR(overpaidAmount)}</strong>.
                  </span>
                </div>
              )}

              {priceDiff === 0 && (
                <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-sm text-slate-300 text-[11px] font-semibold flex items-center space-x-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>PERPINDAHAN KLOTER SAJA: Total nominal tagihan jamaah tetap sama.</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-sm text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-sm text-xs shadow-sm transition-all flex items-center space-x-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses Mutasi...' : 'Konfirmasi & Proses Mutasi'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
