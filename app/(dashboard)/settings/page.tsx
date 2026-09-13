'use client';

import React, { useEffect, useState } from 'react';
import {
  permissionProfilesApi,
  protocolsApi,
  branchesApi,
  ipdApi,
  templatesApi,
  treatmentCyclesApi,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import {
  Lock,
  ShieldCheck,
  Pill,
  Building2,
  Check,
  Save,
  Phone,
  Plus,
  X,
  BedDouble,
  FileText,
  Dna,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Code,
  DollarSign,
  Users,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const menuKeys = [
  { key: 'patients', label: 'Patient Directory' },
  { key: 'patient_register', label: 'Patient / Couple Registration' },
  { key: 'patient_360', label: 'Couple 360 EMR Portal' },
  { key: 'treatment_cycles', label: 'Treatment Cycles & Protocol Engine' },
  { key: 'ivf_lab', label: 'IVF Lab' },
  { key: 'cryopreservation', label: 'Cryobank Tank Coordinates' },
  { key: 'billing', label: 'Billing & Invoices' },
  { key: 'wallet', label: 'Patient Advance Wallet' },
  { key: 'analytics', label: 'Analytics & Financial Reports' },
  { key: 'pharmacy', label: 'Pharmacy Dispensary' },
  { key: 'ipd', label: 'IPD Bedboard & Nursing' },
];

export default function SettingsMasterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ipd' | 'templates' | 'cycles' | 'profiles' | 'protocols' | 'branches'>('ipd');

  // ==========================================
  // 1. IPD WARDS & BEDS STATE
  // ==========================================
  const [wards, setWards] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [ipdLoading, setIpdLoading] = useState(false);

  // Ward Modal
  const [showWardModal, setShowWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState<any>(null);
  const [wardFormName, setWardFormName] = useState('');
  const [wardFormCode, setWardFormCode] = useState('');
  const [wardFormDept, setWardFormDept] = useState('General IPD');
  const [wardFormRate, setWardFormRate] = useState<number>(2500);
  const [wardFormBeds, setWardFormBeds] = useState<number>(6);

  // Bed Modal
  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [bedFormWardId, setBedFormWardId] = useState('');
  const [bedFormNumber, setBedFormNumber] = useState('');
  const [bedFormType, setBedFormType] = useState('Standard');
  const [bedFormRate, setBedFormRate] = useState<number>(2500);
  const [bedFormStatus, setBedFormStatus] = useState('Vacant');

  // ==========================================
  // 2. CLINICAL TEMPLATES STATE
  // ==========================================
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilterPlugin, setTemplateFilterPlugin] = useState('all');
  const [templateViewMode, setTemplateViewMode] = useState<'preview' | 'json'>('preview');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateJsonText, setTemplateJsonText] = useState('');
  const [templateJsonError, setTemplateJsonError] = useState<string | null>(null);
  const [parsedSchema, setParsedSchema] = useState<any>(null);
  const [previewRole, setPreviewRole] = useState<string>('doctor');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateKey, setNewTemplateKey] = useState('');
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplatePlugin, setNewTemplatePlugin] = useState('fertility');

  // ==========================================
  // 3. TREATMENT CYCLE TYPES STATE
  // ==========================================
  const [cycleTypes, setCycleTypes] = useState<any[]>([]);
  const [cycleSearch, setCycleSearch] = useState('');
  const [cycleCategoryFilter, setCycleCategoryFilter] = useState('all');

  // ==========================================
  // 4. PERMISSION PROFILES STATE
  // ==========================================
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ==========================================
  // 5. PROTOCOL LIBRARY STATE
  // ==========================================
  const [protocols, setProtocols] = useState<any[]>([]);
  const [showAddProtoModal, setShowAddProtoModal] = useState(false);
  const [newProtoName, setNewProtoName] = useState('');
  const [newProtoCategory, setNewProtoCategory] = useState('stimulation');
  const [newProtoDesc, setNewProtoDesc] = useState('');

  // ==========================================
  // 6. BRANCHES STATE
  // ==========================================
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchIps, setNewBranchIps] = useState('127.0.0.1, 192.168.1.0/24');

  // Load all initial data
  const loadInitialData = async () => {
    // 1. IPD Wards and Beds
    loadIpdData();

    // 2. Templates
    templatesApi.list()
      .then((t: any) => {
        const list = Array.isArray(t) ? t : [];
        setTemplates(list);
        if (list.length > 0 && !selectedTemplate) {
          handleSelectTemplate(list[0]);
        }
      })
      .catch(() => {});

    // 3. Treatment Cycle Types
    treatmentCyclesApi.listTypes()
      .then((ct: any) => setCycleTypes(Array.isArray(ct) ? ct : []))
      .catch(() => {});

    // 4. Permission Profiles
    permissionProfilesApi.list()
      .then((p: any) => {
        setProfiles(p || []);
        if (p && p.length > 0 && !selectedProfile) {
          setSelectedProfile(p[0]);
        }
      })
      .catch(() => {});

    // 5. Protocols
    protocolsApi.list()
      .then((pr: any) => setProtocols(pr || []))
      .catch(() => {});

    // 6. Branches
    branchesApi.list()
      .then((b: any) => setBranches(b || []))
      .catch(() => {});
  };

  const loadIpdData = () => {
    setIpdLoading(true);
    Promise.all([
      ipdApi.listWards(),
      ipdApi.listBeds(),
    ])
      .then(([w, b]: any) => {
        setWards(Array.isArray(w) ? w : []);
        setBeds(Array.isArray(b) ? b : []);
      })
      .catch(() => {})
      .finally(() => setIpdLoading(false));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // --- IPD Ward Handlers ---
  const handleOpenCreateWard = () => {
    setEditingWard(null);
    setWardFormName('');
    setWardFormCode('');
    setWardFormDept('General IPD');
    setWardFormRate(2500);
    setWardFormBeds(6);
    setShowWardModal(true);
  };

  const handleOpenEditWard = (ward: any) => {
    setEditingWard(ward);
    setWardFormName(ward.name);
    setWardFormCode(ward.code);
    setWardFormDept(ward.department);
    setWardFormRate(ward.base_charge_per_day);
    setWardFormBeds(ward.total_beds);
    setShowWardModal(true);
  };

  const handleSaveWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWard) {
        await ipdApi.updateWard(editingWard.id, {
          name: wardFormName,
          department: wardFormDept,
          base_charge_per_day: wardFormRate,
        });
        alert('Ward updated successfully!');
      } else {
        await ipdApi.createWard({
          name: wardFormName,
          code: wardFormCode.toUpperCase(),
          department: wardFormDept,
          base_charge_per_day: wardFormRate,
          total_beds: wardFormBeds,
        });
        alert('Ward created with physical beds!');
      }
      setShowWardModal(false);
      loadIpdData();
    } catch (err: any) {
      alert(err.message || 'Failed to save ward');
    }
  };

  const handleDeleteWard = async (wardId: string) => {
    if (!confirm('Are you sure you want to deactivate this ward?')) return;
    try {
      await ipdApi.deleteWard(wardId);
      alert('Ward deactivated successfully.');
      loadIpdData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate ward. Ensure no active admissions exist.');
    }
  };

  // --- IPD Bed Handlers ---
  const handleOpenCreateBed = (wardId?: string) => {
    setEditingBed(null);
    const targetWard = wardId || (wards.length > 0 ? wards[0].id : '');
    const foundWard = wards.find((w) => w.id === targetWard);
    setBedFormWardId(targetWard);
    setBedFormNumber(`${foundWard?.code || 'BED'}-${(beds.length + 1).toString().padStart(2, '0')}`);
    setBedFormType('Standard');
    setBedFormRate(foundWard?.base_charge_per_day || 2500);
    setBedFormStatus('Vacant');
    setShowBedModal(true);
  };

  const handleOpenEditBed = (bed: any) => {
    setEditingBed(bed);
    setBedFormWardId(bed.ward_id);
    setBedFormNumber(bed.bed_number);
    setBedFormType(bed.bed_type || 'Standard');
    setBedFormRate(bed.daily_rate);
    setBedFormStatus(bed.status);
    setShowBedModal(true);
  };

  const handleSaveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBed) {
        await ipdApi.updateBed(editingBed.id, {
          bed_number: bedFormNumber,
          bed_type: bedFormType,
          daily_rate: bedFormRate,
          status: bedFormStatus,
        });
        alert('Bed details updated!');
      } else {
        await ipdApi.createBed({
          ward_id: bedFormWardId,
          bed_number: bedFormNumber,
          bed_type: bedFormType,
          daily_rate: bedFormRate,
          status: bedFormStatus,
        });
        alert('New bed added to ward!');
      }
      setShowBedModal(false);
      loadIpdData();
    } catch (err: any) {
      alert(err.message || 'Failed to save bed');
    }
  };

  const handleDeleteBed = async (bed: any) => {
    if (bed.status === 'Occupied' || bed.current_admission) {
      alert('Cannot delete an occupied bed. Please discharge or transfer the admitted patient first.');
      return;
    }
    if (!confirm(`Delete bed ${bed.bed_number}?`)) return;
    try {
      await ipdApi.deleteBed(bed.id);
      alert('Bed deleted successfully.');
      loadIpdData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bed');
    }
  };

  // --- Template Handlers ---
  const handleSelectTemplate = (temp: any) => {
    setSelectedTemplate(temp);
    setTemplateTitle(temp.title);
    setTemplateDesc(temp.description || '');
    const schemaStr = JSON.stringify(temp.schema_json, null, 2);
    setTemplateJsonText(schemaStr);
    setParsedSchema(temp.schema_json);
    setTemplateJsonError(null);
  };

  const handleJsonChange = (text: string) => {
    setTemplateJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        setTemplateJsonError('Schema error: Root object must have a "sections" array.');
        return;
      }
      setParsedSchema(parsed);
      setTemplateJsonError(null);
    } catch (e: any) {
      setTemplateJsonError(`JSON Syntax Error: ${e.message}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (templateJsonError || !selectedTemplate || !user) return;
    setIsSavingTemplate(true);
    try {
      const updated: any = await templatesApi.update(selectedTemplate.id, {
        title: templateTitle,
        description: templateDesc,
        schema_json: parsedSchema,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTemplate(updated);
      alert('Clinical Template schema saved and published to EMR successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to save template. Verify JSON schema.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleCreateNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTemplateKey) return;
    const baseSchema = {
      plugin_id: newTemplatePlugin,
      record_type: newTemplateKey.toLowerCase().replace(/\s+/g, '_'),
      schema_version: '1.0',
      title: newTemplateTitle || 'New Clinical Form',
      description: 'Custom notes and clinical record fields.',
      sections: [
        {
          id: 'clinical_notes_sec',
          title: 'General Assessment',
          fields: [
            {
              id: 'chief_complaint',
              label: 'Chief Complaint / Clinical Notes',
              type: 'textarea',
              required: true,
              role_access: ['doctor', 'nurse', 'admin'],
            },
            {
              id: 'clinical_impression',
              label: 'Impression & Diagnosis',
              type: 'text',
              required: false,
              role_access: ['doctor', 'admin'],
            },
          ],
        },
      ],
    };

    try {
      const created = await templatesApi.create({
        plugin_id: newTemplatePlugin,
        record_type: newTemplateKey.toLowerCase().replace(/\s+/g, '_'),
        title: newTemplateTitle || 'New Clinical Form',
        description: 'Custom notes and clinical record fields.',
        schema_json: baseSchema,
        created_by: user.id,
      });
      setTemplates([...templates, created]);
      handleSelectTemplate(created);
      setShowNewTemplateModal(false);
      setNewTemplateKey('');
      setNewTemplateTitle('');
      alert('New clinical template created!');
    } catch (e: any) {
      alert(e.message || 'Failed to create template. Ensure record_type key is unique.');
    }
  };

  // --- Profile Handlers ---
  const handleTogglePermission = (key: string) => {
    if (!selectedProfile) return;
    const current = selectedProfile.menu_permissions || {};
    setSelectedProfile({
      ...selectedProfile,
      menu_permissions: {
        ...current,
        [key]: !current[key],
      },
    });
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;
    setIsSavingProfile(true);
    try {
      await permissionProfilesApi.update(selectedProfile.id, {
        name: selectedProfile.name,
        description: selectedProfile.description,
        menu_permissions: selectedProfile.menu_permissions,
      });
      alert('Permission profile updated successfully!');
      permissionProfilesApi.list().then((p: any) => setProfiles(p || []));
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Protocol Handlers ---
  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await protocolsApi.create({
        name: newProtoName,
        category: newProtoCategory,
        description: newProtoDesc,
        created_by: user.id,
        rules: [
          {
            drug_name: 'Inj. Recagon / Gonal-F',
            dose: '225 IU',
            route: 'SC',
            frequency: 'OD',
            sentinel_anchor: 'stim_start',
            day_start_offset: 1,
            day_end_offset: 10,
            instructions: 'Subcutaneous injection at 20:00 hrs',
            sort_order: 1,
          },
        ],
      });
      setShowAddProtoModal(false);
      setNewProtoName('');
      setNewProtoDesc('');
      protocolsApi.list().then((pr: any) => setProtocols(pr || []));
      alert('Protocol template created successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to create protocol');
    }
  };

  // --- Branch Handlers ---
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ipList = newBranchIps.split(',').map((s) => s.trim()).filter(Boolean);
      await branchesApi.create({
        name: newBranchName,
        code: newBranchCode,
        address: newBranchAddress,
        phone: newBranchPhone,
        ip_whitelist: ipList,
        is_main_branch: branches.length === 0,
      });
      setShowAddBranchModal(false);
      setNewBranchName('');
      setNewBranchCode('');
      setNewBranchAddress('');
      setNewBranchPhone('');
      branchesApi.list().then((b: any) => setBranches(b || []));
      alert('Branch created successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to create branch');
    }
  };

  // Non-admin safeguard
  if (user && user.role !== 'admin') {
    return (
      <div className="p-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
          <Lock className="w-5 h-5 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Hospital Master Settings, Clinical Template schemas, and IPD Bed configurations are restricted to Administrator accounts.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
        >
          ← Return to Dashboard
        </a>
      </div>
    );
  }

  // Filtered IPD beds
  const displayedBeds = selectedWardFilter === 'all'
    ? beds
    : beds.filter((b) => b.ward_id === selectedWardFilter);

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.record_type?.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesPlugin =
      templateFilterPlugin === 'all' || t.plugin_id === templateFilterPlugin;
    return matchesSearch && matchesPlugin;
  });

  // Filtered cycle types
  const filteredCycleTypes = cycleTypes.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(cycleSearch.toLowerCase()) ||
      c.code?.toLowerCase().includes(cycleSearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(cycleSearch.toLowerCase());
    const matchesCat =
      cycleCategoryFilter === 'all' ||
      c.category?.toLowerCase() === cycleCategoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // IPD summary metrics
  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter((b) => b.status === 'Occupied').length;
  const vacantBedsCount = beds.filter((b) => b.status === 'Vacant').length;
  const occupancyPercent = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Masters & Settings</h1>
          <p className="text-slate-500 text-xs mt-1">
            Configure Clinical Templates, IPD Wards & Beds, Treatment Cycle Types, Role Matrix, and Branch Infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInitialData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Masters
          </button>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
        {[
          { id: 'ipd', label: 'IPD Wards & Beds', icon: BedDouble, count: `${wards.length} Wards · ${beds.length} Beds` },
          { id: 'templates', label: 'Clinical Templates', icon: FileText, count: `${templates.length} Forms` },
          { id: 'cycles', label: 'Treatment Cycle Types', icon: Dna, count: `${cycleTypes.length} Cycles` },
          { id: 'profiles', label: 'Role Permissions', icon: ShieldCheck, count: `${profiles.length} Roles` },
          { id: 'protocols', label: 'Stimulation Protocols', icon: Pill, count: `${protocols.length} Protocols` },
          { id: 'branches', label: 'Clinic Branches & IPs', icon: Building2, count: `${branches.length} Branches` },
        ].map((t) => {
          const TabIcon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* === TAB 1: IPD WARDS & BEDS MASTER === */}
      {/* ========================================== */}
      {activeTab === 'ipd' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Hospital Wards</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{wards.length}</span>
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Physical Beds</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{totalBedsCount}</span>
                <BedDouble className="w-5 h-5 text-sky-500" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vacant & Ready</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600">{vacantBedsCount}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bed Occupancy</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{occupancyPercent}%</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {occupiedBedsCount} Occupied
                </span>
              </div>
            </div>
          </div>

          {/* Wards Header & Cards */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Hospital Wards</h3>
                <p className="text-xs text-slate-500">Configure ward departments, base bed rates, and capacities</p>
              </div>
              <button
                onClick={handleOpenCreateWard}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Ward
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wards.map((w) => {
                const wardBeds = beds.filter((b) => b.ward_id === w.id);
                const wardOccupied = wardBeds.filter((b) => b.status === 'Occupied').length;
                return (
                  <div
                    key={w.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded font-bold">
                            {w.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{w.department}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditWard(w)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-white transition-colors"
                          title="Edit Ward"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWard(w.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-white transition-colors"
                          title="Deactivate Ward"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Base Rate / Day</span>
                        <span className="font-bold text-slate-900">{formatCurrency(w.base_charge_per_day)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Beds & Occupancy</span>
                        <span className="font-semibold text-slate-800">
                          {wardBeds.length} beds ({wardOccupied} occupied)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beds Management Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Physical Beds Management</h3>
                <p className="text-xs text-slate-500">Configure bed labels, categories (Standard/ICU/Deluxe), and individual daily rates</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value)}
                  className="vmd-input text-xs h-9 py-1"
                >
                  <option value="all">Filter: All Wards ({beds.length} beds)</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleOpenCreateBed(selectedWardFilter !== 'all' ? selectedWardFilter : undefined)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white text-xs font-semibold rounded-md shadow-xs transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add Bed
                </button>
              </div>
            </div>

            {/* Beds Grid / Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Bed Number</th>
                    <th className="py-2.5 px-3">Ward</th>
                    <th className="py-2.5 px-3">Bed Type</th>
                    <th className="py-2.5 px-3">Daily Tariff</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Current Patient</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedBeds.map((bed) => {
                    const bedWard = wards.find((w) => w.id === bed.ward_id);
                    return (
                      <tr key={bed.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                          {bed.bed_number}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {bedWard?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                            {bed.bed_type || 'Standard'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {formatCurrency(bed.daily_rate)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              bed.status === 'Vacant'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bed.status === 'Occupied'
                                ? 'bg-amber-100 text-amber-800'
                                : bed.status === 'Cleaning'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {bed.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {bed.current_admission ? (
                            <div>
                              <span className="font-semibold block">{bed.current_admission.patient_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{bed.current_admission.patient_mrn}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditBed(bed)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                              title="Edit Bed"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBed(bed)}
                              disabled={bed.status === 'Occupied'}
                              className={`p-1.5 rounded transition-colors ${
                                bed.status === 'Occupied'
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                              title={bed.status === 'Occupied' ? 'Cannot delete occupied bed' : 'Delete Bed'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedBeds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No beds found for selected ward.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* === TAB 2: CLINICAL TEMPLATES MASTER === */}
      {/* ========================================== */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Clinical Form Schemas</h3>
                <p className="text-[11px] text-slate-500">Dynamic EMR templates</p>
              </div>
              <button
                onClick={() => setShowNewTemplateModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[rgb(var(--clr-primary))] text-white text-xs font-semibold rounded hover:bg-[rgb(var(--clr-primary)/0.9)] shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Form
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search template title or key..."
                  className="vmd-input text-xs pl-8 h-8"
                />
              </div>
              <div className="flex gap-1.5">
                {['all', 'fertility', 'core'].map((plugin) => (
                  <button
                    key={plugin}
                    onClick={() => setTemplateFilterPlugin(plugin)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                      templateFilterPlugin === plugin
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {plugin}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List Items */}
            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`w-full p-3 rounded-lg text-left transition-all border ${
                    selectedTemplate?.id === t.id
                      ? 'bg-[rgb(var(--clr-primary)/0.08)] border-[rgb(var(--clr-primary)/0.3)] text-[rgb(var(--clr-primary))] shadow-xs'
                      : 'border-slate-200/70 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs line-clamp-1">{t.title}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {t.plugin_id}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{t.record_type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Schema Editor & Live Dynamic Preview */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
            {selectedTemplate ? (
              <>
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{selectedTemplate.title}</h3>
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {selectedTemplate.record_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedTemplate.description || 'Clinical EMR Form'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Switcher */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setTemplateViewMode('preview')}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          templateViewMode === 'preview'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Live Form Preview
                      </button>
                      <button
                        onClick={() => setTemplateViewMode('json')}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          templateViewMode === 'json'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        JSON Schema Editor
                      </button>
                    </div>

                    <button
                      onClick={handleSaveTemplate}
                      disabled={isSavingTemplate || !!templateJsonError}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSavingTemplate ? 'Saving...' : 'Save & Publish'}
                    </button>
                  </div>
                </div>

                {/* Template Meta Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60 p-3.5 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Form Title</label>
                    <input
                      type="text"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Clinical Description</label>
                    <input
                      type="text"
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                {/* View Mode: JSON Editor */}
                {templateViewMode === 'json' && (
                  <div className="space-y-3">
                    {templateJsonError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{templateJsonError}</span>
                      </div>
                    )}
                    <textarea
                      value={templateJsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      rows={18}
                      className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-900 text-emerald-400"
                    />
                  </div>
                )}

                {/* View Mode: Live Preview with DynamicForm */}
                {templateViewMode === 'preview' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-2.5 bg-slate-100/80 rounded-lg text-xs">
                      <span className="font-semibold text-slate-700">Preview Form as Role:</span>
                      <div className="flex gap-1.5">
                        {['doctor', 'nurse', 'admin'].map((r) => (
                          <button
                            key={r}
                            onClick={() => setPreviewRole(r)}
                            className={`px-2.5 py-1 rounded text-xs font-bold capitalize transition-colors ${
                              previewRole === r
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-5 bg-white min-h-[350px]">
                      {parsedSchema ? (
                        <DynamicForm
                          schema={parsedSchema}
                          userRole={previewRole}
                          onSave={async (data) => {
                            alert('Preview simulated save: Form data captured successfully!');
                          }}
                        />
                      ) : (
                        <p className="text-center text-slate-400 py-12">Invalid schema JSON</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Select a clinical template from the left panel to configure its fields.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* === TAB 3: TREATMENT CYCLE TYPES MASTER === */}
      {/* ========================================== */}
      {activeTab === 'cycles' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Treatment Cycle Types Master</h3>
              <p className="text-xs text-slate-500">
                42 standard IVF, IUI, ICSI, and Cryopreservation cycle definitions powering the Protocol Engine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={cycleSearch}
                  onChange={(e) => setCycleSearch(e.target.value)}
                  placeholder="Search cycles..."
                  className="vmd-input text-xs pl-8 h-9"
                />
              </div>
              <select
                value={cycleCategoryFilter}
                onChange={(e) => setCycleCategoryFilter(e.target.value)}
                className="vmd-input text-xs h-9"
              >
                <option value="all">All Categories</option>
                <option value="ivf">IVF</option>
                <option value="iui">IUI</option>
                <option value="fet">FET</option>
                <option value="icsi">ICSI</option>
                <option value="donor">Donor / Third-Party</option>
                <option value="cryo">Cryopreservation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCycleTypes.map((c) => (
              <div
                key={c.id || c.code}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))]">
                      {c.code}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1.5">{c.name}</h4>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {c.category || 'Fertility'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{c.description || 'Clinical fertility protocol definition'}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Avg Duration: <strong className="text-slate-800">{c.default_duration_days || 28} Days</strong>
                  </span>
                  <span>
                    Protocol: <strong className="text-slate-800">{c.default_protocol || 'Standard'}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* === TAB 4: PERMISSION PROFILES (RBAC) === */}
      {/* ========================================== */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile List */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Roles</h3>
            <div className="space-y-1.5">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfile(p)}
                  className={`w-full p-3 rounded-md text-left transition-all text-xs font-bold flex items-center justify-between ${
                    selectedProfile?.id === p.id
                      ? 'bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)] text-[rgb(var(--clr-primary))] shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{p.name}</span>
                  {selectedProfile?.id === p.id && <Check className="w-4 h-4 text-[rgb(var(--clr-primary))]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Matrix Editor */}
          {selectedProfile && (
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedProfile.name}</h3>
                  <p className="text-xs text-slate-500">{selectedProfile.description || 'Configurable role permissions'}</p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
                >
                  {isSavingProfile ? 'Saving...' : (<><Save className="w-3.5 h-3.5 mr-1 inline" /> Save Role Permissions</>)}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuKeys.map((m) => {
                  const isChecked = selectedProfile.menu_permissions?.[m.key] ?? true;
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleTogglePermission(m.key)}
                      className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-[rgb(var(--clr-primary)/0.3)] bg-[rgb(var(--clr-primary)/0.04)] text-slate-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-400 font-medium'
                      }`}
                    >
                      <span className="text-xs">{m.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[rgb(var(--clr-primary))] rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* === TAB 5: PROTOCOL LIBRARY === */}
      {/* ========================================== */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stimulation Protocols Master</h2>
              <p className="text-xs text-slate-500">Define drug rules and offset days relative to sentinel anchors</p>
            </div>
            <button
              onClick={() => setShowAddProtoModal(true)}
              className="px-4 py-2 bg-[rgb(var(--clr-primary))] text-white text-xs font-semibold rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-xs"
            >
              + Create Protocol Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocols.map((proto) => (
              <div key={proto.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] px-2 py-0.5 rounded-md">
                      {proto.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{proto.name}</h3>
                    <p className="text-xs text-slate-500">{proto.description}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Drug Rules</p>
                  {proto.rules?.map((r: any) => (
                    <div key={r.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-md text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{r.drug_name}</p>
                        <p className="text-[10px] text-slate-500">
                          {r.dose} · {r.route} · {r.frequency} · Anchor: {r.sentinel_anchor} (Day {r.day_start_offset} to {r.day_end_offset})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* === TAB 6: BRANCHES & NETWORK IP SECURITY === */}
      {/* ========================================== */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinic Branches & Network Security</h2>
              <p className="text-xs text-slate-500">Configure clinic locations and IP whitelist CIDR ranges</p>
            </div>
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="px-4 py-2 bg-[rgb(var(--clr-primary))] text-white text-xs font-semibold rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-xs"
            >
              + Add Clinic Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((b) => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      b.is_main_branch ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.is_main_branch ? 'Main Clinic HQ' : 'Satellite Branch'}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{b.name} ({b.code})</h3>
                    <p className="text-xs text-slate-500">{b.address}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{b.phone || '—'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allowed IP Whitelist</p>
                  <div className="flex flex-wrap gap-1">
                    {b.ip_whitelist?.map((ip: string, idx: number) => (
                      <span key={idx} className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALS SECTION */}
      {/* ========================================== */}

      {/* Modal: Add/Edit Ward */}
      {showWardModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingWard ? 'Edit Hospital Ward' : 'Create Hospital Ward'}
              </h3>
              <button onClick={() => setShowWardModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveWard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ward Name</label>
                <input
                  type="text"
                  value={wardFormName}
                  onChange={(e) => setWardFormName(e.target.value)}
                  placeholder="e.g. Post-OP Ward, ICU, Deluxe Suite"
                  required
                  className="vmd-input text-xs"
                />
              </div>
              {!editingWard && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ward Code (Short Identifier)</label>
                  <input
                    type="text"
                    value={wardFormCode}
                    onChange={(e) => setWardFormCode(e.target.value)}
                    placeholder="e.g. ICU-01, POSTOP"
                    required
                    className="vmd-input text-xs uppercase font-mono"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  value={wardFormDept}
                  onChange={(e) => setWardFormDept(e.target.value)}
                  placeholder="e.g. Reproductive Surgery, General IPD"
                  required
                  className="vmd-input text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Base Charge / Day (₹)</label>
                  <input
                    type="number"
                    value={wardFormRate}
                    onChange={(e) => setWardFormRate(Number(e.target.value))}
                    required
                    min={0}
                    className="vmd-input text-xs"
                  />
                </div>
                {!editingWard && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Initial Beds</label>
                    <input
                      type="number"
                      value={wardFormBeds}
                      onChange={(e) => setWardFormBeds(Number(e.target.value))}
                      required
                      min={1}
                      max={50}
                      className="vmd-input text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[rgb(var(--clr-primary))] text-white font-semibold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)]"
                >
                  {editingWard ? 'Update Ward' : 'Create Ward & Generate Beds'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWardModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Bed */}
      {showBedModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingBed ? 'Edit Physical Bed' : 'Add Bed to Ward'}
              </h3>
              <button onClick={() => setShowBedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBed} className="space-y-4">
              {!editingBed && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Assign to Ward</label>
                  <select
                    value={bedFormWardId}
                    onChange={(e) => {
                      setBedFormWardId(e.target.value);
                      const w = wards.find((w) => w.id === e.target.value);
                      if (w) setBedFormRate(w.base_charge_per_day);
                    }}
                    required
                    className="vmd-input text-xs"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Bed Number / Label</label>
                <input
                  type="text"
                  value={bedFormNumber}
                  onChange={(e) => setBedFormNumber(e.target.value)}
                  placeholder="e.g. ICU-01, 102-A"
                  required
                  className="vmd-input text-xs uppercase font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bed Type</label>
                  <select
                    value={bedFormType}
                    onChange={(e) => setBedFormType(e.target.value)}
                    className="vmd-input text-xs"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Semi-Private">Semi-Private</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="ICU">ICU</option>
                    <option value="Daycare">Daycare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Daily Tariff (₹)</label>
                  <input
                    type="number"
                    value={bedFormRate}
                    onChange={(e) => setBedFormRate(Number(e.target.value))}
                    required
                    min={0}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Initial / Current Status</label>
                <select
                  value={bedFormStatus}
                  onChange={(e) => setBedFormStatus(e.target.value)}
                  disabled={editingBed?.status === 'Occupied'}
                  className="vmd-input text-xs"
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                  {editingBed?.status === 'Occupied' && <option value="Occupied">Occupied</option>}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[rgb(var(--clr-primary))] text-white font-semibold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)]"
                >
                  {editingBed ? 'Update Bed' : 'Add Bed'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBedModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Clinical Template */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">Create Clinical Form Template</h3>
              <button onClick={() => setShowNewTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Unique Record Type Key</label>
                <input
                  type="text"
                  value={newTemplateKey}
                  onChange={(e) => setNewTemplateKey(e.target.value)}
                  placeholder="e.g. custom_consultation_notes, pre_op_checklist"
                  required
                  className="vmd-input text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Unique key used in database & API calls</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Template Display Title</label>
                <input
                  type="text"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="e.g. Pre-Operative Laparoscopy Assessment"
                  required
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Module / Plugin Scope</label>
                <select
                  value={newTemplatePlugin}
                  onChange={(e) => setNewTemplatePlugin(e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="fertility">Fertility & IVF</option>
                  <option value="core">Core Hospital / OPD / IPD</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[rgb(var(--clr-primary))] text-white font-semibold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)]"
                >
                  Create Form Schema
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Protocol */}
      {showAddProtoModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Create Protocol Template</h3>
            <form onSubmit={handleCreateProtocol} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Protocol Name</label>
                <input
                  type="text"
                  value={newProtoName}
                  onChange={(e) => setNewProtoName(e.target.value)}
                  placeholder="e.g. Day 21 Long Agonist"
                  required
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <select
                  value={newProtoCategory}
                  onChange={(e) => setNewProtoCategory(e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="stimulation">Stimulation</option>
                  <option value="fet">FET</option>
                  <option value="iui">IUI</option>
                  <option value="luteal">Luteal Support</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  value={newProtoDesc}
                  onChange={(e) => setNewProtoDesc(e.target.value)}
                  rows={2}
                  className="vmd-input text-xs"
                  placeholder="Clinical indication..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-[rgb(var(--clr-primary))] text-white font-semibold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)]">
                  Create Template
                </button>
                <button type="button" onClick={() => setShowAddProtoModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-md">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Branch */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Add Clinic Branch</h3>
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. HITEC City Clinic"
                  required
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Branch Code (Short ID)</label>
                <input
                  type="text"
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  placeholder="e.g. HITEC"
                  required
                  className="vmd-input text-xs uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Address & Phone</label>
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="Address..."
                  className="vmd-input text-xs mb-2"
                />
                <input
                  type="tel"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder="Phone..."
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Allowed IP CIDR (Comma separated)</label>
                <input
                  type="text"
                  value={newBranchIps}
                  onChange={(e) => setNewBranchIps(e.target.value)}
                  className="vmd-input text-xs font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-[rgb(var(--clr-primary))] text-white font-semibold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)]">
                  Register Branch
                </button>
                <button type="button" onClick={() => setShowAddBranchModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-md">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
