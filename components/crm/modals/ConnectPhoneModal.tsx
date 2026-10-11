'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Smartphone, Download, QrCode, ShieldCheck, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';
import { crmApi } from '@/lib/api';
import { getApiBase } from '@/lib/api';

interface ConnectPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectPhoneModal: React.FC<ConnectPhoneModalProps> = ({ isOpen, onClose }) => {
  const [pairingData, setPairingData] = useState<{
    pair_token: string;
    user_name: string;
    user_id?: string;
    hospital_id?: string;
    branch_id?: string | null;
    expires_in_seconds: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'pair' | 'download'>('pair');
  const [qrProviderIndex, setQrProviderIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const downloadUrl = typeof window !== 'undefined' ? crmApi.getApkDownloadUrl() : '';
  const apiBase = typeof window !== 'undefined' ? getApiBase() : 'http://localhost:8000/api';

  const fetchPairToken = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await crmApi.getPairToken();
      setPairingData(data);
    } catch (err: any) {
      console.error('Failed to get pair token', err);
      setFetchError(err.message || 'Failed to generate scan-to-pair token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchPairToken();
    }
  }, [isOpen, fetchPairToken]);

  const handleCopy = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // QR Payload for Android app
  const pairPayloadStr = pairingData
    ? JSON.stringify({
        action: 'vaidyamd_telecaller_pair',
        server_url: apiBase,
        auth_token: pairingData.pair_token,
        token: pairingData.pair_token,
        user_name: pairingData.user_name,
        hospital_id: pairingData.hospital_id,
        branch_id: pairingData.branch_id,
      })
    : '';

  // Multi-provider QR code URLs with automatic fallback
  const qrProviders = [
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(pairPayloadStr)}`,
    `https://quickchart.io/qr?size=200&margin=2&text=${encodeURIComponent(pairPayloadStr)}`,
  ];

  const currentPairQrUrl = pairPayloadStr ? qrProviders[qrProviderIndex % qrProviders.length] : '';

  const downloadQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
    downloadUrl
  )}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Connect Mobile Phone (Zero-Cost SIM Dialer)
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Bridge CRM single-click calls directly to your Android SIM card with automated sync.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tab switcher: Step 1 (Pair) vs Step 2 (Download APK) */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1 mt-1 border border-slate-200">
          <button
            onClick={() => setActiveStep('pair')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 'pair'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Step 1: Scan to Pair Phone
          </button>
          <button
            onClick={() => setActiveStep('download')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 'download'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Step 2: Download APK (Optional)
          </button>
        </div>

        {/* Step 1: Scan to Pair */}
        {activeStep === 'pair' && (
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
              {isLoading ? (
                <div className="w-[190px] h-[190px] flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-200">
                  <RefreshCw className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-[11px] text-slate-500 font-medium">Generating token...</span>
                </div>
              ) : fetchError ? (
                <div className="w-[190px] h-[190px] p-4 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-rose-200 text-rose-700">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                  <span className="text-[11px] font-semibold text-center">{fetchError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchPairToken}
                    className="text-[11px] h-7 mt-1 border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="w-[190px] h-[190px] bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                  {currentPairQrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentPairQrUrl}
                      alt="Pairing QR Code"
                      width={170}
                      height={170}
                      className="rounded"
                      onError={() => {
                        if (qrProviderIndex < qrProviders.length - 1) {
                          setQrProviderIndex((prev) => prev + 1);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">Waiting for token...</span>
                  )}
                </div>
              )}

              <p className="font-bold text-slate-800 text-xs mt-3">
                Open VaidyaMD Telecaller App & Scan QR Code
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                Zero manual typing. Automatically configures telecaller authentication and server bridge.
              </p>

              {pairingData && (
                <div className="flex items-center gap-2 mt-2.5">
                  <Badge variant="outline" className="font-mono text-[10px] bg-white border-slate-200 text-slate-700">
                    Telecaller: {pairingData.user_name}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-200 text-emerald-700">
                    Active (15 min)
                  </Badge>
                </div>
              )}
            </div>

            {/* Manual Credentials Box (Fallback if camera scanner unavailable) */}
            {pairingData && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Manual Setup Details (or Android Emulator):</span>
                  <button
                    onClick={fetchPairToken}
                    className="text-primary hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate Token
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Server URL</span>
                      <span className="font-mono text-slate-800 truncate block">{apiBase}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(apiBase, 'server')}
                      className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                      title="Copy server URL"
                    >
                      {copiedField === 'server' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Pairing Token</span>
                      <span className="font-mono text-slate-800 truncate block">
                        {pairingData.pair_token.slice(0, 14)}...
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(pairingData.pair_token, 'token')}
                      className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                      title="Copy token"
                    >
                      {copiedField === 'token' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Download & Install Companion APK */}
        {activeStep === 'download' && (
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
              <div className="w-[180px] h-[180px] bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={downloadQrCodeUrl}
                  alt="Download APK QR Code"
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
              <p className="font-semibold text-slate-800 mt-3 text-xs">
                Scan with phone camera to download APK directly
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Or download to your workstation / share via WhatsApp Web:
              </p>

              <a
                href={downloadUrl}
                download="vaidyamd-telecaller-v1.0.0.apk"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download APK Directly (v1.0.0)
              </a>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>100% Private & Free:</strong> Hosted securely inside your VaidyaMD instance. Bypasses cloud telecom subscription fees by using your standard mobile plan.
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button size="sm" onClick={onClose} className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
