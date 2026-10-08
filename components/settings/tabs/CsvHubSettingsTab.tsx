'use client';

import React, { useState } from 'react';
import { adminApi } from '@/lib/api';
import CsvImportModal from '../modals/CsvImportModal';

interface CsvHubSettingsTabProps {
  csvDomains: any[];
  onReloadMasters?: () => void;
}

export default function CsvHubSettingsTab({
  csvDomains,
  onReloadMasters,
}: CsvHubSettingsTabProps) {
  const [importDomain, setImportDomain] = useState<any | null>(null);

  const handleDownloadCsv = async (domainKey: string, mode: 'blank' | 'export') => {
    try {
      await adminApi.downloadCsv(domainKey, mode, `${domainKey}_${mode}.csv`);
    } catch (err: any) {
      alert('Download failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <>
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-primary flex justify-between items-center">
            <div>
              <span className="font-bold block text-sm">Dynamic In-App CSV Import & Export Hub</span>
              <span>Download blank RFC 4180 headers, live export existing hospital records, or ingest bulk datasets.</span>
            </div>
            <span className="px-2.5 py-1 bg-white text-primary font-mono font-bold rounded border border-primary/20">
              {csvDomains.length || 14} Domains Supported
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {csvDomains.map((dom) => (
              <div key={dom.key} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{dom.title}</h3>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{dom.key}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{dom.description}</p>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono line-clamp-1">
                    Headers: {dom.headers?.join(', ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(dom.key, 'blank')}
                    className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Template
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(dom.key, 'export')}
                    className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => setImportDomain(dom)}
                    className="flex-1 py-1.5 px-2 bg-primary hover:bg-primary-mid text-white font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Import
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      <CsvImportModal
        domain={importDomain}
        onClose={() => setImportDomain(null)}
        onSuccess={() => {
          setImportDomain(null);
          onReloadMasters?.();
        }}
      />
    </>
  );
}
