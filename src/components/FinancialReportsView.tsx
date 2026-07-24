import React, { useState, useEffect } from 'react';
import { KloterProfitabilityReport, ChartOfAccount, TravelPackage, DepartureKloter, PackageCategory, PACKAGE_CATEGORY_LABELS, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
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
  Filter
} from 'lucide-react';

interface FinancialReportsViewProps {
  coaList: ChartOfAccount[];
  packageList?: TravelPackage[];
  kloters?: DepartureKloter[];
  userRole?: UserRole;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({ coaList, packageList = [], kloters = [], userRole = 'ACCOUNTANT' }) => {
  const perm = getRolePermissions(userRole);
  const [activeSubTab, setActiveSubTab] = useState<'PROFITABILITY' | 'RECEIVABLES' | 'BALANCE_SHEET'>('PROFITABILITY');
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
      const profData = await profRes.json();
      const recData = await recRes.json();

      setProfitReports(profData || []);
      setReceivablesReport(recData || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Balance Sheet Calculations
  const assetCoa = coaList.filter(a => a.category === 'ASSET');
  const liabilityCoa = coaList.filter(a => a.category === 'LIABILITY');
  const equityCoa = coaList.filter(a => a.category === 'EQUITY');
  const revenueCoa = coaList.filter(a => a.category === 'REVENUE');
  const cogsCoa = coaList.filter(a => a.category === 'COGS');
  const expenseCoa = coaList.filter(a => a.category === 'EXPENSE');

  const totalAssets = assetCoa.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilityCoa.reduce((s, a) => s + a.balance, 0);
  
  const totalRev = revenueCoa.reduce((s, a) => s + a.balance, 0);
  const totalCogs = cogsCoa.reduce((s, a) => s + a.balance, 0);
  const totalExp = expenseCoa.reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRev - totalCogs - totalExp;

  const totalEquity = equityCoa.reduce((s, a) => s + a.balance, 0) + netIncome;

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
      <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Laporan Keuangan & Analisis Profitabilitas Travel</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Profit & Loss per Kloter, Kartu Umur Piutang Jamaah, Neraca Keuangan (Balance Sheet)
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-sm text-xs font-bold border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('PROFITABILITY')}
            className={`px-3.5 py-1.5 rounded-sm transition-all uppercase tracking-wider text-[11px] ${
              activeSubTab === 'PROFITABILITY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Laba/Rugi Per Kloter
          </button>
          <button
            onClick={() => setActiveSubTab('RECEIVABLES')}
            className={`px-3.5 py-1.5 rounded-sm transition-all uppercase tracking-wider text-[11px] ${
              activeSubTab === 'RECEIVABLES'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Umur Piutang Jamaah
          </button>
          <button
            onClick={() => setActiveSubTab('BALANCE_SHEET')}
            className={`px-3.5 py-1.5 rounded-sm transition-all uppercase tracking-wider text-[11px] ${
              activeSubTab === 'BALANCE_SHEET'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Neraca & Laba Rugi
          </button>
        </div>
      </div>

      {activeSubTab === 'PROFITABILITY' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Laporan Keuntungan Bersih (Profitability Margin) Per Rombongan Kloter</span>
              </h3>

              {/* Filter Jenis Paket Dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">Filter Jenis Paket:</label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
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
                    <th className="py-3 px-4">Kode & Nama Kloter</th>
                    <th className="py-3 px-4">Jenis Paket</th>
                    <th className="py-3 px-4 text-center">Jumlah Pax</th>
                    <th className="py-3 px-4 text-right">Pendapatan Diakui</th>
                    <th className="py-3 px-4 text-right">Dana Belum Berangkat (Unearned)</th>
                    <th className="py-3 px-4 text-right">Total Realisasi HPP</th>
                    <th className="py-3 px-4 text-right">Laba Kotor (Gross Profit)</th>
                    <th className="py-3 px-4 text-center">Margin (%)</th>
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
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {rep.kloterCode} — {rep.kloterName}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold rounded-sm text-[10px]">
                              {pkgLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono">{rep.totalJamaah} Pax</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatIDR(rep.totalRevenueRecognized)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                            {formatIDR(rep.totalUnearnedRevenuePending)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                            {formatIDR(rep.realizedCOGS.total)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatIDR(rep.grossProfit)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-sm text-[10px] font-mono">
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
        </div>
      )}

      {activeSubTab === 'RECEIVABLES' && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Laporan Kartu & Umur Piutang Tagihan Jamaah (Aging Report)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Nama Jamaah</th>
                  <th className="py-3 px-4">Program & Kloter</th>
                  <th className="py-3 px-4 text-right">Total Paket</th>
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
                      <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold tracking-wider ${
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
      )}

      {activeSubTab === 'BALANCE_SHEET' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Assets Section */}
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-blue-600">
              AKTIVA (ASSETS)
            </h3>
            <div className="space-y-2 text-xs">
              {assetCoa.map((a) => (
                <div key={a.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium"><span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-1.5">{a.code}</span>{a.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatIDR(a.balance)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t-2 border-slate-900 dark:border-slate-100 flex justify-between font-bold text-xs uppercase tracking-wider">
              <span>TOTAL AKTIVA / ASSETS:</span>
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{formatIDR(totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities & Equity Section */}
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-6 shadow-sm">
            
            {/* Liabilities */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-purple-600">
                PASIVA - KEWAJIBAN (LIABILITIES)
              </h3>
              <div className="space-y-2 text-xs">
                {liabilityCoa.map((l) => (
                  <div key={l.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 font-medium"><span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-1.5">{l.code}</span>{l.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatIDR(l.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-between font-bold text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Total Kewajiban / Liabilitas:</span>
                <span className="font-mono text-xs">{formatIDR(totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-blue-600">
                EKUITAS (EQUITY)
              </h3>
              <div className="space-y-2 text-xs">
                {equityCoa.map((e) => (
                  <div key={e.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 font-medium"><span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-1.5">{e.code}</span>{e.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatIDR(e.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-emerald-600 font-bold">
                  <span>Laba Bersih Periode Berjalan</span>
                  <span className="font-mono">{formatIDR(netIncome)}</span>
                </div>
              </div>
              <div className="pt-2 flex justify-between font-bold text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                <span>Total Ekuitas Modal:</span>
                <span className="font-mono text-xs">{formatIDR(totalEquity)}</span>
              </div>
            </div>

            {/* Total Balance Check */}
            <div className="pt-3 border-t-2 border-slate-900 dark:border-slate-100 flex justify-between font-bold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-800/80 p-3 rounded-sm border border-slate-200 dark:border-slate-700">
              <span>TOTAL PASIVA (KEWAJIBAN + EKUITAS):</span>
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{formatIDR(totalLiabilities + totalEquity)}</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
