import React, { useState, useEffect } from 'react';
import { UserRole, ChartOfAccount, JamaahRegistration, DepartureKloter, TravelPackage, Jamaah, JournalEntry, Vendor, VendorBill } from './types';
import { getRolePermissions } from './utils/rbac';
import { HeaderNavbar } from './components/HeaderNavbar';
import { DashboardView } from './components/DashboardView';
import { JamaahBillingView } from './components/JamaahBillingView';
import { KloterManagementView } from './components/KloterManagementView';
import { JournalLedgerView } from './components/JournalLedgerView';
import { COAView } from './components/COAView';
import { VendorPayablesView } from './components/VendorPayablesView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { AccessRestrictedNotice } from './components/AccessRestrictedNotice';
import {
  LayoutDashboard,
  Users,
  PlaneTakeoff,
  BookOpen,
  Landmark,
  Building,
  BarChart3,
  Loader2
} from 'lucide-react';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('ACCOUNTANT');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const rolePerm = getRolePermissions(userRole);

  // Auto redirect if activeTab is hidden for current role
  useEffect(() => {
    if (!rolePerm.allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab, rolePerm.allowedTabs]);

  // Core Global ERP Data States
  const [coaList, setCoaList] = useState<ChartOfAccount[]>([]);
  const [registrations, setRegistrations] = useState<JamaahRegistration[]>([]);
  const [kloters, setKloters] = useState<DepartureKloter[]>([]);
  const [packageList, setPackageList] = useState<TravelPackage[]>([]);
  const [jamaahList, setJamaahList] = useState<Jamaah[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);

  // Modal Open Trigger States for Quick Actions
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isNewRegistrationOpen, setIsNewRegistrationOpen] = useState(false);

  // Initial Fetch Data from Backend Express Server
  useEffect(() => {
    fetchERPData();
  }, []);

  const fetchERPData = async () => {
    setIsLoading(true);
    try {
      const [coaRes, regRes, kltRes, pkgRes, jamRes, jvRes, vndRes] = await Promise.all([
        fetch('/api/coa'),
        fetch('/api/registrations'),
        fetch('/api/kloters'),
        fetch('/api/packages'),
        fetch('/api/jamaah'),
        fetch('/api/journals'),
        fetch('/api/vendors')
      ]);

      const coaData = await coaRes.json();
      const regData = await regRes.json();
      const kltData = await kltRes.json();
      const pkgData = await pkgRes.json();
      const jamData = await jamRes.json();
      const jvData = await jvRes.json();
      const vndData = await vndRes.json();

      setCoaList(coaData || []);
      setRegistrations(regData || []);
      setKloters(kltData || []);
      setPackageList(pkgData || []);
      setJamaahList(jamData || []);
      setJournals(jvData || []);
      setVendors(vndData?.vendors || []);
      setVendorBills(vndData?.bills || []);
    } catch (err) {
      console.error('Error syncing ERP data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'jamaah', label: 'Tagihan & Piutang Jamaah', icon: Users },
    { id: 'kloter', label: 'Kloter & Pengakuan Pendapatan', icon: PlaneTakeoff },
    { id: 'journals', label: 'Jurnal Umum & Buku Besar', icon: BookOpen },
    { id: 'coa', label: 'Chart of Accounts (COA)', icon: Landmark },
    { id: 'vendors', label: 'Vendor & HPP Operasional', icon: Building },
    { id: 'reports', label: 'Laporan Keuangan & Margin', icon: BarChart3 },
  ];

  // Filter visible tabs based on current role permissions matrix
  const visibleNavItems = allNavItems.filter(item => rolePerm.allowedTabs.includes(item.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      
      {/* Navigation Header */}
      <HeaderNavbar
        currentRole={userRole}
        setCurrentRole={setUserRole}
        onRefreshData={fetchERPData}
        isLoading={isLoading}
      />

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Access Restricted Banner if in Read-Only Mode */}
        {rolePerm.isReadOnly && (
          <AccessRestrictedNotice currentRole={userRole} />
        )}

        {/* Module Tab Navigation Bar */}
        <div className="bg-[#0F172A] rounded-sm p-1.5 border border-slate-800 shadow-sm flex items-center space-x-1 overflow-x-auto scrollbar-none">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-sm text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab View Content Rendering */}
        {isLoading && coaList.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Memuat Mesin Akuntansi & Data ERP...</p>
          </div>
        ) : (
          <main className="transition-all duration-300">
            {activeTab === 'dashboard' && (
              <DashboardView
                coaList={coaList}
                registrations={registrations}
                kloters={kloters}
                journals={journals}
                userRole={userRole}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenNewPayment={() => {
                  setActiveTab('jamaah');
                  setIsNewPaymentOpen(true);
                }}
                onOpenNewRegistration={() => {
                  setActiveTab('jamaah');
                  setIsNewRegistrationOpen(true);
                }}
              />
            )}

            {activeTab === 'jamaah' && (
              <JamaahBillingView
                registrations={registrations}
                jamaahList={jamaahList}
                packageList={packageList}
                kloterList={kloters}
                coaList={coaList}
                userRole={userRole}
                onRefreshData={fetchERPData}
                isNewPaymentOpen={isNewPaymentOpen}
                setIsNewPaymentOpen={setIsNewPaymentOpen}
                isNewRegistrationOpen={isNewRegistrationOpen}
                setIsNewRegistrationOpen={setIsNewRegistrationOpen}
              />
            )}

            {activeTab === 'kloter' && (
              <KloterManagementView
                kloters={kloters}
                packageList={packageList}
                registrations={registrations}
                userRole={userRole}
                onRefreshData={fetchERPData}
              />
            )}

            {activeTab === 'journals' && (
              <JournalLedgerView
                journals={journals}
                coaList={coaList}
                userRole={userRole}
              />
            )}

            {activeTab === 'coa' && (
              <COAView
                coaList={coaList}
                userRole={userRole}
                onRefreshData={fetchERPData}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorPayablesView
                vendors={vendors}
                vendorBills={vendorBills}
                kloters={kloters}
                coaList={coaList}
                userRole={userRole}
                onRefreshData={fetchERPData}
              />
            )}

            {activeTab === 'reports' && (
              <FinancialReportsView
                coaList={coaList}
                packageList={packageList}
                kloters={kloters}
                userRole={userRole}
              />
            )}
          </main>
        )}

      </div>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
        <p>© 2026 PT. Khadim Alharamain — Sistem Informasi Keuangan Travel Umrah & Haji Plus.</p>
      </footer>

    </div>
  );
}
