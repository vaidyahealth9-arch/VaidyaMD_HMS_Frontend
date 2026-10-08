'use client';

import React, { useEffect, useState } from 'react';
import {
  adminApi,
  authApi,
  billingApi,
  ipdApi,
  templatesApi,
  treatmentCyclesApi,
  protocolsApi,
  permissionProfilesApi,
  pharmacyApi,
  limsApi,
  cosgynApi,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Building2,
  Users,
  IndianRupee,
  BedDouble,
  Dna,
  FileText,
  FlaskConical,
  Pill,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';

import {
  VAIDYAMD_ROLES,
  HospitalSettingsTab,
  StaffSettingsTab,
  TariffsSettingsTab,
  IpdSettingsTab,
  CyclesSettingsTab,
  TemplatesSettingsTab,
  LabsSettingsTab,
  PharmacySettingsTab,
  ProfilesSettingsTab,
  CsvHubSettingsTab,
} from '@/components/settings';

export default function SettingsMasterPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'admin' || (user?.role as any)?.value === 'admin';

  // Navigation rail collapse state
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'hospital' | 'staff' | 'tariffs' | 'ipd' | 'cycles' | 'templates' | 'labs' | 'pharmacy' | 'profiles' | 'csv_hub'
  >('hospital');

  // Master Data States
  const [hospitalProfile, setHospitalProfile] = useState<any>(null);
  const [hospitalBranches, setHospitalBranches] = useState<any[]>([]);
  const [liveReceiptHeader, setLiveReceiptHeader] = useState<any>({
    title: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    cin: '',
    art_reg_number: '',
    cea_reg_number: '',
    header_bold_color: '#4A2E2B',
    header_small_color: '#C29B7F',
    pad_header_height_mm: 35,
    pad_footer_height_mm: 25,
    watermark_url: '',
    watermark_opacity: 0.08,
    disclaimer: 'Valid for statutory compliance and official healthcare documentation.',
  });

  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([]);
  const [treatmentPackages, setTreatmentPackages] = useState<any[]>([]);
  const [cosgynTreatments, setCosgynTreatments] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [cycleTypes, setCycleTypes] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [clinicalTemplates, setClinicalTemplates] = useState<any[]>([]);
  const [limsTests, setLimsTests] = useState<any[]>([]);
  const [cryoTankMap, setCryoTankMap] = useState<any>(null);
  const [pharmacyVendors, setPharmacyVendors] = useState<any[]>([]);
  const [pharmacyBatches, setPharmacyBatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [csvDomains, setCsvDomains] = useState<any[]>([]);

  // Reload all master datasets
  const loadInitialData = async () => {
    // 1. Hospital Profile & Multi-Branch
    adminApi
      .getHospitalProfile()
      .then((data) => {
        setHospitalProfile(data.hospital);
        const brs = data.branches || [];
        setHospitalBranches(brs);
        if (brs.length > 0) {
          const mainBr = brs.find((b: any) => b.is_main_branch) || brs[0];
          setLiveReceiptHeader((prev: any) => ({ ...prev, ...(mainBr.receipt_header || {}) }));
        }
      })
      .catch(() => {});

    // 2. Staff Users
    authApi
      .listUsers({ include_inactive: true })
      .then((res: any) => setStaffUsers(Array.isArray(res) ? res : []))
      .catch(() => {});

    // 3. Billing Service Catalog & Packages
    billingApi
      .getServiceCatalog()
      .then((res: any) => setServiceCatalog(Array.isArray(res) ? res : []))
      .catch(() => {});
    billingApi
      .listPackages()
      .then((res: any) => setTreatmentPackages(Array.isArray(res) ? res : []))
      .catch(() => {});
    cosgynApi
      .getTreatments()
      .then((res: any) => setCosgynTreatments(Array.isArray(res) ? res : []))
      .catch(() => {});

    // 4. IPD Wards & Beds
    Promise.all([ipdApi.listWards(), ipdApi.listBeds()])
      .then(([w, b]: any) => {
        setWards(Array.isArray(w) ? w : []);
        setBeds(Array.isArray(b) ? b : []);
      })
      .catch(() => {});

    // 5. ART Cycle Types & Protocols
    treatmentCyclesApi
      .listTypes({ include_inactive: true })
      .then((types: any) => setCycleTypes(Array.isArray(types) ? types : []))
      .catch(() => {});
    protocolsApi
      .list({ include_inactive: true })
      .then((p: any) => setProtocols(Array.isArray(p) ? p : []))
      .catch(() => {});

    // 6. Clinical & Rx Templates
    templatesApi
      .list()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.templates || [];
        setClinicalTemplates(list);
      })
      .catch(() => {});

    // 7. LIMS & Cryo
    templatesApi
      .list('lims')
      .then((res: any) => setLimsTests(Array.isArray(res) ? res : []))
      .catch(() => {});

    // 8. Pharmacy Master Vendors & Batches
    pharmacyApi
      .listVendors()
      .then((v: any) => setPharmacyVendors(Array.isArray(v) ? v : []))
      .catch(() => {});
    pharmacyApi
      .listBatches({})
      .then((res: any) => {
        const items = Array.isArray(res) ? res : res?.batches || [];
        setPharmacyBatches(items);
      })
      .catch(() => {});

    // 9. Role Permissions Profiles
    permissionProfilesApi
      .list()
      .then((res: any) => setProfiles(Array.isArray(res) ? res : []))
      .catch(() => {});

    // 10. In-App CSV Domains
    adminApi
      .listDomains()
      .then((res: any) => {
        setCsvDomains(res.domains || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // -------------------------------------------------------------
  // RBAC ACCESS GUARD SCREEN
  // -------------------------------------------------------------
  if (!isSuperAdmin) {
    return (
      <PageLayout>
        <div className="w-full h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Administrator Access Required</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            The System Settings & Hospital Master suite contains core statutory configurations and is restricted to Administrators and Medical Directors.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </PageLayout>
    );
  }

  // Navigation Items with dynamic counter badges
  const navItems = [
    {
      id: 'hospital',
      label: '1. Hospital Legal & Branding',
      icon: Building2,
      badge: hospitalBranches.length ? `${hospitalBranches.length} Branch${hospitalBranches.length > 1 ? 'es' : ''}` : 'Legal',
    },
    { id: 'staff', label: '2. Staff User Roster', icon: Users, badge: `${staffUsers.length}` },
    {
      id: 'tariffs',
      label: '3. Tariffs & Packages',
      icon: IndianRupee,
      badge: `${serviceCatalog.length + treatmentPackages.length + cosgynTreatments.length}`,
    },
    { id: 'ipd', label: '4. IPD Wards & Beds', icon: BedDouble, badge: `${beds.length}` },
    { id: 'cycles', label: '5. ART Cycles & Protocols', icon: Dna, badge: `${cycleTypes.length}` },
    { id: 'templates', label: '6. Clinical & Rx Templates', icon: FileText, badge: `${clinicalTemplates.length}` },
    { id: 'labs', label: '7. Labs & Cryobank', icon: FlaskConical, badge: `${limsTests.length || 'LIMS'}` },
    { id: 'pharmacy', label: '8. Pharmacy Master', icon: Pill, badge: `${pharmacyVendors.length}` },
    { id: 'profiles', label: '9. Role Permissions', icon: ShieldCheck, badge: `${VAIDYAMD_ROLES.length}` },
    { id: 'csv_hub', label: '10. In-App CSV Hub', icon: FileSpreadsheet, badge: `${csvDomains.length || 14}` },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Standardized Header */}
        <PageHeader
          icon={Settings}
          title="System Settings & Masters"
          titleBadge={
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
              Multi-Branch HMS
            </Badge>
          }
          subtitle="Configure hospital legal identity, branding, staff rosters, tariffs, IPD bedboard, ART cycle templates, and data hub."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={loadInitialData}
              className="gap-1.5 text-xs text-slate-700 bg-white shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reload All Masters
            </Button>
          }
        />

        {/* 2-Column Responsive Layout: Collapsible Left-Side Settings Rail + Main Panel */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Collapsible Settings Rail */}
          <aside
            className={`transition-all duration-200 shrink-0 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs sticky top-4 z-10 ${
              isNavCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-2">
              {!isNavCollapsed && (
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Master Configuration
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 mx-auto"
                title={isNavCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
              >
                {isNavCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((t) => {
                const TabIcon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    title={isNavCollapsed ? t.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    } ${isNavCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TabIcon className="w-4 h-4 shrink-0" />
                      {!isNavCollapsed && <span className="truncate">{t.label}</span>}
                    </div>
                    {!isNavCollapsed && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                          isActive ? 'bg-white/20 text-white font-normal' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Content Area for Selected Tab */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {activeTab === 'hospital' && (
              <HospitalSettingsTab
                hospitalProfile={hospitalProfile}
                setHospitalProfile={setHospitalProfile}
                hospitalBranches={hospitalBranches}
                setHospitalBranches={setHospitalBranches}
                liveReceiptHeader={liveReceiptHeader}
                setLiveReceiptHeader={setLiveReceiptHeader}
              />
            )}

            {activeTab === 'staff' && (
              <StaffSettingsTab
                staffUsers={staffUsers}
                setStaffUsers={setStaffUsers}
                hospitalBranches={hospitalBranches}
              />
            )}

            {activeTab === 'tariffs' && (
              <TariffsSettingsTab
                serviceCatalog={serviceCatalog}
                setServiceCatalog={setServiceCatalog}
                treatmentPackages={treatmentPackages}
                setTreatmentPackages={setTreatmentPackages}
                cosgynTreatments={cosgynTreatments}
                setCosgynTreatments={setCosgynTreatments}
                hospitalBranches={hospitalBranches}
              />
            )}

            {activeTab === 'ipd' && (
              <IpdSettingsTab
                wards={wards}
                setWards={setWards}
                beds={beds}
                setBeds={setBeds}
                hospitalBranches={hospitalBranches}
              />
            )}

            {activeTab === 'cycles' && (
              <CyclesSettingsTab
                cycleTypes={cycleTypes}
                setCycleTypes={setCycleTypes}
                protocols={protocols}
                setProtocols={setProtocols}
              />
            )}

            {activeTab === 'templates' && (
              <TemplatesSettingsTab
                clinicalTemplates={clinicalTemplates}
                setClinicalTemplates={setClinicalTemplates}
              />
            )}

            {activeTab === 'labs' && (
              <LabsSettingsTab
                limsTests={limsTests}
                setLimsTests={setLimsTests}
                cryoTankMap={cryoTankMap}
                setCryoTankMap={setCryoTankMap}
              />
            )}

            {activeTab === 'pharmacy' && (
              <PharmacySettingsTab
                pharmacyVendors={pharmacyVendors}
                setPharmacyVendors={setPharmacyVendors}
                pharmacyBatches={pharmacyBatches}
                setPharmacyBatches={setPharmacyBatches}
                hospitalBranches={hospitalBranches}
              />
            )}

            {activeTab === 'profiles' && (
              <ProfilesSettingsTab
                profiles={profiles}
                setProfiles={setProfiles}
              />
            )}

            {activeTab === 'csv_hub' && (
              <CsvHubSettingsTab
                csvDomains={csvDomains}
                onReloadMasters={loadInitialData}
              />
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
