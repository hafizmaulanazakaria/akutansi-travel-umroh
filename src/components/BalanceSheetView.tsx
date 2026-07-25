import React, { useState } from 'react';
import { ChartOfAccount, JournalEntry } from '../types';
import { formatIDR, formatDateIndo } from '../utils/formatters';
import {
  Landmark,
  Printer,
  Download,
  Calendar,
  Building,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Scale
} from 'lucide-react';

interface BalanceSheetViewProps {
  coaList: ChartOfAccount[];
  journals?: JournalEntry[];
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({ coaList, journals = [] }) => {
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Compute Net Income dynamically from Revenue, COGS, and Expenses
  const revenueCoa = coaList.filter(a => a.category === 'REVENUE');
  const cogsCoa = coaList.filter(a => a.category === 'COGS');
  const expenseCoa = coaList.filter(a => a.category === 'EXPENSE');

  const totalRevenue = revenueCoa.reduce((s, a) => s + (a.balance || 0), 0);
  const totalCogs = cogsCoa.reduce((s, a) => s + (a.balance || 0), 0);
  const totalExpense = expenseCoa.reduce((s, a) => s + (a.balance || 0), 0);

  const netIncomeCurrentPeriod = totalRevenue - totalCogs - totalExpense;

  // Filter COAs
  const assetCoaList = coaList.filter(a => a.category === 'ASSET');
  const liabilityCoaList = coaList.filter(a => a.category === 'LIABILITY');
  const equityCoaList = coaList.filter(a => a.category === 'EQUITY');

  // Asset Categories
  const cashAndBank = assetCoaList.filter(a => ['1101', '1102', '1103', '1104'].includes(a.code));
  const receivables = assetCoaList.filter(a => a.code === '1120');
  const otherAssets = assetCoaList.filter(a => !['1101', '1102', '1103', '1104', '1120'].includes(a.code));

  const totalCashAndBank = cashAndBank.reduce((s, a) => s + (a.balance || 0), 0);
  const totalReceivables = receivables.reduce((s, a) => s + (a.balance || 0), 0);
  const totalOtherAssets = otherAssets.reduce((s, a) => s + (a.balance || 0), 0);
  const totalAssets = totalCashAndBank + totalReceivables + totalOtherAssets;

  // Liabilities Categories
  const unearnedRevenue = liabilityCoaList.filter(a => ['2101', '2102'].includes(a.code));
  const payables = liabilityCoaList.filter(a => a.code === '2103');
  const otherLiabilities = liabilityCoaList.filter(a => !['2101', '2102', '2103'].includes(a.code));

  const totalUnearnedRevenue = unearnedRevenue.reduce((s, a) => s + (a.balance || 0), 0);
  const totalPayables = payables.reduce((s, a) => s + (a.balance || 0), 0);
  const totalOtherLiabilities = otherLiabilities.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = totalUnearnedRevenue + totalPayables + totalOtherLiabilities;

  // Equity Categories
  const baseEquity = equityCoaList.reduce((s, a) => s + (a.balance || 0), 0);
  const totalEquity = baseEquity + netIncomeCurrentPeriod;

  // Balance Test
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;
  const balanceDifference = totalAssets - totalLiabilitiesAndEquity;

  // Export to Excel / CSV
  const handleExportCSV = () => {
    let csv = `PT. KHADIM ALHARAMAIN TOUR & TRAVEL\n`;
    csv += `LAPORAN NERACA KEUANGAN (BALANCE SHEET)\n`;
    csv += `Per Tanggal: ${formatDateIndo(asOfDate)}\n\n`;

    csv += `ASET (ASSETS),,,LIABILITAS & EKUITAS,,,\n`;
    csv += `Aset Lancar,,,Liabilitas Jangka Pendek,,,\n`;

    csv += `Kas Kecil Operational,,${cashAndBank.find(a => a.code === '1101')?.balance || 0},Pendapatan Diterima di Muka (Umrah),,${unearnedRevenue.find(a => a.code === '2101')?.balance || 0}\n`;
    csv += `Bank BSI Syariah IDR,,${cashAndBank.find(a => a.code === '1102')?.balance || 0},Pendapatan Diterima di Muka (Haji),,${unearnedRevenue.find(a => a.code === '2102')?.balance || 0}\n`;
    csv += `Bank Mandiri IDR,,${cashAndBank.find(a => a.code === '1103')?.balance || 0},Utang Vendor Airline & LA,,${payables.find(a => a.code === '2103')?.balance || 0}\n`;
    csv += `Bank USD Syariah,,${cashAndBank.find(a => a.code === '1104')?.balance || 0},TOTAL LIABILITAS,,${totalLiabilities}\n`;
    csv += `Piutang Paket Jamaah,,${totalReceivables},,,\n`;
    csv += `TOTAL ASET,,${totalAssets},EKUITAS,,,\n`;
    csv += `,,,Modal Disetor,,${equityCoaList.find(a => a.code === '3101')?.balance || 0}\n`;
    csv += `,,,Laba Ditahan,,${equityCoaList.find(a => a.code === '3201')?.balance || 0}\n`;
    csv += `,,,Laba Bersih Berjalan,,${netIncomeCurrentPeriod}\n`;
    csv += `,,,TOTAL EKUITAS,,${totalEquity}\n`;
    csv += `,,,TOTAL LIABILITAS & EKUITAS,,${totalLiabilitiesAndEquity}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Neraca_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Control Bar (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        {/* As of Date Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Posisi Per Tanggal:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold outline-none"
          />
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center space-x-2">
          {isBalanced ? (
            <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full text-xs font-extrabold flex items-center space-x-1.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>BALANCE (SEIMBANG 100%)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-full text-xs font-extrabold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>TIDAK BALANCE (Selisih: {formatIDR(balanceDifference)})</span>
            </div>
          )}
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Main Balance Sheet Document View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 print:p-0 print:border-none print:shadow-none max-w-5xl mx-auto">
        
        {/* Kop Surat PT Khadim Alharamain */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
            <Building className="w-6 h-6" />
            <span className="text-sm font-black tracking-widest uppercase">PT. KHADIM ALHARAMAIN TOUR & TRAVEL</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            LAPORAN NERACA POSISI KEUANGAN (BALANCE SHEET)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Izin Umrah PPIU No. 9120201920831 — Kementerian Agama Republik Indonesia
          </p>
          <div className="text-xs font-mono font-extrabold text-blue-700 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/30 py-1 px-4 rounded-full inline-block">
            Posisi Per Tanggal: {formatDateIndo(asOfDate)}
          </div>
        </div>

        {/* 2-Column Balanced Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-medium">
          
          {/* KOLOM KIRI: ASET (ASSETS) */}
          <div className="space-y-6">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg border-l-4 border-blue-600 flex justify-between items-center font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <span className="flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>ASET (ASSETS)</span>
              </span>
              <span>NOMINAL (IDR)</span>
            </div>

            {/* Aset Lancar */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 pb-1">
                Aset Lancar (Current Assets)
              </h4>

              <div className="space-y-2 pl-2 divide-y divide-slate-100 dark:divide-slate-800">
                {cashAndBank.map((a) => (
                  <div key={a.id} className="flex justify-between py-1.5">
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                      <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatIDR(a.balance)}
                    </span>
                  </div>
                ))}

                {receivables.map((a) => (
                  <div key={a.id} className="flex justify-between py-1.5">
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                      <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatIDR(a.balance)}
                    </span>
                  </div>
                ))}

                {otherAssets.map((a) => (
                  <div key={a.id} className="flex justify-between py-1.5">
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                      <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatIDR(a.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Aset Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 rounded-xl flex justify-between items-center shadow-sm mt-auto">
              <div>
                <div className="text-xs font-black uppercase text-blue-900 dark:text-blue-300 tracking-wider">
                  TOTAL ASET (TOTAL ASSETS)
                </div>
                <div className="text-[10px] text-blue-700 dark:text-blue-400">
                  Total Seluruh Kekayaan Aktiva PT. Khadim Alharamain
                </div>
              </div>
              <div className="text-lg font-black font-mono text-blue-700 dark:text-blue-300">
                {formatIDR(totalAssets)}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: LIABILITAS & EKUITAS */}
          <div className="space-y-6">
            
            {/* LIABILITAS (LIABILITIES) */}
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg border-l-4 border-purple-600 flex justify-between items-center font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                <span>LIABILITAS (LIABILITIES)</span>
                <span>NOMINAL (IDR)</span>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 pb-1">
                  Liabilitas Jangka Pendek
                </h4>

                <div className="space-y-2 pl-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {unearnedRevenue.map((a) => (
                    <div key={a.id} className="flex justify-between py-1.5">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                        <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatIDR(a.balance)}
                      </span>
                    </div>
                  ))}

                  {payables.map((a) => (
                    <div key={a.id} className="flex justify-between py-1.5">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                        <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatIDR(a.balance)}
                      </span>
                    </div>
                  ))}

                  {otherLiabilities.map((a) => (
                    <div key={a.id} className="flex justify-between py-1.5">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                        <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatIDR(a.balance)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-purple-700 dark:text-purple-300">
                  <span>TOTAL LIABILITAS</span>
                  <span className="font-mono">{formatIDR(totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* EKUITAS (EQUITY) */}
            <div className="space-y-4 pt-2">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg border-l-4 border-emerald-600 flex justify-between items-center font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                <span>EKUITAS (EQUITY)</span>
                <span>NOMINAL (IDR)</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2 pl-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {equityCoaList.map((a) => (
                    <div key={a.id} className="flex justify-between py-1.5">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{a.code}</span>
                        <span className="text-slate-700 dark:text-slate-300">{a.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatIDR(a.balance)}
                      </span>
                    </div>
                  ))}

                  {/* Dynamic Net Income for current period */}
                  <div className="flex justify-between py-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 rounded-lg">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                      Laba Bersih Periode Berjalan (Net Income)
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatIDR(netIncomeCurrentPeriod)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-400">
                  <span>TOTAL EKUITAS MODAL</span>
                  <span className="font-mono">{formatIDR(totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilitas + Ekuitas Box */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex justify-between items-center shadow-sm">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-200">
                  TOTAL LIABILITAS + EKUITAS
                </div>
                <div className="text-[10px] text-slate-400">
                  Must Equal Total Assets (Sesuai Persamaan Dasar Akuntansi)
                </div>
              </div>
              <div className="text-lg font-black font-mono text-emerald-400">
                {formatIDR(totalLiabilitiesAndEquity)}
              </div>
            </div>

          </div>
        </div>

        {/* Balance Status Footer Notice */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Verifikasi Keseimbangan Akuntansi (Double-Entry Equation Check)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Aset ({formatIDR(totalAssets)}) = Liabilitas ({formatIDR(totalLiabilities)}) + Ekuitas ({formatIDR(totalEquity)})
              </div>
            </div>
          </div>

          <div>
            {isBalanced ? (
              <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-[11px] rounded-md flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SEIMBANG</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-rose-600 text-white font-extrabold text-[11px] rounded-md flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>SELISIH: {formatIDR(balanceDifference)}</span>
              </span>
            )}
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
  );
};
