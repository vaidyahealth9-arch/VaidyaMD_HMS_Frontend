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


  return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
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

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Permissions Matrix: {selectedProfile?.name}</h3>
                <p className="text-[11px] text-slate-500">Toggle functional clinical and administrative modules</p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                {isSavingProfile ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuKeys.map((menu) => {
                const isChecked = !!selectedProfile?.menu_permissions?.[menu.key];
                return (
                  <label
                    key={menu.key}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/80 transition-colors"
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
                      className="rounded text-primary focus:ring-primary focus:border-primary w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-800">{menu.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

  );
}
