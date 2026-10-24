'use client';

import React, { useState, useEffect } from 'react';
import { permissionProfilesApi } from '@/lib/api';
import { ShieldCheck, Check } from 'lucide-react';
import {
  VAIDYAMD_ROLES,
  menuKeys,
  getDefaultPermissionsForRole,
  findProfileForRole,
} from '../types';

interface ProfilesSettingsTabProps {
  profiles: any[];
  setProfiles: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ProfilesSettingsTab({
  profiles,
  setProfiles,
}: ProfilesSettingsTabProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const p = findProfileForRole('admin', profiles);
      if (p) setSelectedProfile(p);
      else {
        setSelectedProfile({
          name: 'Administrator',
          description: 'Full clinical, administrative, lab, and financial permissions',
          menu_permissions: getDefaultPermissionsForRole('admin'),
        });
      }
    }
  }, [profiles]);

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;
    setIsSavingProfile(true);
    try {
      if (selectedProfile.id) {
        await permissionProfilesApi.update(selectedProfile.id, {
          name: selectedProfile.name,
          description: selectedProfile.description,
          menu_permissions: selectedProfile.menu_permissions,
        });
        alert('Permission profile updated successfully!');
      } else {
        const created: any = await permissionProfilesApi.create({
          name: selectedProfile.name,
          description: selectedProfile.description,
          menu_permissions: selectedProfile.menu_permissions,
        });
        setSelectedProfile(created);
        alert('Permission profile created successfully!');
      }
      const updatedProfiles: any = await permissionProfilesApi.list();
      setProfiles(Array.isArray(updatedProfiles) ? updatedProfiles : []);
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };


  const handleResetDefaults = () => {
    const defaults = getDefaultPermissionsForRole(selectedRoleId);
    setSelectedProfile({
      ...selectedProfile,
      menu_permissions: defaults,
    });
  };

  const handleSelectAll = (enable: boolean) => {
    const nextPerms: Record<string, boolean> = {};
    menuKeys.forEach((m) => {
      nextPerms[m.key] = enable;
    });
    setSelectedProfile({
      ...selectedProfile,
      menu_permissions: nextPerms,
    });
  };

  const categories = [
    { id: 'clinical', label: 'Clinical & Encounters', color: 'text-teal-800 bg-teal-50 border-teal-200' },
    { id: 'lab', label: 'Laboratory & Diagnostics', color: 'text-purple-800 bg-purple-50 border-purple-200' },
    { id: 'inpatient_pharma', label: 'Inpatient & Pharmacy', color: 'text-blue-800 bg-blue-50 border-blue-200' },
    { id: 'financial_referrals', label: 'Financial & Partner Network', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
    { id: 'admin', label: 'Administrative Master', color: 'text-slate-800 bg-slate-100 border-slate-300' },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Roles List */}
      <div className="lg:col-span-4 space-y-2">
        <div className="text-xs font-bold text-slate-700 px-1 mb-1">
          VaidyaMD Canonical Roles ({VAIDYAMD_ROLES.length})
        </div>
        {VAIDYAMD_ROLES.map((roleDef) => {
          const matchedProfile = findProfileForRole(roleDef.id, profiles);
          const isSelected = selectedRoleId === roleDef.id;
          return (
            <button
              key={roleDef.id}
              onClick={() => {
                setSelectedRoleId(roleDef.id);
                if (matchedProfile) {
                  setSelectedProfile(matchedProfile);
                } else {
                  setSelectedProfile({
                    name: roleDef.name,
                    description: roleDef.desc,
                    menu_permissions: getDefaultPermissionsForRole(roleDef.id),
                  });
                }
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-white shadow-sm ring-1 ring-primary'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs">{roleDef.name}</div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-semibold'
                  }`}
                >
                  {roleDef.id}
                </span>
              </div>
              <div className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                {roleDef.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Permissions Matrix: {selectedProfile?.name}</h3>
            <p className="text-[11px] text-slate-500">
              Configure real-time functional module access for this clinical and administrative role
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Reset Role Defaults
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="px-4 py-1.5 bg-primary hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSavingProfile ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>
            Enabled Modules:{' '}
            <strong className="text-slate-800">
              {menuKeys.filter((m) => !!selectedProfile?.menu_permissions?.[m.key]).length} / {menuKeys.length}
            </strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-teal-800 hover:underline font-semibold cursor-pointer"
            >
              Select All
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-slate-600 hover:underline font-medium cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Categorized Permissions Grid */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const catItems = menuKeys.filter((m) => m.category === cat.id);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {catItems.filter((m) => !!selectedProfile?.menu_permissions?.[m.key]).length} of {catItems.length} active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {catItems.map((menu) => {
                    const isChecked = !!selectedProfile?.menu_permissions?.[menu.key];
                    return (
                      <label
                        key={menu.key}
                        className={`flex items-start gap-3 p-2.5 border rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-teal-50/40 border-teal-200 shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const cur = selectedProfile?.menu_permissions || {};
                            setSelectedProfile({
                              ...selectedProfile,
                              menu_permissions: { ...cur, [menu.key]: !cur[menu.key] },
                            });
                          }}
                          className="rounded text-primary focus:ring-primary focus:border-primary w-4 h-4 mt-0.5 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{menu.label}</p>
                          {menu.description && (
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{menu.description}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
