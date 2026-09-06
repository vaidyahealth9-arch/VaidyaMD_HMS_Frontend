'use client';

import { useEffect, useState } from 'react';
import { permissionProfilesApi, protocolsApi, branchesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const menuKeys = [
  { key: 'patients', label: 'Patient Directory' },
  { key: 'patient_register', label: 'Patient / Couple Registration' },
  { key: 'patient_360', label: 'Couple 360 EMR Portal' },
  { key: 'treatment_cycles', label: 'Treatment Cycles & Protocol Engine' },
  { key: 'ivf_lab', label: 'IVF Lab (Embryology & Andrology)' },
  { key: 'cryopreservation', label: 'Cryobank Tank Coordinates' },
  { key: 'billing', label: 'Billing & Invoices' },
  { key: 'wallet', label: 'Patient Advance Wallet' },
  { key: 'analytics', label: 'Analytics & Financial Reports' },
  { key: 'pharmacy', label: 'Pharmacy Dispensary' },
];

export default function SettingsMasterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profiles' | 'protocols' | 'branches'>('profiles');

  // Permission Profiles State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Protocol Library State
  const [protocols, setProtocols] = useState<any[]>([]);
  const [showAddProtoModal, setShowAddProtoModal] = useState(false);
  const [newProtoName, setNewProtoName] = useState('');
  const [newProtoCategory, setNewProtoCategory] = useState('stimulation');
  const [newProtoDesc, setNewProtoDesc] = useState('');

  // Branches State
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchIps, setNewBranchIps] = useState('127.0.0.1, 192.168.1.0/24');

  const loadData = () => {
    permissionProfilesApi.list()
      .then((p: any) => {
        setProfiles(p || []);
        if (p && p.length > 0 && !selectedProfile) {
          setSelectedProfile(p[0]);
        }
      })
      .catch(() => {});

    protocolsApi.list()
      .then((pr: any) => setProtocols(pr || []))
      .catch(() => {});

    branchesApi.list()
      .then((b: any) => setBranches(b || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

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
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

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
          }
        ]
      });
      setShowAddProtoModal(false);
      setNewProtoName('');
      setNewProtoDesc('');
      loadData();
      alert('Protocol template created successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to create protocol');
    }
  };

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
      loadData();
      alert('Branch created successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to create branch');
    }
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="p-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl mx-auto border border-rose-100 shadow-sm">
          🔒
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Master Settings, Permission Profiles, and Branch Whitelists are restricted to Administrator accounts.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
        >
          ← Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Hospital Masters & Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure dynamic role permissions, stimulation protocols, and clinic branches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'profiles', label: '🛡️ Role Permission Profiles', desc: 'Configurable RBAC' },
          { id: 'protocols', label: '💊 Stimulation Protocol Library', desc: 'Drug rules engine' },
          { id: 'branches', label: '🏥 Clinic Branches & IP Security', desc: 'Multi-clinic isolation' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <p>{t.label}</p>
          </button>
        ))}
      </div>

      {/* === TAB 1: PERMISSION PROFILES === */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Roles</h3>
            <div className="space-y-1.5">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfile(p)}
                  className={`w-full p-3 rounded-2xl text-left transition-all text-xs font-bold flex items-center justify-between ${
                    selectedProfile?.id === p.id
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{p.name}</span>
                  {selectedProfile?.id === p.id && <span className="text-indigo-600">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Matrix Editor */}
          {selectedProfile && (
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedProfile.name}</h3>
                  <p className="text-xs text-slate-500">{selectedProfile.description || 'Configurable role permissions'}</p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  {isSavingProfile ? 'Saving...' : '💾 Save Role Permissions'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuKeys.map((m) => {
                  const isChecked = selectedProfile.menu_permissions?.[m.key] ?? true;
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleTogglePermission(m.key)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-indigo-200 bg-indigo-50/40 text-indigo-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-400 font-medium'
                      }`}
                    >
                      <span className="text-xs">{m.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === TAB 2: PROTOCOL LIBRARY === */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stimulation Protocols Master</h2>
              <p className="text-xs text-slate-500">Define drug rules and offset days relative to sentinel anchors</p>
            </div>
            <button
              onClick={() => setShowAddProtoModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Create Protocol Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocols.map((proto) => (
              <div key={proto.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {proto.category}
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-1">{proto.name}</h3>
                    <p className="text-xs text-slate-500">{proto.description}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Drug Rules</p>
                  {proto.rules?.map((r: any) => (
                    <div key={r.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center">
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

      {/* === TAB 3: BRANCHES & IP SECURITY === */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinic Branches & Network Security</h2>
              <p className="text-xs text-slate-500">Configure clinic locations and IP whitelist CIDR ranges</p>
            </div>
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Add Clinic Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((b) => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      b.is_main_branch ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.is_main_branch ? 'Main Clinic HQ' : 'Satellite Branch'}
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-1">{b.name} ({b.code})</h3>
                    <p className="text-xs text-slate-500">{b.address}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">📞 {b.phone || '—'}</p>
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

      {/* Add Protocol Modal */}
      {showAddProtoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
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
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700">
                  Create Template
                </button>
                <button type="button" onClick={() => setShowAddProtoModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
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
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700">
                  Register Branch
                </button>
                <button type="button" onClick={() => setShowAddBranchModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
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
