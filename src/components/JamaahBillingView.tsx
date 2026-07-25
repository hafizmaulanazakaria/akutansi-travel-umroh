import React, { useState } from 'react';
import { JamaahRegistration, Jamaah, TravelPackage, DepartureKloter, ChartOfAccount, PaymentSchedule, JamaahPaymentTransaction, UserRole, PACKAGE_CATEGORY_LABELS, Mitra } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR, formatDateIndo } from '../utils/formatters';
import {
  Users,
  Search,
  PlusCircle,
  Receipt,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
  Printer,
  X,
  CreditCard,
  Building,
  UserCheck,
  Lock,
  ArrowRightLeft,
  History
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { MutasiJamaahModal } from './MutasiJamaahModal';

interface JamaahBillingViewProps {
  registrations: JamaahRegistration[];
  jamaahList: Jamaah[];
  packageList: TravelPackage[];
  kloterList: DepartureKloter[];
  coaList: ChartOfAccount[];
  mitraList?: Mitra[];
  userRole?: UserRole;
  onRefreshData: () => void;
  isNewPaymentOpen: boolean;
  setIsNewPaymentOpen: (open: boolean) => void;
  isNewRegistrationOpen: boolean;
  setIsNewRegistrationOpen: (open: boolean) => void;
}

export const JamaahBillingView: React.FC<JamaahBillingViewProps> = ({
  registrations,
  jamaahList,
  packageList,
  kloterList,
  coaList,
  mitraList = [],
  userRole = 'ACCOUNTANT',
  onRefreshData,
  isNewPaymentOpen,
  setIsNewPaymentOpen,
  isNewRegistrationOpen,
  setIsNewRegistrationOpen
}) => {
  const perm = getRolePermissions(userRole);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReg, setSelectedReg] = useState<JamaahRegistration | null>(null);

  // Mutation Modal state
  const [isMutationOpen, setIsMutationOpen] = useState<boolean>(false);

  // Active Printable Receipt State
  const [printedPayment, setPrintedPayment] = useState<JamaahPaymentTransaction | null>(null);

  // Form States for Payment Entry
  const [paymentRegId, setPaymentRegId] = useState<string>('');
  const [paymentInstallmentId, setPaymentInstallmentId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentBankId, setPaymentBankId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD'>('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');

  // Form States for New Registration
  const [regJamaahType, setRegJamaahType] = useState<'NEW' | 'EXISTING'>('NEW');
  const [selectedJamaahId, setSelectedJamaahId] = useState<string>('');
  const [newNik, setNewNik] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedKloterId, setSelectedKloterId] = useState<string>('');
  const [selectedMitraId, setSelectedMitraId] = useState<string>('');
  const [roomType, setRoomType] = useState<'QUAD' | 'TRIPLE' | 'DOUBLE'>('QUAD');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [addOnAmount, setAddOnAmount] = useState<string>('0');
  const [regNotes, setRegNotes] = useState<string>('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState<string>('');

  // Filter Active Packages for Registration
  const activePackageList = packageList.filter(p => p.isActive);
  const selectedPackageObj = packageList.find(p => p.id === selectedPackageId);

  // Dynamic price calculations for registration
  let selectedBasePrice = 0;
  let roomUpgradeFee = 0;
  if (selectedPackageObj) {
    if (roomType === 'QUAD') {
      selectedBasePrice = selectedPackageObj.priceQuad;
      roomUpgradeFee = 0;
    } else if (roomType === 'TRIPLE') {
      selectedBasePrice = selectedPackageObj.priceTriple;
      roomUpgradeFee = Math.max(0, selectedPackageObj.priceTriple - selectedPackageObj.priceQuad);
    } else if (roomType === 'DOUBLE') {
      selectedBasePrice = selectedPackageObj.priceDouble;
      roomUpgradeFee = Math.max(0, selectedPackageObj.priceDouble - selectedPackageObj.priceQuad);
    }
  }

  const discountVal = Number(discountAmount) || 0;
  const addOnVal = Number(addOnAmount) || 0;
  const calculatedTotalBill = Math.max(0, selectedBasePrice - discountVal + addOnVal);

  // Bank Accounts Options
  const bankAccounts = coaList.filter(a => a.category === 'ASSET' && ['1101', '1102', '1103', '1104'].includes(a.code));

  // Filtered Registrations
  const filteredRegs = registrations.filter(reg => {
    const jam = jamaahList.find(j => j.id === reg.jamaahId);
    const matchesSearch =
      reg.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jam && jam.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (jam && jam.nik.includes(searchTerm));
    const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle Payment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!paymentRegId || !paymentAmount || !paymentBankId) {
      setPaymentError('Mohon lengkapi Pendaftaran Jamaah, Nominal, dan Rekening Bank.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: paymentRegId,
          installmentId: paymentInstallmentId || undefined,
          amount: Number(paymentAmount),
          paymentMethod,
          bankAccountId: paymentBankId,
          paymentDate,
          notes: paymentNotes || 'Pembayaran Cicilan Paket Umrah',
          createdBy: 'Kasir Finance'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan transaksi pembayaran.');
      }

      onRefreshData();
      setIsNewPaymentOpen(false);

      // Reset form
      setPaymentAmount('');
      setPaymentNotes('');

      // Trigger Receipt Modal directly
      setPrintedPayment(data.payment);
    } catch (err: any) {
      setPaymentError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle Registration Submit
  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!selectedPackageId || !selectedKloterId) {
      setRegError('Mohon pilih Paket Umrah/Haji dan Kloter Keberangkatan.');
      return;
    }

    try {
      setIsSubmittingReg(true);

      let finalJamaahId = selectedJamaahId;

      // 1. If NEW Jamaah, create Jamaah first
      if (regJamaahType === 'NEW') {
        if (!newFullName || !newNik) {
          throw new Error('Nama Lengkap dan NIK Jamaah wajib diisi.');
        }
        const jamRes = await fetch('/api/jamaah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nik: newNik,
            fullName: newFullName,
            phone: newPhone,
            gender: newGender,
            address: 'Alamat Jamaah'
          })
        });
        const jamData = await jamRes.json();
        if (!jamRes.ok) throw new Error(jamData.error || 'Gagal menyimpan data jamaah.');
        finalJamaahId = jamData.id;
      }

      // 2. Create Registration
      const regRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jamaahId: finalJamaahId,
          packageId: selectedPackageId,
          kloterId: selectedKloterId,
          mitraId: selectedMitraId || undefined,
          roomType,
          discount: Number(discountAmount),
          addOnPrice: Number(addOnAmount),
          notes: regNotes
        })
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Gagal menyimpan pendaftaran.');

      onRefreshData();
      setIsNewRegistrationOpen(false);

      // Reset form
      setNewFullName('');
      setNewNik('');
      setNewPhone('');
      setSelectedMitraId('');
    } catch (err: any) {
      setRegError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Manajemen Tagihan & Piutang Jamaah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pendaftaran paket, skema cicilan 5x, pembayaran bertahap, & pencatatan liabilitas otomatis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Nama Jamaah / NIK / No. Reg..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none w-60"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PARTIAL">Belum Lunas (Dicicil)</option>
            <option value="PAID_OFF">Lunas</option>
            <option value="DEPARTED">Sudah Berangkat</option>
          </select>

          {/* Action Buttons */}
          {perm.canRegisterJamaah && (
            <button
              onClick={() => setIsNewRegistrationOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Pendaftaran Baru</span>
            </button>
          )}

          {perm.canReceivePayment ? (
            <button
              onClick={() => setIsNewPaymentOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>+ Input Pembayaran</span>
            </button>
          ) : userRole === 'ADMIN_CS' ? (
            <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs rounded-sm flex items-center space-x-1 cursor-not-allowed" title="Admin CS tidak berwenang menerima uang tunai">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Penerimaan Uang (Kasir Only)</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Registrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Column (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Daftar Tagihan & Status Pembayaran Jamaah ({filteredRegs.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRegs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data tagihan jamaah yang sesuai kriteria pencarian.
              </div>
            ) : (
              filteredRegs.map((reg) => {
                const jam = jamaahList.find(j => j.id === reg.jamaahId);
                const pkg = packageList.find(p => p.id === reg.packageId);
                const klt = kloterList.find(k => k.id === reg.kloterId);
                const isSelected = selectedReg?.id === reg.id;

                const percentPaid = Math.round((reg.paidAmount / reg.totalBill) * 100);

                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedReg(reg)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      isSelected ? 'bg-blue-50/80 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {jam ? jam.fullName : 'Jamaah'}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-sm border border-slate-300 dark:border-slate-700">
                            {reg.registrationNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {pkg?.name} — <strong className="text-slate-700 dark:text-slate-300">{klt?.name}</strong>
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                          reg.status === 'PAID_OFF'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : reg.status === 'DEPARTED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {reg.status === 'PAID_OFF' ? 'LUNAS' : reg.status === 'DEPARTED' ? 'BERANGKAT' : 'DICICIL'}
                      </span>
                    </div>

                    {/* Progress Bar & Amount Row */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Tagihan</div>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatIDR(reg.totalBill)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Diterima (Liabilitas)</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(reg.paidAmount)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Sisa Piutang</div>
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatIDR(reg.balanceDue)}</div>
                      </div>
                    </div>

                    {/* Progress Percentage Visual */}
                    <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-sm overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-sm transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Registration Detail Drawer (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
          {selectedReg ? (
            (() => {
              const jam = jamaahList.find(j => j.id === selectedReg.jamaahId);
              const pkg = packageList.find(p => p.id === selectedReg.packageId);
              const klt = kloterList.find(k => k.id === selectedReg.kloterId);
              const schedules = selectedReg.schedules || [];
              const payments = selectedReg.payments || [];

              return (
                <div className="space-y-5">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      Kartu Piutang & Histori Pembayaran
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {jam?.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">NIK: {jam?.nik} | WA: {jam?.phone}</p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-sm border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Program Paket:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pkg?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Kloter Keberangkatan:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{klt?.name} ({klt?.departureDate})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Tipe Kamar:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReg.roomType} Room</span>
                    </div>
                  </div>

                  {/* Installments Schedule Section */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Jadwal Cicilan (Schedule)
                    </h4>
                    <div className="space-y-2">
                      {schedules.map((sch) => (
                        <div
                          key={sch.id}
                          className={`p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm flex items-center justify-between text-xs ${
                            sch.status === 'PAID' ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-orange-500'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{sch.title}</div>
                            <div className="text-[10px] text-slate-400">Jatuh Tempo: {sch.dueDate}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatIDR(sch.amount)}</div>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                                sch.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                              }`}
                            >
                              {sch.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment History & Kuitansi Printer */}
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Histori Pembayaran Diterima ({payments.length})
                    </h4>
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{p.receiptNumber}</div>
                            <div className="text-[10px] text-slate-400">{p.paymentDate} via {p.paymentMethod}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatIDR(p.amount)}</span>
                            <button
                              onClick={() => setPrintedPayment(p)}
                              className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-sm text-slate-700 dark:text-slate-200"
                              title="Cetak Kuitansi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes & Histori Mutasi */}
                  {selectedReg.notes && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                        <History className="w-3.5 h-3.5 text-amber-500" />
                        <span>Histori Mutasi & Catatan</span>
                      </h4>
                      <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-sm text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {selectedReg.notes}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setPaymentRegId(selectedReg.id);
                        setIsNewPaymentOpen(true);
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>+ Catat Pembayaran Baru</span>
                    </button>

                    {!perm.isReadOnly && (
                      <button
                        onClick={() => setIsMutationOpen(true)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Pindah Paket / Kloter (Mutasi)</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p>Pilih salah satu Jamaah dari daftar di sebelah kiri untuk melihat kartu piutang & jadwal cicilan.</p>
            </div>
          )}
        </div>

      </div>

      {/* --- MODAL 1: INPUT PEMBAYARAN CICILAN (AUTOMATIC DOUBLE-ENTRY) --- */}
      {isNewPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Input Pembayaran Jamaah (Kuitansi & Jurnal)</h3>
              </div>
              <button onClick={() => setIsNewPaymentOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xs">
              {paymentError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-sm border border-red-200 dark:border-red-800 font-medium">
                  {paymentError}
                </div>
              )}

              {/* Select Registration */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Tagihan Jamaah *
                </label>
                <select
                  value={paymentRegId}
                  onChange={(e) => {
                    setPaymentRegId(e.target.value);
                    const selectedR = registrations.find(r => r.id === e.target.value);
                    if (selectedR && selectedR.schedules) {
                      const pendingSch = selectedR.schedules.find(s => s.status !== 'PAID');
                      if (pendingSch) {
                        setPaymentInstallmentId(pendingSch.id);
                        setPaymentAmount(pendingSch.amount.toString());
                      }
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Pilih Jamaah --</option>
                  {registrations.map((r) => {
                    const jam = jamaahList.find(j => j.id === r.jamaahId);
                    return (
                      <option key={r.id} value={r.id}>
                        {jam?.fullName} — {r.registrationNumber} (Sisa: {formatIDR(r.balanceDue)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Nominal Pembayaran */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Diterima (IDR) *
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 5000000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-sm font-mono font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rekening Masuk Kas/Bank *
                </label>
                <select
                  value={paymentBankId}
                  onChange={(e) => setPaymentBankId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  required
                >
                  <option value="">-- Pilih Rekening --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name} (Saldo: {formatIDR(b.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Metode Bayar</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="BANK_TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai (Kas Kantor)</option>
                    <option value="CREDIT_CARD">Kartu Kredit/Debit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Kuitansi</label>
                <input
                  type="text"
                  placeholder="e.g. DP Booking Fee Umrah Syawal Alpha"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingPayment ? 'Posting Jurnal...' : 'Simpan & Posting Jurnal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PENDAFTARAN JAMAAH BARU --- */}
      {isNewRegistrationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Form Pendaftaran Jamaah & Paket Umrah</h3>
              </div>
              <button onClick={() => setIsNewRegistrationOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegSubmit} className="p-6 space-y-4 text-xs">
              {regError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-sm border border-red-200 dark:border-red-800 font-medium">
                  {regError}
                </div>
              )}

              {/* Jamaah Selector Type */}
              <div className="flex items-center space-x-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-sm">
                <button
                  type="button"
                  onClick={() => setRegJamaahType('NEW')}
                  className={`flex-1 py-1.5 font-bold rounded-sm transition-all ${
                    regJamaahType === 'NEW' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  + Jamaah Baru
                </button>
                <button
                  type="button"
                  onClick={() => setRegJamaahType('EXISTING')}
                  className={`flex-1 py-1.5 font-bold rounded-sm transition-all ${
                    regJamaahType === 'EXISTING' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pilih Jamaah Lama
                </button>
              </div>

              {regJamaahType === 'NEW' ? (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-sm border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      placeholder="e.g. H. Muhammad Ridwan"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NIK KTP *</label>
                      <input
                        type="text"
                        placeholder="327301..."
                        value={newNik}
                        onChange={(e) => setNewNik(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp</label>
                      <input
                        type="text"
                        placeholder="0812..."
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Jamaah *</label>
                  <select
                    value={selectedJamaahId}
                    onChange={(e) => setSelectedJamaahId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none"
                    required
                  >
                    <option value="">-- Pilih Master Jamaah --</option>
                    {jamaahList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.fullName} — {j.nik}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Package & Kloter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paket *</label>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-medium"
                    required
                  >
                    <option value="">-- Pilih Paket (Aktif) --</option>
                    {activePackageList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatIDR(p.priceQuad)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kloter *</label>
                  <select
                    value={selectedKloterId}
                    onChange={(e) => setSelectedKloterId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-medium"
                    required
                  >
                    <option value="">-- Pilih Kloter --</option>
                    {kloterList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.departureDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mitra / Referral (Opsional) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mitra / Referral / Agen (Opsional)
                </label>
                <select
                  value={selectedMitraId}
                  onChange={(e) => setSelectedMitraId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Pendaftaran Langsung (Tanpa Mitra) --</option>
                  {mitraList.filter(m => m.isActive).map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} — Fee: {formatIDR(m.defaultFeePerPax)}/pax
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Jika mitra dipilih, komisi referral akan otomatis tercatat di modul "Manajemen Mitra & Komisi".
                </span>
              </div>

              {/* Room Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Kamar Hotel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['QUAD', 'TRIPLE', 'DOUBLE'] as const).map((room) => {
                    let priceForRoom = 0;
                    if (selectedPackageObj) {
                      if (room === 'QUAD') priceForRoom = selectedPackageObj.priceQuad;
                      if (room === 'TRIPLE') priceForRoom = selectedPackageObj.priceTriple;
                      if (room === 'DOUBLE') priceForRoom = selectedPackageObj.priceDouble;
                    }
                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => setRoomType(room)}
                        className={`py-2 px-1 rounded-sm border text-center transition-all ${
                          roomType === room
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 font-bold'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        <div className="text-xs">{room}</div>
                        {selectedPackageObj ? (
                          <div className="text-[10px] font-mono mt-0.5 opacity-90">
                            {formatIDR(priceForRoom)}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount & Addon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Diskon / Penyesuaian Harga (IDR)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000000"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Add-On (IDR)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500000"
                    value={addOnAmount}
                    onChange={(e) => setAddOnAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm outline-none font-mono font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Summary Card */}
              {selectedPackageObj && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm space-y-1 text-xs">
                  <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
                    <span>Harga Dasar Paket ({selectedPackageObj.name} - {roomType}):</span>
                    <span className="font-mono font-bold">{formatIDR(selectedBasePrice)}</span>
                  </div>
                  {roomUpgradeFee > 0 && (
                    <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                      <span>• Biaya Upgrade Kamar ({roomType}):</span>
                      <span className="font-mono">+ {formatIDR(roomUpgradeFee)}</span>
                    </div>
                  )}
                  {discountVal > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[11px]">
                      <span>• Diskon / Penyesuaian Harga:</span>
                      <span className="font-mono">- {formatIDR(discountVal)}</span>
                    </div>
                  )}
                  {addOnVal > 0 && (
                    <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-[11px]">
                      <span>• Add-On (Perlengkapan/Handling):</span>
                      <span className="font-mono">+ {formatIDR(addOnVal)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 text-sm">
                    <span>Total Tagihan Akhir Jamaah:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{formatIDR(calculatedTotalBill)}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewRegistrationOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-sm shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingReg ? 'Memproses...' : 'Daftarkan Jamaah'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printedPayment && (
        <ReceiptModal
          payment={printedPayment}
          registration={registrations.find(r => r.id === printedPayment.registrationId)}
          jamaah={jamaahList.find(j => j.id === registrations.find(r => r.id === printedPayment.registrationId)?.jamaahId)}
          pkg={packageList.find(p => p.id === registrations.find(r => r.id === printedPayment.registrationId)?.packageId)}
          kloter={kloterList.find(k => k.id === registrations.find(r => r.id === printedPayment.registrationId)?.kloterId)}
          bankCoa={bankAccounts.find(b => b.id === printedPayment.bankAccountId)}
          onClose={() => setPrintedPayment(null)}
        />
      )}

      {/* Mutasi Paket & Kloter Modal */}
      {isMutationOpen && selectedReg && (
        <MutasiJamaahModal
          isOpen={isMutationOpen}
          onClose={() => setIsMutationOpen(false)}
          registration={selectedReg}
          jamaah={jamaahList.find(j => j.id === selectedReg.jamaahId)}
          packages={packageList}
          kloters={kloterList}
          onSuccess={() => {
            onRefreshData();
            setIsMutationOpen(false);
          }}
        />
      )}

    </div>
  );
};
