import React from 'react';
import { UserRole, UserProfile } from '../types';
import { getRoleBadge } from '../utils/formatters';
import { Building2, ShieldCheck, UserCheck, RefreshCw, Landmark, ChevronDown } from 'lucide-react';

interface HeaderNavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onRefreshData: () => void;
  isLoading: boolean;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentRole,
  setCurrentRole,
  onRefreshData,
  isLoading
}) => {
  const roles: { role: UserRole; label: string }[] = [
    { role: 'ADMIN_CS', label: 'Admin CS / Pendaftaran' },
    { role: 'KASIR_FINANCE', label: 'Kasir & Keuangan' },
    { role: 'ACCOUNTANT', label: 'Senior Accountant' },
    { role: 'DIREKSI_OWNER', label: 'Direksi / Owner' },
  ];

  const roleInfo = getRoleBadge(currentRole);

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A] text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0 text-xs font-mono">
              KA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base text-white tracking-tight">Khadim Alharamain</h1>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Umrah & Haji Plus
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Sistem Informasi Keuangan Travel</p>
            </div>
          </div>

          {/* Right Action Bar: Realtime status + Refresh + Role Switcher */}
          <div className="flex items-center space-x-4">
            
            <div className="hidden lg:block text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status Sistem</p>
              <p className="text-xs text-emerald-400 font-medium flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Real-time Sync</span>
              </p>
            </div>

            <button
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-sm transition-colors flex items-center space-x-1 text-xs border border-slate-700"
              title="Refresh Data Transaksi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden md:inline font-medium">Sync Data</span>
            </button>

            {/* RBAC Role Selector Dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700 cursor-pointer">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <div className="text-left">
                  <div className="text-[9px] text-slate-400 leading-none uppercase tracking-widest font-bold">Role Akses</div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1">
                    <span>{roleInfo.label}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-56 bg-[#0F172A] border border-slate-700 rounded-sm shadow-xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-2 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Ganti Hak Akses:
                </div>
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setCurrentRole(r.role)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 transition-colors ${
                      currentRole === r.role
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className={`w-3.5 h-3.5 ${currentRole === r.role ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
