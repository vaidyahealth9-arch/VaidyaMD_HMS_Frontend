'use client';

import React from 'react';
import { PhoneCall, UserPlus, UploadCloud, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import PageHeader from '@/components/common/PageHeader';

interface CRMHeaderProps {
  onNewLead: () => void;
  onImportCsv: () => void;
  onRefresh: () => void;
  onConnectPhone: () => void;
  isLoading?: boolean;
}

export const CRMHeader: React.FC<CRMHeaderProps> = ({
  onNewLead,
  onImportCsv,
  onRefresh,
  onConnectPhone,
  isLoading,
}) => {
  return (
    <PageHeader
      title="CRM & Telecaller Desk"
      subtitle="Manage patient leads, progressive zero-cost dialing, call recordings & Whisper transcripts."
      icon={PhoneCall}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onConnectPhone}
            className="text-xs text-primary border-primary/30 hover:bg-primary/10 font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            Connect Phone / APK
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onImportCsv}
            className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={onNewLead}
            className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add Lead
          </Button>
        </div>
      }
    />
  );
};
