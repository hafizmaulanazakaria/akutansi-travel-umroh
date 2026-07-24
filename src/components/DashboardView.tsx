import React from 'react';
import { ChartOfAccount, JamaahRegistration, DepartureKloter, JournalEntry, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
import {
  Wallet,
  Clock,
  UserX,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  PlaneTakeoff,
  Receipt,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface DashboardViewProps {
  coaList: ChartOfAccount[];
  registrations: JamaahRegistration[];
  kloters: DepartureKloter[];
  journals: JournalEntry[];
  userRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onOpenNewPayment: () => void;
  onOpenNewRegistration: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  coaList,
  registrations,
  kloters,
  journals,
  userRole,
  onNavigateTab,
  onOpenNewPayment,
  onOpenNewRegistration
}) => {
  const perm = getRolePermissions(userRole);

  // Calculate Key Metrics
  // 1. Total Liquid Cash & Bank
  const cashAccounts = coaList.filter(a => a.category === 'ASSET' && ['1101', '1102', '1103', '1104'].includes(a.code));
  const totalCashBank = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

  // 2. Unearned Revenue (Liabilitas Pendapatan Diterima di Muka)
  const unearnedCoa = coaList.filter(a => a.code === '2101' || a.code === '2102');
  const totalUnearnedRevenue = unearnedCoa.reduce((sum, a) => sum + a.balance, 0);

  // 3. Total Piutang Jamaah
  const totalReceivables = registrations.reduce((sum, r) => sum + r.balanceDue, 0);

  // 4. Recognized Revenue
  const revenueCoa = coaList.filter(a => a.category === 'REVENUE');
  const totalRecognizedRevenue = revenueCoa.reduce((sum, a) => sum + a.balance, 0);

  // Chart Data: Revenue Recognition vs Unearned per Kloter
  const kloterChartData = kloters.map(k => {
    const regInK = registrations.filter(r => r.kloterId === k.id);
    const totalCollected = regInK.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalDue = regInK.reduce((sum, r) => sum + r.balanceDue, 0);
    return {
      name: k.code,
      'Kas Diterima (Unearned/Revenue)': totalCollected,
      'Sisa Piutang Jamaah': totalDue
    };
  });

  // Pie Chart Data for COA Asset Distribution
  const pieColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
  const assetPieData = cashAccounts.map(a => ({
    name: a.name,
    value: a.balance
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert for PSAK Unearned Revenue Accounting Principle */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-sm p-5 shadow-sm text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-600 text-white rounded-sm shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Sistem Akuntansi Berpasangan (Double-Entry) Travel Umrah</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border border-emerald-500/40">
                PSAK Compliant
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Seluruh pembayaran DP & cicilan jamaah masuk ke akun <strong className="text-emerald-400 font-mono">2101 - Unearned Revenue (Liabilitas)</strong>. Pendapatan baru diakui secara otomatis saat Kloter dinyatakan berangkat.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {perm.canRegisterJamaah && (
            <button
              onClick={onOpenNewRegistration}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Daftar Jamaah</span>
            </button>
          )}

          {perm.canReceivePayment ? (
            <button
              onClick={onOpenNewPayment}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>+ Terima Pembayaran</span>
            </button>
          ) : userRole === 'ADMIN_CS' ? (
            <div className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 text-slate-400 text-[11px] rounded-sm cursor-not-allowed flex items-center space-x-1" title="Akses Kasir & Keuangan Only">
              <span>Kasir: Terima Uang</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Kas & Bank */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Likuiditas Kas & Bank</span>
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-sm">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">{formatIDR(totalCashBank)}</div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                BSI, Mandiri & Kas Operasional
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
            {cashAccounts.length} Rekening Aktif
          </div>
        </div>

        {/* Card 2: Unearned Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unearned Revenue (Liabilitas)</span>
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-sm">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">{formatIDR(totalUnearnedRevenue)}</div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                DP & Cicilan Jamaah Belum Berangkat
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
            Akun Liabilitas #2101
          </div>
        </div>

        {/* Card 3: Total Piutang Jamaah */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Piutang Tagihan Jamaah</span>
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-sm">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 tracking-tight">{formatIDR(totalReceivables)}</div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-1">
                Sisa Cicilan yang Belum Dilunasi
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Jatuh tempo terdekat: 15 Hari
          </div>
        </div>

        {/* Card 4: Recognized Revenue - Hero Card (Blue) */}
        <div className="bg-blue-600 text-white rounded-sm p-4 border border-blue-700 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Pendapatan Diakui (Realized)</span>
              <div className="p-1.5 bg-blue-500/40 text-white rounded-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-mono font-bold text-white tracking-tight">{formatIDR(totalRecognizedRevenue)}</div>
              <p className="text-[11px] text-blue-100 font-medium mt-1">
                Pendapatan dari Kloter Berangkat
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-500/60 text-[10px] text-blue-100 font-mono flex items-center justify-between">
            <span>Status: Recognized</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Visual Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Revenue vs Receivables per Kloter */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Arus Kas & Piutang Per Kloter Keberangkatan</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Perbandingan dana terkumpul vs sisa piutang jamaah per rombongan</p>
            </div>
            <button
              onClick={() => onNavigateTab('kloter')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
            >
              <span>Kelola Kloter</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kloterChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number) => [formatIDR(value), 'Nominal']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Kas Diterima (Unearned/Revenue)" fill="#2563eb" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Sisa Piutang Jamaah" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cash Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Alokasi Rekening Kas & Bank</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sebaran likuiditas pada rekening penampungan IDR & USD</p>
          </div>

          <div className="h-44 w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => formatIDR(val)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {cashAccounts.map((a, idx) => (
              <div key={a.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                  <span className="font-medium truncate max-w-[140px] text-xs">{a.name}</span>
                </div>
                <span className="font-mono font-bold text-xs">{formatIDR(a.balance)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Auto Journal Entries Log */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Log Transaksi & Jurnal Otomatis Terakhir</span>
            </h3>
            <p className="text-[11px] text-slate-500">Pencatatan real-time debit kredit berpasangan pada buku besar</p>
          </div>
          <button
            onClick={() => onNavigateTab('journals')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
          >
            <span>Lihat Seluruh Jurnal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-4">No. Jurnal</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Keterangan Transaksi</th>
                <th className="py-2.5 px-4">Tipe Referensi</th>
                <th className="py-2.5 px-4 text-right">Debit / Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {journals.slice(0, 5).map((jv) => (
                <tr key={jv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{jv.journalNumber}</td>
                  <td className="py-2.5 px-4 text-slate-500">{jv.transactionDate}</td>
                  <td className="py-2.5 px-4 font-medium max-w-md truncate">{jv.description}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {jv.referenceType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(jv.totalDebit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
