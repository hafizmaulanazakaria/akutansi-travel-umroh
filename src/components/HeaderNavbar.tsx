import React from 'react';
import { UserRole } from '../types';
import { getRoleBadge } from '../utils/formatters';
import { ShieldCheck, UserCheck, RefreshCw, ChevronDown, PanelLeft, PanelLeftClose } from 'lucide-react';

interface HeaderNavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onRefreshData: () => void;
  isLoading: boolean;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentRole,
  setCurrentRole,
  onRefreshData,
  isLoading,
  isCollapsed,
  setIsCollapsed
}) => {
  const roles: { role: UserRole; label: string }[] = [
    { role: 'ADMIN_CS', label: 'Admin CS / Pendaftaran' },
    { role: 'KASIR_FINANCE', label: 'Kasir & Keuangan' },
    { role: 'ACCOUNTANT', label: 'Senior Accountant' },
    { role: 'DIREKSI_OWNER', label: 'Direksi / Owner' },
  ];

  const roleInfo = getRoleBadge(currentRole);

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A] text-white border-b border-slate-800 shadow-sm px-4 lg:px-6 h-14 flex items-center justify-between shrink-0">
      
      {/* Left: Sidebar Toggle + System Real-time Sync Indicator */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-sm transition-colors border border-slate-700 flex items-center space-x-1"
          title={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4 text-blue-400" /> : <PanelLeftClose className="w-4 h-4 text-slate-300" />}
        </button>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <p className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
            <span>Status Sistem:</span>
            <span className="font-normal text-slate-300">Real-time Sync</span>
          </p>
        </div>
      </div>

      {/* Right: Sync Data Button + Role Switcher */}
      <div className="flex items-center space-x-3">
        
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-sm transition-colors flex items-center space-x-1.5 text-xs border border-slate-700 font-medium"
          title="Refresh Data Transaksi"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden sm:inline">Sync Data</span>
        </button>

        {/* RBAC Role Selector Dropdown */}
        <div className="relative group">
          <div className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-sm border border-slate-700 cursor-pointer transition-colors">
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
          <div className="absolute right-0 mt-1 w-56 bg-[#0F172A] border border-slate-700 rounded-sm shadow-2xl py-1 hidden group-hover:block z-50">
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

    </header>
  );
};
