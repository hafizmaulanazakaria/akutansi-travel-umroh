import React, { useState } from 'react';
import { ChartOfAccount, JournalEntry } from '../types';
import { formatIDR } from '../utils/formatters';
import {
  TrendingUp,
  Printer,
  Download,
  Calendar,
  Building,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface ProfitLossViewProps {
  coaList: ChartOfAccount[];
  journals?: JournalEntry[];
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({ coaList, journals = [] }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [startMonth, setStartMonth] = useState<number>(1); // 1 = Jan
  const [endMonth, setEndMonth] = useState<number>(12); // 12 = Dec

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Accounts filtering
  const revenueCoa = coaList.filter(a => a.category === 'REVENUE');
  const cogsCoa = coaList.filter(a => a.category === 'COGS');
  const expenseCoa = coaList.filter(a => a.category === 'EXPENSE');

  // Compute balance for an account considering date filters if journals exist
  const getAccountBalance = (account: ChartOfAccount) => {
    if (!journals || journals.length === 0) {
      return account.balance || 0;
    }

    // Filter journal lines for this account within month and year range
    let total = 0;
    let hasMatchingJournals = false;

    journals.forEach(j => {
      if (!j.transactionDate) return;
      const jDate = new Date(j.transactionDate);
      const jYear = jDate.getFullYear();
      const jMonth = jDate.getMonth() + 1; // 1-12

      if (jYear === selectedYear && jMonth >= startMonth && jMonth <= endMonth) {
        j.lines.forEach(l => {
          if (l.accountId === account.id || l.accountCode === account.code) {
            hasMatchingJournals = true;
            if (account.category === 'REVENUE') {
              total += (l.credit || 0) - (l.debit || 0);
            } else if (account.category === 'COGS' || account.category === 'EXPENSE') {
              total += (l.debit || 0) - (l.credit || 0);
            }
          }
        });
      }
    });

    // Fallback to COA default balance if no date-filtered journal entry exists for standard view
    if (!hasMatchingJournals && startMonth === 1 && endMonth === 12 && selectedYear === currentYear) {
      return account.balance || 0;
    }

    return total;
  };

  // Grouped Revenues
  const revUmrah = revenueCoa.filter(a => a.code === '4101').reduce((s, a) => s + getAccountBalance(a), 0);
  const revHaji = revenueCoa.filter(a => a.code === '4102').reduce((s, a) => s + getAccountBalance(a), 0);
  const revOther = revenueCoa.filter(a => !['4101', '4102'].includes(a.code)).reduce((s, a) => s + getAccountBalance(a), 0);
  const totalRevenue = revUmrah + revHaji + revOther;

  // Grouped COGS / HPP
  const cogsAirline = cogsCoa.filter(a => a.code === '5101').reduce((s, a) => s + getAccountBalance(a), 0);
  const cogsHotel = cogsCoa.filter(a => a.code === '5102').reduce((s, a) => s + getAccountBalance(a), 0);
  const cogsVisaAsuransi = cogsCoa.filter(a => a.code === '5103').reduce((s, a) => s + getAccountBalance(a), 0);
  const cogsLA = cogsCoa.filter(a => a.code === '5104').reduce((s, a) => s + getAccountBalance(a), 0);
  const cogsHandling = cogsCoa.filter(a => a.code === '5105').reduce((s, a) => s + getAccountBalance(a), 0);
  const cogsOther = cogsCoa.filter(a => !['5101', '5102', '5103', '5104', '5105'].includes(a.code)).reduce((s, a) => s + getAccountBalance(a), 0);
  const totalCogs = cogsAirline + cogsHotel + cogsVisaAsuransi + cogsLA + cogsHandling + cogsOther;

  // Gross Profit
  const grossProfit = totalRevenue - totalCogs;

  // Grouped Operating Expenses (OPEX)
  const expMitraCommission = expenseCoa.filter(a => a.code === '6104').reduce((s, a) => s + getAccountBalance(a), 0);
  const expOfficeOps = expenseCoa.filter(a => a.code === '6101').reduce((s, a) => s + getAccountBalance(a), 0);
  const expSalaries = expenseCoa.filter(a => a.code === '6102').reduce((s, a) => s + getAccountBalance(a), 0);
  const expMarketing = expenseCoa.filter(a => a.code === '6103').reduce((s, a) => s + getAccountBalance(a), 0);
  const expOther = expenseCoa.filter(a => !['6101', '6102', '6103', '6104'].includes(a.code)).reduce((s, a) => s + getAccountBalance(a), 0);
  const totalOpex = expMitraCommission + expOfficeOps + expSalaries + expMarketing + expOther;

  // Net Operating Income
  const netOperatingIncome = grossProfit - totalOpex;

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const periodStr = `${MONTH_NAMES[startMonth - 1]} - ${MONTH_NAMES[endMonth - 1]} ${selectedYear}`;
    let csv = `PT. KHADIM ALHARAMAIN TOUR & TRAVEL\n`;
    csv += `LAPORAN LABA RUGI (INCOME STATEMENT)\n`;
    csv += `Periode: ${periodStr}\n\n`;
    csv += `Kategori Akun,Kode,Nama Akun,Nominal (IDR)\n`;

    csv += `PENDAPATAN OPERASIONAL,,,\n`;
    csv += `,4101,Pendapatan Paket Umrah,${revUmrah}\n`;
    csv += `,4102,Pendapatan Paket Haji Plus,${revHaji}\n`;
    csv += `,4103,Pendapatan Visa & Handling Add-on,${revOther}\n`;
    csv += `TOTAL PENDAPATAN OPERASIONAL,,,${totalRevenue}\n\n`;

    csv += `BEBAN HOK / HPP OPERASIONAL,,,\n`;
    csv += `,5101,HPP - Tiket Pesawat Maskapai,${cogsAirline}\n`;
    csv += `,5102,HPP - Hotel Makkah & Madinah,${cogsHotel}\n`;
    csv += `,5103,HPP - Visa & Asuransi Saudi,${cogsVisaAsuransi}\n`;
    csv += `,5104,HPP - Land Arrangement (LA) Saudi,${cogsLA}\n`;
    csv += `,5105,HPP - Perlengkapan & Handling Koper,${cogsHandling}\n`;
    csv += `TOTAL BEBAN HOK / HPP,,,${totalCogs}\n\n`;

    csv += `LABA KOTOR (GROSS PROFIT),,,${grossProfit}\n\n`;

    csv += `BEBAN OPERASIONAL & PEMASARAN (OPEX),,,\n`;
    csv += `,6104,Beban Komisi / Fee Mitra & Agen,${expMitraCommission}\n`;
    csv += `,6101,Beban Operasional Kantor,${expOfficeOps}\n`;
    csv += `,6102,Beban Gaji Staf & Muthawwif,${expSalaries}\n`;
    csv += `,6103,Beban Marketing & Syiar,${expMarketing}\n`;
    csv += `TOTAL BEBAN OPERASIONAL (OPEX),,,${totalOpex}\n\n`;

    csv += `LABA BERSIH OPERASIONAL (NET PROFIT),,,${netOperatingIncome}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Laba_Rugi_${selectedYear}_${startMonth}-${endMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF Layout
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Control Bar (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        {/* Date / Month Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Periode Laporan:</span>
          </div>

          <select
            value={startMonth}
            onChange={(e) => setStartMonth(Number(e.target.value))}
            className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold outline-none"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400">s/d</span>

          <select
            value={endMonth}
            onChange={(e) => setEndMonth(Number(e.target.value))}
            className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold outline-none"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Main Income Statement Document View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 print:p-0 print:border-none print:shadow-none max-w-4xl mx-auto">
        
        {/* Kop Surat PT Khadim Alharamain */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Building className="w-6 h-6" />
            <span className="text-sm font-black tracking-widest uppercase">PT. KHADIM ALHARAMAIN TOUR & TRAVEL</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            LAPORAN LABA RUGI (INCOME STATEMENT)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Izin Umrah PPIU No. 9120201920831 — Kementerian Agama Republik Indonesia
          </p>
          <div className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-900/30 py-1 px-4 rounded-full inline-block">
            Periode: {MONTH_NAMES[startMonth - 1]} - {MONTH_NAMES[endMonth - 1]} {selectedYear}
          </div>
        </div>

        {/* Multi-step Statement Table */}
        <div className="space-y-6 text-xs font-medium">
          
          {/* I. PENDAPATAN OPERASIONAL */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg border-l-4 border-emerald-600 font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <span>I. PENDAPATAN OPERASIONAL</span>
              <span>KODE COA</span>
            </div>

            <div className="pl-4 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  Pendapatan Paket Umrah <span className="text-[10px] text-slate-400">(Pengakuan Pendapatan Kloter Selesai)</span>
                </span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">4101</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(revUmrah)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Pendapatan Paket Haji Plus</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">4102</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(revHaji)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Pendapatan Visa & Handling Add-on</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">4103</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(revOther)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Pendapatan */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-emerald-700 dark:text-emerald-400 text-xs px-2">
              <span>TOTAL PENDAPATAN OPERASIONAL</span>
              <span className="font-mono text-sm">{formatIDR(totalRevenue)}</span>
            </div>
          </div>

          {/* II. BEBAN HOK / HPP OPERASIONAL */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg border-l-4 border-rose-600 font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <span>II. BEBAN HOK / HPP OPERASIONAL (COST OF GOODS SOLD)</span>
              <span>KODE COA</span>
            </div>

            <div className="pl-4 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Biaya Tiket Pesawat Maskapai (Saudi/Garuda/Lion)</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">5101</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(cogsAirline)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Biaya Hotel Makkah & Madinah</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">5102</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(cogsHotel)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Biaya Visa & Asuransi Saudi</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">5103</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(cogsVisaAsuransi)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Biaya Land Arrangement (LA) Saudi, Bus & Catering</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">5104</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(cogsLA)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Biaya Perlengkapan, Batik & Handling Koper</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">5105</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(cogsHandling)}
                  </span>
                </div>
              </div>

              {cogsOther > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Beban HPP Lainnya</span>
                  <div className="flex items-center space-x-6">
                    <span className="font-mono text-slate-400">51xx</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                      {formatIDR(cogsOther)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Total HPP */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-rose-700 dark:text-rose-400 text-xs px-2">
              <span>TOTAL BEBAN HOK / HPP OPERASIONAL</span>
              <span className="font-mono text-sm">({formatIDR(totalCogs)})</span>
            </div>
          </div>

          {/* GROSS PROFIT HIGHLIGHT */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl flex justify-between items-center shadow-sm">
            <div>
              <div className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-300 tracking-wider">
                LABA KOTOR OPERASIONAL (GROSS PROFIT)
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Laba sebelum dikurangi Beban Operasional Kantor & Pemasaran
              </div>
            </div>
            <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {formatIDR(grossProfit)}
            </div>
          </div>

          {/* III. BEBAN OPERASIONAL & PEMASARAN (OPEX) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg border-l-4 border-amber-500 font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <span>III. BEBAN OPERASIONAL & PEMASARAN (OPEX)</span>
              <span>KODE COA</span>
            </div>

            <div className="pl-4 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Beban Komisi / Fee Referral Mitra & Agen</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">6104</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(expMitraCommission)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Beban Operasional Kantor, Sewa & Listrik</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">6101</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(expOfficeOps)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Beban Gaji Staf, Muthawwif & Tour Leader</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">6102</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(expSalaries)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 dark:text-slate-300">Beban Pemasaran, Iklan & Syiar</span>
                <div className="flex items-center space-x-6">
                  <span className="font-mono text-slate-400">6103</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                    {formatIDR(expMarketing)}
                  </span>
                </div>
              </div>

              {expOther > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Beban Operasional Lainnya</span>
                  <div className="flex items-center space-x-6">
                    <span className="font-mono text-slate-400">61xx</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-32 text-right">
                      {formatIDR(expOther)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Total OPEX */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-amber-700 dark:text-amber-400 text-xs px-2">
              <span>TOTAL BEBAN OPERASIONAL (OPEX)</span>
              <span className="font-mono text-sm">({formatIDR(totalOpex)})</span>
            </div>
          </div>

          {/* NET OPERATING INCOME / NET PROFIT HIGHLIGHT */}
          <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl flex justify-between items-center shadow-md">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-100">
                LABA BERSIH OPERASIONAL (NET OPERATING INCOME / NET PROFIT)
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">
                Hasil bersih akhir periode PT. Khadim Alharamain
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {formatIDR(netOperatingIncome)}
            </div>
          </div>

          {/* Printable Signature Footer (Appears on Print) */}
          <div className="pt-12 hidden print:grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <p className="font-bold">Disiapkan Oleh,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Senior Accountant</p>
              <p className="text-[10px] text-slate-500">Divisi Keuangan & Akuntansi</p>
            </div>
            <div>
              <p className="font-bold">Diverifikasi Oleh,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Finance Manager</p>
              <p className="text-[10px] text-slate-500">Manajer Keuangan Travel</p>
            </div>
            <div>
              <p className="font-bold">Disetujui Oleh,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Direktur Utama</p>
              <p className="text-[10px] text-slate-500">PT. Khadim Alharamain</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
