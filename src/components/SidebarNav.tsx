import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  Boxes,
  Building,
  PlaneTakeoff,
  BookOpen,
  Landmark,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  RefreshCw,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allowedTabs: string[];
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  allowedTabs,
  isCollapsed,
  setIsCollapsed
}) => {
  // Navigation items strictly ordered as requested:
  // 1. Dashboard Utama
  // 2. Tagihan & Piutang Jamaah
  // 3. Master Paket & Harga
  // 4. Vendor & HPP Operasional
  // 5. Kloter & Pengakuan Pendapatan
  // 6. Jurnal Umum & Buku Besar
  // 7. Chart of Accounts (COA)
  // 8. Laporan Keuangan & Margin
  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'jamaah', label: 'Tagihan & Piutang Jamaah', icon: Users },
    { id: 'packages', label: 'Master Paket & Harga', icon: Boxes },
    { id: 'mitra', label: 'Manajemen Mitra & Komisi', icon: UserCheck },
    { id: 'vendors', label: 'Vendor & HPP Operasional', icon: Building },
    { id: 'kloter', label: 'Kloter & Pengakuan Pendapatan', icon: PlaneTakeoff },
    { id: 'journals', label: 'Jurnal Umum & Buku Besar', icon: BookOpen },
    { id: 'coa', label: 'Chart of Accounts (COA)', icon: Landmark },
    { id: 'reports', label: 'Laporan Keuangan & Margin', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan & Backup Data', icon: Settings }
  ];

  const visibleNavItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

  return (
    <aside
      className={`bg-[#0F172A] text-slate-100 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out sticky top-0 h-screen z-40 ${
        isCollapsed ? 'w-18 md:w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Sidebar Header / Branding */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-sm bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shrink-0 text-xs font-mono">
              KA
            </div>
            {!isCollapsed && (
              <div className="truncate transition-opacity duration-300">
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-bold text-sm text-white tracking-tight truncate">
                    Khadim Alharamain
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Sistem Informasi Keuangan
                </p>
              </div>
            )}
          </div>

          {/* Minimize Toggle Button on Header */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Kecilkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Nav List */}
        <div className="p-3 space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full py-2.5 px-3 rounded-sm text-xs font-medium flex items-center transition-all ${
                    isCollapsed ? 'justify-center' : 'justify-start space-x-3'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md ring-1 ring-blue-500/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>

                {/* Tooltip on Collapsed Hover */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-sm shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 border border-slate-700 flex items-center space-x-1">
                    <span>{item.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer / Expand Toggle */}
      <div className="p-3 border-t border-slate-800">
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full py-2.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors group relative"
            title="Perluas Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-sm opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 border border-slate-700">
              Perluas Menu
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="font-mono text-[10px] uppercase text-slate-500">v2.5 ERP</span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs font-medium py-1 px-2 rounded hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sembunyikan</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
