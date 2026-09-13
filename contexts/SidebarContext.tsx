'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setIsExpanded: (expanded: boolean) => void;
  isContextSidebarOpen: boolean;
  toggleContextSidebar: () => void;
  setIsContextSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY_SIDEBAR = 'vaidyamd_sidebar_expanded';
const STORAGE_KEY_CONTEXT_SIDEBAR = 'vaidyamd_context_sidebar_open';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Default to expanded (viewable) on desktop, can be toggled to collapsed
  const [isExpanded, setIsExpandedState] = useState<boolean>(true);
  const [isContextSidebarOpen, setIsContextSidebarOpenState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedSidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR);
      if (savedSidebar !== null) {
        setIsExpandedState(savedSidebar === 'true');
      }
      const savedContext = localStorage.getItem(STORAGE_KEY_CONTEXT_SIDEBAR);
      if (savedContext !== null) {
        setIsContextSidebarOpenState(savedContext === 'true');
      }
    } catch {
      // localStorage may not be available in private browsing or restricted environments
    }
  }, []);

  const setIsExpanded = (expanded: boolean) => {
    setIsExpandedState(expanded);
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, expanded ? 'true' : 'false');
    } catch {}
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const setIsContextSidebarOpen = (open: boolean) => {
    setIsContextSidebarOpenState(open);
    try {
      localStorage.setItem(STORAGE_KEY_CONTEXT_SIDEBAR, open ? 'true' : 'false');
    } catch {}
  };

  const toggleContextSidebar = () => {
    setIsContextSidebarOpen(!isContextSidebarOpen);
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        toggleSidebar,
        setIsExpanded,
        isContextSidebarOpen,
        toggleContextSidebar,
        setIsContextSidebarOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
