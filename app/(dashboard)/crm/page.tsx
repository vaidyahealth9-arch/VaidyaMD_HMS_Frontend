'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { crmApi } from '@/lib/api';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import { Button } from '@/shared/ui/button';
import { 
  DialerQueueTab, 
  LeadsListTab, 
  CallHistoryTab,
  CRMDashboardTab,
  TelecallerRosterTab,
  TelecallerAnalyticsTab,
  CallDispositionModal,
  LeadFormModal,
  ImportLeadsModal,
  ConnectPhoneModal,
  Lead,
  CallLog,
  DialerQueueItem,
  CRMAnalytics,
  TelecallerRosterItem,
  TelecallerKPIItem
} from '@/components/crm';
import { PhoneCall, Users, BarChart3, Radio, Trophy, RefreshCw, Smartphone, UploadCloud, UserPlus, Headphones } from 'lucide-react';

type TabKey = 'dialer' | 'leads' | 'calls' | 'roster' | 'kpis' | 'dashboard';

export default function CRMPage() {
  const { currentBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dialer');
  
  // Data State
  const [queueItem, setQueueItem] = useState<DialerQueueItem | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null);
  const [roster, setRoster] = useState<TelecallerRosterItem[]>([]);
  const [kpis, setKpis] = useState<TelecallerKPIItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Active Call & Modal State
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeCallLeadName, setActiveCallLeadName] = useState<string>('');
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConnectPhoneModalOpen, setIsConnectPhoneModalOpen] = useState(false);

  // Fetch functions
  const loadQueue = useCallback(async () => {
    try {
      const item = await crmApi.getNextLead();
      setQueueItem(item);
    } catch (err) {
      console.error('Failed to load next lead in queue', err);
    }
  }, []);

  const loadLeads = useCallback(async (search?: string, status?: any) => {
    try {
      setIsLoading(true);
      const res = await crmApi.listLeads({ search, status, limit: 50 });
      setLeads(res.items);
      setTotalLeads(res.total);
    } catch (err) {
      console.error('Failed to load leads list', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await crmApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load CRM analytics', err);
    }
  }, []);

  const loadFleetKpis = useCallback(async (params?: { date_from?: string; date_to?: string; preset?: string }) => {
    try {
      const data = await crmApi.getFleetKpis(params);
      setKpis(data);
    } catch (err) {
      console.error('Failed to load fleet KPIs', err);
    }
  }, []);

  const loadFleetData = useCallback(async () => {
    try {
      const [rosterRes, kpisRes] = await Promise.all([
        crmApi.getFleetRoster(),
        crmApi.getFleetKpis({ preset: 'all_time' }),
      ]);
      setRoster(rosterRes);
      setKpis(kpisRes);
    } catch (err) {
      console.error('Failed to load fleet data', err);
    }
  }, []);

  const loadCalls = useCallback(async () => {
    try {
      const data = await crmApi.listCalls({ limit: 50 });
      setCalls(data);
    } catch (err) {
      console.error('Failed to load call logs', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    void loadQueue();
    void loadLeads();
    void loadCalls();
    void loadAnalytics();
    void loadFleetData();
  }, [loadQueue, loadLeads, loadCalls, loadAnalytics, loadFleetData]);

  useEffect(() => {
    refreshAll();
  }, [currentBranch, refreshAll]);

  // Actions
  const handleCallInitiated = async (leadId: string, phone: string, leadName?: string) => {
    try {
      const name = leadName || (queueItem?.lead?.id === leadId ? queueItem?.lead?.name : null) || 'Lead';
      setActiveCallLeadName(name);
      const log = await crmApi.startCall(leadId, phone, 'web');
      setActiveCallId(log.id);
      setIsDispositionModalOpen(true);
    } catch (err) {
      console.error('Error starting call', err);
    }
  };

  const handleDispositionSubmit = async (data: any) => {
    if (!activeCallId) return;
    try {
      await crmApi.submitDisposition(activeCallId, data);
      setActiveCallId(null);
      void loadQueue();
      void loadAnalytics();
      void loadLeads();
    } catch (err) {
      console.error('Failed to submit disposition', err);
    }
  };

  const handleAddLeadSubmit = async (data: any) => {
    try {
      await crmApi.createLead(data);
      refreshAll();
    } catch (err) {
      console.error('Failed to add lead', err);
      alert('Failed to add lead. Please check the mobile number and name.');
    }
  };

  const handleImportUpload = async (file: File) => {
    const res = await crmApi.importCsv(file);
    refreshAll();
    return res;
  };

  const tabs = [
    { id: 'dialer', label: 'Dialer Queue', icon: PhoneCall },
    { id: 'leads', label: 'All Leads', icon: Users, badge: totalLeads > 0 ? totalLeads : undefined },
    { id: 'calls', label: 'Call History & Recordings', icon: Headphones, badge: calls.length > 0 ? calls.length : undefined },
    { id: 'roster', label: 'Fleet Roster', icon: Radio, badge: roster.length > 0 ? roster.length : undefined },
    { id: 'kpis', label: 'Telecaller Performance', icon: Trophy },
    { id: 'dashboard', label: 'Pipeline Analytics', icon: BarChart3 },
  ];

  return (
    <PageLayout>
      {/* Standard Unified Page Header */}
      <PageHeader
        title="CRM & Telecaller Desk"
        subtitle="Manage patient leads, progressive zero-cost dialing, call recordings & Whisper transcripts."
        icon={PhoneCall}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading}
              className="text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConnectPhoneModalOpen(true)}
              className="text-xs text-primary border-primary/30 hover:bg-primary/10 font-semibold"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              Connect Phone / APK
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Import CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Add Lead
            </Button>
          </div>
        }
      />

      {/* Unified Brand TabBar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabKey)}
      />

      {/* Tab Panels */}
      {activeTab === 'dialer' && (
        <DialerQueueTab
          queueItem={queueItem}
          onCallInitiated={(id, phone) => handleCallInitiated(id, phone, queueItem?.lead.name)}
          onSkipNext={loadQueue}
          isLoading={isLoading}
          roster={roster}
          activeCallId={activeCallId}
          onEndCall={() => setIsDispositionModalOpen(true)}
        />
      )}

      {activeTab === 'leads' && (
        <LeadsListTab
          leads={leads}
          total={totalLeads}
          isLoading={isLoading}
          onCallLead={(lead) => {
            handleCallInitiated(lead.id, lead.phone, lead.name);
          }}
          onFilterChange={(filters) => loadLeads(filters.search, filters.status)}
        />
      )}

      {activeTab === 'calls' && (
        <CallHistoryTab
          calls={calls}
          isLoading={isLoading}
          onRefresh={loadCalls}
        />
      )}

      {activeTab === 'roster' && (
        <TelecallerRosterTab
          roster={roster}
          isLoading={isLoading}
          onRefresh={loadFleetData}
        />
      )}

      {activeTab === 'kpis' && (
        <TelecallerAnalyticsTab
          kpis={kpis}
          isLoading={isLoading}
          onFilterChange={loadFleetKpis}
          onRefresh={() => loadFleetKpis()}
        />
      )}

      {activeTab === 'dashboard' && (
        <CRMDashboardTab analytics={analytics} isLoading={isLoading} />
      )}

      {/* Modals */}
      <CallDispositionModal
        isOpen={isDispositionModalOpen}
        onClose={() => setIsDispositionModalOpen(false)}
        onSubmit={handleDispositionSubmit}
        leadName={activeCallLeadName || 'Lead'}
      />

      <LeadFormModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleAddLeadSubmit}
      />

      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onUpload={handleImportUpload}
        onSuccess={refreshAll}
      />

      <ConnectPhoneModal
        isOpen={isConnectPhoneModalOpen}
        onClose={() => setIsConnectPhoneModalOpen(false)}
      />
    </PageLayout>
  );
}
