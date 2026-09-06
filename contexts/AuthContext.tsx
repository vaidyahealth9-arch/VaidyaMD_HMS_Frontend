'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, branchesApi, permissionProfilesApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

export interface VaidyaMdUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_doctor?: boolean;
  departments: string[];
  specialization?: string;
  avatar_url?: string;
  phone?: string;
  tenant_id: string;
  hospital_name?: string;
  active_plugins?: string[];
  permission_profile_id?: string;
  branch_id?: string;
}

export interface BranchItem {
  id: string;
  name: string;
  code: string;
  is_main_branch?: boolean;
}

interface AuthContextValue {
  user: VaidyaMdUser | null;
  activeRole: string;
  activeDepartment: string;
  isLoading: boolean;
  branches: BranchItem[];
  currentBranch: BranchItem | null;
  setCurrentBranch: (branch: BranchItem) => void;
  can: (moduleKey: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>;
  setActiveDepartment: (dept: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VaidyaMdUser | null>(null);
  const [activeRole, setActiveRole] = useState<string>('');
  const [activeDepartment, setActiveDepartment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [currentBranch, setCurrentBranch] = useState<BranchItem | null>(null);
  const [menuPermissions, setMenuPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch branches
    branchesApi.list()
      .then((b: any) => {
        if (Array.isArray(b) && b.length > 0) {
          setBranches(b);
          setCurrentBranch(b[0]);
        }
      })
      .catch(() => {});

    // Restore and validate session with backend
    const savedToken = localStorage.getItem('vaidya_md_token');
    const savedUser = localStorage.getItem('vaidya_md_user');
    if (savedToken) {
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setActiveRole(parsed.role);
          setActiveDepartment(parsed.departments?.[0] || '');
        } catch (e) {}
      }
      authApi.me()
        .then((freshUser: VaidyaMdUser) => {
          localStorage.setItem('vaidya_md_user', JSON.stringify(freshUser));
          setUser(freshUser);
          setActiveRole(freshUser.role);
          setActiveDepartment(freshUser.departments?.[0] || '');
          wsClient.connect(freshUser.id, { role: freshUser.role, tenant_id: freshUser.tenant_id });
          loadPermissions(freshUser);
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadPermissions = async (u: VaidyaMdUser) => {
    if (u.role === 'admin') {
      // Admins have all permissions enabled
      setMenuPermissions({ all: true });
      return;
    }
    try {
      const profiles: any = await permissionProfilesApi.list();
      if (Array.isArray(profiles)) {
        const matching = profiles.find((p: any) => p.name.toLowerCase().includes(u.role.toLowerCase()));
        if (matching && matching.menu_permissions) {
          setMenuPermissions(matching.menu_permissions);
          return;
        }
      }
    } catch (e) {}
    // Default fallback
    setMenuPermissions({});
  };

  const can = (moduleKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || menuPermissions.all) return true;
    if (moduleKey in menuPermissions) {
      return menuPermissions[moduleKey];
    }
    return true; // Default allow for standard general routes
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password) as { access_token: string; user: VaidyaMdUser };
    localStorage.setItem('vaidya_md_token', response.access_token);
    localStorage.setItem('vaidya_md_user', JSON.stringify(response.user));
    setUser(response.user);
    setActiveRole(response.user.role);
    setActiveDepartment(response.user.departments?.[0] || '');
    wsClient.connect(response.user.id, { role: response.user.role, tenant_id: response.user.tenant_id });
    loadPermissions(response.user);
  };

  const switchUser = async (email: string) => {
    const users = await authApi.listUsers() as VaidyaMdUser[];
    const targetUser = users.find((u) => u.email === email);
    if (targetUser) {
      localStorage.setItem('vaidya_md_user', JSON.stringify(targetUser));
      setUser(targetUser);
      setActiveRole(targetUser.role);
      setActiveDepartment(targetUser.departments?.[0] || '');
      loadPermissions(targetUser);
    }
  };

  const logout = () => {
    wsClient.disconnect();
    localStorage.removeItem('vaidya_md_token');
    localStorage.removeItem('vaidya_md_user');
    setUser(null);
    setActiveRole('');
    setActiveDepartment('');
    setMenuPermissions({});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        activeDepartment,
        isLoading,
        branches,
        currentBranch,
        setCurrentBranch,
        can,
        login,
        logout,
        switchUser,
        setActiveDepartment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
