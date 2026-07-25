import React, { useState, useEffect } from 'react';
import { KloterProfitabilityReport, ChartOfAccount, TravelPackage, DepartureKloter, PACKAGE_CATEGORY_LABELS, UserRole, JournalEntry } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
import { ProfitLossView } from './ProfitLossView';
import { BalanceSheetView } from './BalanceSheetView';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Filter,
  Scale,
  Receipt
} from 'lucide-react';

interface FinancialReportsViewProps {
  coaList: ChartOfAccount[];
  packageList?: TravelPackage[];
  kloters?: DepartureKloter[];
  journals?: JournalEntry[];
  userRole?: UserRole;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  coaList,
  packageList = [],
  kloters = [],
  journals = [],
  userRole = 'ACCOUNTANT'
}) => {
  const perm = getRolePermissions(userRole);
  const [activeSubTab, setActiveSubTab] = useState<'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'KLOTER_PROFIT'>('INCOME_STATEMENT');
  const [profitReports, setProfitReports] = useState<KloterProfitabilityReport[]>([]);
  const [receivablesReport, setReceivablesReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [profRes, recRes] = await Promise.all([
        fetch('/api/reports/profitability'),
        fetch('/api/reports/receivables')
      ]);

      let profData = [];
      let recData = [];

      if (profRes.ok) {
        profData = await profRes.json();
      } else {
        console.error('Failed to load profitability report:', profRes.statusText);
      }

      if (recRes.ok) {
        recData = await recRes.json();
      } else {
        console.error('Failed to load receivables report:', recRes.statusText);
      }

      setProfitReports(Array.isArray(profData) ? profData : []);
      setReceivablesReport(Array.isArray(recData) ? recData : []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter profit reports by selected package category
  const filteredProfitReports = profitReports.filter((rep) => {
    if (selectedCategoryFilter === 'ALL') return true;

    if (rep.packageCategory === selectedCategoryFilter) return true;

    const klt = kloters.find(k => k.id === rep.kloterId);
    if (klt) {
      const pkg = packageList.find(p => p.id === klt.packageId);
      if (pkg && pkg.category === selectedCategoryFilter) return true;
    }

    return false;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Laporan Keuangan & Margin Profitabilitas Travel</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            PT. Khadim Alharamain — Laporan Laba Rugi, Neraca Posisi Keuangan, & Profitabilitas Kloter
          </p>
        </div>

        {/* 3 Sub Tabs Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveSubTab('INCOME_STATEMENT')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              activeSubTab === 'INCOME_STATEMENT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. Laba Rugi (Profit & Loss)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('BALANCE_SHEET')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              activeSubTab === 'BALANCE_SHEET'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>2. Laporan Neraca (Balance Sheet)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('KLOTER_PROFIT')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              activeSubTab === 'KLOTER_PROFIT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>3. Margin per Kloter</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LABA RUGI (INCOME STATEMENT) */}
      {activeSubTab === 'INCOME_STATEMENT' && (
        <ProfitLossView coaList={coaList} journals={journals} />
      )}

      {/* TAB 2: LAPORAN NERACA (BALANCE SHEET) */}
      {activeSubTab === 'BALANCE_SHEET' && (
        <BalanceSheetView coaList={coaList} journals={journals} />
      )}

      {/* TAB 3: MARGIN & PROFITABILITAS PER KLOTER */}
      {activeSubTab === 'KLOTER_PROFIT' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Analisis Margin & Keuntungan Bersih Per Rombongan Kloter</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pengakuan Pendapatan Kloter Selesai vs Realisasi HPP Maskapai, Hotel & LA Saudi
                </p>
              </div>

              {/* Filter Jenis Paket Dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">Filter Paket:</label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Semua Jenis Paket Resmi</option>
                  <option value="UMRAH_REGULER_9D">1. Umroh Reguler 9 Hari</option>
                  <option value="UMRAH_PRIVATE">2. Umroh Private</option>
                  <option value="UMRAH_PLUS_DUBAI">3. Umroh Plus Dubai</option>
                  <option value="UMRAH_PLUS_TURKI">4. Umroh Plus Turki</option>
                  <option value="HAJI_PLUS">5. Haji Plus</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4">Kode & Nama Kloter</th>
                    <th className="py-3.5 px-4">Jenis Paket</th>
                    <th className="py-3.5 px-4 text-center">Jumlah Pax</th>
                    <th className="py-3.5 px-4 text-right">Pendapatan Diakui</th>
                    <th className="py-3.5 px-4 text-right">Dana Unearned (Belum Terbang)</th>
                    <th className="py-3.5 px-4 text-right">Total Realisasi HPP</th>
                    <th className="py-3.5 px-4 text-right">Laba Kotor (Gross Profit)</th>
                    <th className="py-3.5 px-4 text-center">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredProfitReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        Tidak ada kloter ditemukan untuk jenis paket yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredProfitReports.map((rep) => {
                      const klt = kloters.find(k => k.id === rep.kloterId);
                      const pkg = packageList.find(p => p.id === (klt?.packageId || rep.packageId));
                      const pkgLabel = pkg
                        ? pkg.name
                        : (rep.packageCategory && PACKAGE_CATEGORY_LABELS[rep.packageCategory] 
                            ? PACKAGE_CATEGORY_LABELS[rep.packageCategory] 
                            : (rep.packageName || '-'));

                      return (
                        <tr key={rep.kloterId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {rep.kloterCode} — {rep.kloterName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold rounded-md text-[10px]">
                              {pkgLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono">{rep.totalJamaah} Pax</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatIDR(rep.totalRevenueRecognized)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                            {formatIDR(rep.totalUnearnedRevenuePending)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                            {formatIDR(rep.realizedCOGS.total)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                            {formatIDR(rep.grossProfit)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-extrabold rounded-md text-[10px] font-mono">
                              {rep.profitMarginPercent}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aging Piutang Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Kartu & Umur Piutang Tagihan Jamaah (Aging Report)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">No. Registrasi</th>
                    <th className="py-3 px-4">Nama Jamaah</th>
                    <th className="py-3 px-4">Program & Kloter</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-right">Sudah Terbayar</th>
                    <th className="py-3 px-4 text-right">Sisa Piutang</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {receivablesReport.map((rec) => (
                    <tr key={rec.registrationId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {rec.registrationNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{rec.jamaahName}</td>
                      <td className="py-3 px-4">{rec.packageName} ({rec.kloterName})</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-200">{formatIDR(rec.totalBill)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(rec.paidAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">{formatIDR(rec.balanceDue)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold tracking-wider ${
                          rec.balanceDue === 0
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          {rec.balanceDue === 0 ? 'LUNAS' : 'MEMILIKI PIUTANG'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
