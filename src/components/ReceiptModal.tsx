import React, { useEffect } from 'react';
import { JamaahPaymentTransaction, JamaahRegistration, Jamaah, TravelPackage, DepartureKloter, ChartOfAccount } from '../types';
import { formatIDR, formatDateIndo } from '../utils/formatters';
import { Printer, X, CheckCircle2, Landmark, FileText } from 'lucide-react';

interface ReceiptModalProps {
  payment: JamaahPaymentTransaction;
  registration?: JamaahRegistration;
  jamaah?: Jamaah;
  pkg?: TravelPackage;
  kloter?: DepartureKloter;
  bankCoa?: ChartOfAccount;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  registration,
  jamaah,
  pkg,
  kloter,
  bankCoa,
  onClose
}) => {
  // ESC Key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle backdrop overlay click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      {/* CSS Print Rules Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-modal-printable, #receipt-modal-printable * {
            visibility: visible !important;
          }
          #receipt-modal-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="receipt-modal-printable"
        className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:w-full"
      >
        {/* Header Bar - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Kuitansi Resmi Pembayaran Jamaah</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
              title="Cetak Kuitansi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Tutup (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="receipt-content" className="p-8 space-y-6 bg-white">
          
          {/* Company & Receipt Title */}
          <div className="flex items-start justify-between border-b pb-6 border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Landmark className="w-7 h-7 text-blue-700" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900">PT. Khadim Alharamain</h2>
              </div>
              <p className="text-xs font-bold text-slate-700">Izin Kemenag RI PPIU No. 23062200004470003</p>
              <p className="text-xs text-slate-500 max-w-md">Jl. Kaliabang Bungur No.87 Depan Masjid Al-hidayah Kel. Pejuang Kec. Medan Satria Kota Bekasi | WA : (+62) 812 814 7733</p>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md tracking-wider uppercase mb-1">
                KUITANSI RESMI
              </div>
              <p className="font-mono text-sm font-bold text-slate-800">{payment.receiptNumber}</p>
              <p className="text-xs text-slate-500">Tanggal: {formatDateIndo(payment.paymentDate)}</p>
            </div>
          </div>

          {/* Receipt Details Grid */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3 text-sm">
            
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="col-span-2 font-bold text-slate-900">: {jamaah?.fullName || 'Jamaah'}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">No. Registrasi / NIK</span>
              <span className="col-span-2 text-slate-800">: {registration?.registrationNumber} ({jamaah?.nik || '-'})</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Program Paket / Kloter</span>
              <span className="col-span-2 text-slate-800">: {pkg?.name || '-'} — {kloter?.name || '-'}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Uang Sejumlah</span>
              <span className="col-span-2 font-bold text-emerald-800 text-base bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                : {formatIDR(payment.amount)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Metode & Rekening</span>
              <span className="col-span-2 text-slate-800">: {payment.paymentMethod} ({bankCoa?.name || 'Kas/Bank'})</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Untuk Pembayaran</span>
              <span className="col-span-2 text-slate-800">: {payment.notes || '-'}</span>
            </div>

          </div>

          {/* Billing Progress Summary Box */}
          {registration && (
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-slate-50/50">
              <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                Ringkasan Tagihan & Posisi Piutang Jamaah:
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-white rounded-lg border">
                  <div className="text-slate-500">Total Tagihan Paket</div>
                  <div className="font-bold text-slate-900 text-sm">{formatIDR(registration.totalBill)}</div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-emerald-700">Total Terbayar (Acc)</div>
                  <div className="font-bold text-emerald-800 text-sm">{formatIDR(registration.paidAmount)}</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-amber-700">Sisa Piutang Jamaah</div>
                  <div className="font-bold text-amber-800 text-sm">{formatIDR(registration.balanceDue)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Accounting Disclaimer Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <strong>Catatan Akuntansi (PSAK Standards):</strong> Pembayaran ini dicatat sebagai <em>Pendapatan Diterima di Muka (Unearned Revenue / Liabilitas)</em> pada Rekening Penampungan Syariah. Pendapatan resmi travel diakui pada saat Kloter Keberangkatan resmi diterbangkan.
            </div>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-12">Diserahkan Oleh (Jamaah),</p>
              <p className="font-bold text-slate-900 underline">{jamaah?.fullName || '________________'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Diterima Oleh (Finance/Kasir),</p>
              <p className="font-bold text-slate-900 underline">{payment.createdBy || 'Kasir Keuangan'}</p>
              <p className="text-[10px] text-slate-400">ID Jurnal: {payment.journalEntryId}</p>
            </div>
          </div>

        </div>

        {/* Floating/Bottom Action Toolbar - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-t border-slate-200 print:hidden">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Klik cetak untuk mencetak kuitansi atau menyimpannya sebagai dokumen PDF.
          </span>
          <div className="flex items-center space-x-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kuitansi / Print</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

