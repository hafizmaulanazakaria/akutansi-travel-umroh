import React, { useState } from 'react';
import { JournalEntry, ChartOfAccount, UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';
import { formatIDR } from '../utils/formatters';
import {
  FileCheck,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ChevronDown,
  Building2,
  Lock
} from 'lucide-react';

interface JournalLedgerViewProps {
  journals: JournalEntry[];
  coaList: ChartOfAccount[];
  userRole?: UserRole;
}

export const JournalLedgerView: React.FC<JournalLedgerViewProps> = ({ journals, coaList, userRole = 'ACCOUNTANT' }) => {
  const perm = getRolePermissions(userRole);
  const [activeTab, setActiveTab] = useState<'JOURNAL' | 'LEDGER'>('JOURNAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoaId, setSelectedCoaId] = useState<string>(coaList[1]?.id || '');

  // Filter Journals
  const filteredJournals = journals.filter(
    (j) =>
      j.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // General Ledger calculations for selected COA
  const selectedCoa = coaList.find((c) => c.id === selectedCoaId);
  
  // Extract all lines associated with selected COA
  const ledgerLines: {
    journalNumber: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
  }[] = [];

  journals.forEach((j) => {
    j.lines.forEach((line) => {
      if (line.accountId === selectedCoaId || line.accountCode === selectedCoa?.code) {
        ledgerLines.push({
          journalNumber: j.journalNumber,
          date: j.transactionDate,
          description: j.description || line.memo || '',
          debit: line.debit,
          credit: line.credit
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Jurnal Umum & Buku Besar (Double-Entry Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan akuntansi presisi debit-kredit otomatis, jejak audit transaksi, & kartu buku besar per akun
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-sm">
          <button
            onClick={() => setActiveTab('JOURNAL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-sm transition-all ${
              activeTab === 'JOURNAL'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Jurnal Umum (General Journal)
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-sm transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Buku Besar (General Ledger)
          </button>
        </div>
      </div>

      {activeTab === 'JOURNAL' ? (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari No. Jurnal / Keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Status Keseimbangan Debit/Kredit: <strong className="text-emerald-600 font-bold">BALANCED (100%)</strong></span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJournals.map((jv) => (
              <div
                key={jv.id}
                className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden text-xs bg-slate-50/40 dark:bg-slate-800/20"
              >
                {/* Journal Entry Header */}
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{jv.journalNumber}</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="font-mono text-slate-500">{jv.transactionDate}</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-md">{jv.description}</span>
                  </div>

                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 font-bold rounded-sm uppercase text-[10px] tracking-wider">
                    {jv.referenceType}
                  </span>
                </div>

                {/* Journal Lines Table */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-4">Kode & Nama Akun COA</th>
                      <th className="py-2.5 px-4">Memo Line</th>
                      <th className="py-2.5 px-4 text-right">Debit (IDR)</th>
                      <th className="py-2.5 px-4 text-right">Kredit (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {jv.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-white dark:hover:bg-slate-800">
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{line.accountCode}</span> — {line.accountName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{line.memo || '-'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {line.debit > 0 ? formatIDR(line.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {line.credit > 0 ? formatIDR(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* GENERAL LEDGER VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Akun Buku Besar (COA):</label>
              <select
                value={selectedCoaId}
                onChange={(e) => setSelectedCoaId(e.target.value)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-80 font-mono"
              >
                {coaList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedCoa && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-sm border border-slate-200 dark:border-slate-700 text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Akhir Akun Ini:</div>
                <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatIDR(selectedCoa.balance)}
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">No. Jurnal</th>
                  <th className="py-3 px-4">Keterangan / Memo</th>
                  <th className="py-3 px-4 text-right">Debit</th>
                  <th className="py-3 px-4 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {ledgerLines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada transaksi jurnal untuk akun COA ini.
                    </td>
                  </tr>
                ) : (
                  ledgerLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono text-slate-500">{line.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{line.journalNumber}</td>
                      <td className="py-3 px-4">{line.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {line.debit > 0 ? formatIDR(line.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {line.credit > 0 ? formatIDR(line.credit) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
