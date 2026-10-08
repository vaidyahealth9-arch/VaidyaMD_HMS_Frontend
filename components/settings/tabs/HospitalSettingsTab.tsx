'use client';

import React, { useState, useRef } from 'react';
import { adminApi, getApiBase } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { resolveLogoUrl } from '@/components/common/PrintableReportHeader';
import {
  Building2,
  Upload,
  Printer,
  X,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Sparkles,
  RefreshCw,
  Palette,
  UploadCloud,
  Check,
  Clock,
} from 'lucide-react';

interface HospitalSettingsTabProps {
  hospitalProfile: any;
  setHospitalProfile: React.Dispatch<React.SetStateAction<any>>;
  hospitalBranches: any[];
  setHospitalBranches: React.Dispatch<React.SetStateAction<any[]>>;
  liveReceiptHeader: any;
  setLiveReceiptHeader: React.Dispatch<React.SetStateAction<any>>;
}

export default function HospitalSettingsTab({
  hospitalProfile,
  setHospitalProfile,
  hospitalBranches,
  setHospitalBranches,
  liveReceiptHeader,
  setLiveReceiptHeader,
}: HospitalSettingsTabProps) {
  const { setCurrentBranch } = useAuth();
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(0);
  const [isSavingHospital, setIsSavingHospital] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveHospitalProfile = async () => {
    if (!hospitalProfile) return;
    setIsSavingHospital(true);
    try {
      const curBranch = hospitalBranches[selectedBranchIndex];
      const updatedReceiptHeader = {
        ...liveReceiptHeader,
        logo_url: hospitalProfile.logo_url || liveReceiptHeader.logo_url,
      };
      const branchesPayload = curBranch
        ? [
            {
              branch_id: curBranch.id,
              name: curBranch.name,
              code: curBranch.code,
              address: curBranch.address,
              phone: curBranch.phone,
              email: curBranch.email,
              gstin: liveReceiptHeader.gstin || curBranch.gstin,
              receipt_header: updatedReceiptHeader,
            },
          ]
        : [];

      await adminApi.updateHospitalProfile({
        name: hospitalProfile.name,
        address: hospitalProfile.address,
        phone: hospitalProfile.phone,
        email: hospitalProfile.email,
        logo_url: hospitalProfile.logo_url,
        branches: branchesPayload,
      });

      setLiveReceiptHeader(updatedReceiptHeader);
      alert('Hospital profile and branch receipt configuration saved successfully!');
      adminApi.getHospitalProfile().then((data) => {
        setHospitalProfile(data.hospital);
        setHospitalBranches(data.branches || []);
        if (data.branches && data.branches.length > 0 && setCurrentBranch) {
          const matchingBranch = data.branches.find((b: any) => b.id === curBranch?.id) || data.branches[0];
          setCurrentBranch(matchingBranch);
        }
      });
    } catch (e: any) {
      alert(e.message || 'Failed to save hospital settings');
    } finally {
      setIsSavingHospital(false);
    }
  };

  // Logo Upload Handler — validates pixel dimensions first
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate dimensions before uploading
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { resolve({ width: 0, height: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });

    const MIN_W = 400, MAX_W = 2400, MIN_H = 60, MAX_H = 600;
    if (dims.width < MIN_W || dims.width > MAX_W || dims.height < MIN_H || dims.height > MAX_H) {
      alert(
        `Logo dimensions out of range.\n\n` +
        `Your image: ${dims.width} × ${dims.height} px\n` +
        `Required: width ${MIN_W}–${MAX_W} px, height ${MIN_H}–${MAX_H} px\n\n` +
        `Please crop or resize the image and try again.\n` +
        `(A horizontal/landscape logo 800–1600 px wide and 120–300 px tall works best.)`
      );
      e.target.value = '';
      return;
    }

    setIsUploadingLogo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'hospital_logo');
      formData.append('category', 'branding');
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/core/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      const newLogo = data.url;
      setHospitalProfile((prev: any) => ({ ...prev, logo_url: newLogo }));
      setLiveReceiptHeader((prev: any) => ({ ...prev, logo_url: newLogo }));
      // Immediately persist to backend so it is saved without requiring extra manual action
      try {
        await adminApi.updateHospitalProfile({ ...hospitalProfile, logo_url: newLogo });
      } catch (saveErr) {
        console.warn('Auto-persist logo notice:', saveErr);
      }
      alert(`Hospital logo uploaded successfully! (${dims.width} × ${dims.height} px)`);
    } catch (err: any) {
      alert('Failed to upload logo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Watermark / Background Image Upload Handler
  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWatermark(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'letterhead_watermark');
      formData.append('category', 'branding');
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/core/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      const newWatermark = data.url;
      setLiveReceiptHeader((prev: any) => ({ ...prev, watermark_url: newWatermark }));
      alert('Watermark background image uploaded successfully! View the live preview on the right.');
    } catch (err: any) {
      alert('Failed to upload watermark image: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingWatermark(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveWatermark = () => {
    setLiveReceiptHeader((prev: any) => ({ ...prev, watermark_url: '' }));
  };


  return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hospital Profile & Branch Header Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Hospital Legal Identity</h2>
                  <p className="text-[11px] text-slate-500">Global parent organization registered credentials</p>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  VID Prefix: {hospitalProfile?.code || '---'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hospital / Institute Name</label>
                  <input
                    type="text"
                    value={hospitalProfile?.name || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Hospital Email</label>
                  <input
                    type="email"
                    value={hospitalProfile?.email || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Central Helpline Phone</label>
                  <input
                    type="text"
                    value={hospitalProfile?.phone || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-semibold">Hospital Logo</label>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="text-[11px] text-primary hover:text-primary-mid font-semibold flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    {hospitalProfile?.logo_url && (
                      <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center p-0.5">
                        <img
                          src={resolveLogoUrl(hospitalProfile.logo_url)}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                          crossOrigin="anonymous"
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={hospitalProfile?.logo_url || ''}
                      onChange={(e) => setHospitalProfile({ ...hospitalProfile, logo_url: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                      placeholder="Upload file or enter URL..."
                    />
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Registered Headquarters Address</label>
                  <input
                    type="text"
                    value={hospitalProfile?.address || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Branch Selector & Receipt Customizer */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Branch Receipt & Invoice Letterhead</h2>
                  <p className="text-[11px] text-slate-500">Configure physical print headers for outpatient bills, lab reports & discharge summaries</p>
                </div>
                {/* Branch Switcher Pill */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {hospitalBranches.map((br, idx) => (
                    <button
                      key={br.id}
                      onClick={() => setSelectedBranchIndex(idx)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedBranchIndex === idx ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {br.name} {br.is_main_branch ? '⭐' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {hospitalBranches[selectedBranchIndex] && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Receipt Header Title</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.title || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, title: e.target.value })}
                        placeholder="e.g. Vaidya Institute of Reproductive Medicine"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tagline / Subtext</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.tagline || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, tagline: e.target.value })}
                        placeholder="e.g. Centre for Advanced Reproductive Genetics & IVF"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Branch GSTIN</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.gstin || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, gstin: e.target.value })}
                        placeholder="36AAAAA0000A1Z5"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">ART Clinic Reg. No.</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.art_reg_number || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, art_reg_number: e.target.value })}
                        placeholder="ART/TEL/HYD/2024/008"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">CEA / State Reg. No.</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.cea_reg_number || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, cea_reg_number: e.target.value })}
                        placeholder="CEA/HYD/8892"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Physical Address on Letterhead</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.address || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, address: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Contact Phone(s)</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.phone || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Website URL</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.website || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, website: e.target.value })}
                        placeholder="e.g. www.vaidyafertility.in"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Clinic Timings (for footer)</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.timings || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, timings: e.target.value })}
                        placeholder="e.g. Mon–Sat: 9:00 AM – 6:00 PM"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Statutory Invoice Footer / Disclaimer</label>
                    <textarea
                      rows={2}
                      value={liveReceiptHeader.disclaimer || ''}
                      onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, disclaimer: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs"
                    />
                  </div>

                  {/* ── Print Header Lines & Color Customization ── */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Palette className="w-4 h-4 text-primary" />
                      <span>Print Header Lines & Pre-printed Pad Dimensions</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Bold Accent Line Color */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <label className="block text-slate-700 font-semibold text-[11px]">
                          Bold Header & Footer Stripe (Primary)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={liveReceiptHeader.header_bold_color || '#4A2E2B'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_bold_color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={liveReceiptHeader.header_bold_color || '#4A2E2B'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_bold_color: e.target.value })}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono uppercase font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400">Presets:</span>
                          {[
                            { color: '#4A2E2B', label: 'Mahogany' },
                            { color: '#0B4F6C', label: 'Navy' },
                            { color: '#065F46', label: 'Emerald' },
                            { color: '#1E40AF', label: 'Royal' },
                            { color: '#334155', label: 'Slate' },
                          ].map((p) => (
                            <button
                              key={p.color}
                              type="button"
                              onClick={() => setLiveReceiptHeader({ ...liveReceiptHeader, header_bold_color: p.color })}
                              title={p.label}
                              className="w-4 h-4 rounded-full border border-white shadow-xs hover:scale-110 transition-transform"
                              style={{ background: p.color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Small / Thin Divider Line Color */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <label className="block text-slate-700 font-semibold text-[11px]">
                          Small Divider Line (Secondary)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={liveReceiptHeader.header_small_color || '#C29B7F'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_small_color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={liveReceiptHeader.header_small_color || '#C29B7F'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_small_color: e.target.value })}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono uppercase font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400">Presets:</span>
                          {[
                            { color: '#C29B7F', label: 'Warm Tan' },
                            { color: '#94A3B8', label: 'Subtle Slate' },
                            { color: '#D97706', label: 'Amber Gold' },
                            { color: '#E2A99B', label: 'Rose Gold' },
                            { color: '#64748B', label: 'Cool Gray' },
                          ].map((p) => (
                            <button
                              key={p.color}
                              type="button"
                              onClick={() => setLiveReceiptHeader({ ...liveReceiptHeader, header_small_color: p.color })}
                              title={p.label}
                              className="w-4 h-4 rounded-full border border-white shadow-xs hover:scale-110 transition-transform"
                              style={{ background: p.color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pre-printed Pad Spacing Dimensions */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                          Pad Header Spacing (Non-header prints)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={liveReceiptHeader.pad_header_height_mm ?? 35}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, pad_header_height_mm: Number(e.target.value) })}
                            className="w-28 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs font-bold"
                          />
                          <span className="text-xs text-slate-500 font-medium">mm (default: 35)</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                          Pad Footer Spacing (Non-header prints)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="80"
                            value={liveReceiptHeader.pad_footer_height_mm ?? 25}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, pad_footer_height_mm: Number(e.target.value) })}
                            className="w-28 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs font-bold"
                          />
                          <span className="text-xs text-slate-500 font-medium">mm (default: 25)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Background Watermark Upload & Configuration ── */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <UploadCloud className="w-4 h-4 text-primary" />
                        <span>Print Watermark / Background Image</span>
                      </div>
                      {liveReceiptHeader.watermark_url && (
                        <button
                          type="button"
                          onClick={handleRemoveWatermark}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Remove Watermark
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <input
                          ref={watermarkInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleWatermarkUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploadingWatermark}
                          onClick={() => watermarkInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-slate-300 hover:border-primary rounded-lg text-slate-700 font-semibold text-xs transition-colors bg-slate-50/50"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isUploadingWatermark ? 'Uploading...' : liveReceiptHeader.watermark_url ? 'Change Watermark Image' : 'Upload Watermark Image'}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          PNG or JPG (transparent background works best)
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                          Watermark Opacity: {Math.round((liveReceiptHeader.watermark_opacity ?? 0.08) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.02"
                          max="0.25"
                          step="0.01"
                          value={liveReceiptHeader.watermark_opacity ?? 0.08}
                          onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, watermark_opacity: parseFloat(e.target.value) })}
                          className="w-full cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Faint (2%)</span>
                          <span>Default (8%)</span>
                          <span>Vivid (25%)</span>
                        </div>
                      </div>
                    </div>

                    {liveReceiptHeader.watermark_url && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <img
                          src={resolveLogoUrl(liveReceiptHeader.watermark_url)}
                          alt="Watermark Preview"
                          className="w-12 h-12 object-contain bg-white rounded border border-slate-200 p-1"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800 block">Watermark Active</span>
                          <span className="text-[10px] text-slate-500">Will render centered behind content on all hospital prints</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveHospitalProfile}
                      disabled={isSavingHospital}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {isSavingHospital ? 'Saving Updates...' : 'Save & Publish Branding'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live A4 Physical Print Letterhead Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-500" />
                Live Side-by-Side A4 Receipt & Report Preview
              </span>
              <span className="text-[11px] text-slate-500">Reflects real-time input changes</span>
            </div>

            {/* A4 Sheet Container — mirrors PrintableReportHeader + PrintableReportFooter exactly */}
            <div className="bg-white border-2 border-slate-300 rounded-xl shadow-md font-sans text-slate-800 flex flex-col min-h-[700px] overflow-hidden relative">

              {/* Centered Watermark Background (matching reference photo) */}
              {liveReceiptHeader.watermark_url && (
                <div
                  className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0"
                  aria-hidden="true"
                >
                  <img
                    src={resolveLogoUrl(liveReceiptHeader.watermark_url)}
                    alt=""
                    className="w-64 max-h-64 object-contain"
                    style={{ opacity: liveReceiptHeader.watermark_opacity ?? 0.08 }}
                  />
                </div>
              )}

              {/* ── TOP BOLD ACCENT STRIPE (Full Bleed to Paper Edges) ── */}
              <div
                className="h-2 w-full relative z-10 block m-0 p-0"
                style={{
                  background: liveReceiptHeader.header_bold_color || '#4A2E2B',
                  borderTop: `6px solid ${liveReceiptHeader.header_bold_color || '#4A2E2B'}`,
                }}
              />

              {/* ── LOGO-ONLY CENTERED HEADER ── */}
              <div className="pb-3 pt-3 flex flex-col items-center justify-center text-center gap-1 px-6 relative z-10">
                {hospitalProfile?.logo_url || liveReceiptHeader?.logo_url ? (
                  <img
                    src={resolveLogoUrl(hospitalProfile?.logo_url || liveReceiptHeader?.logo_url)}
                    alt="Hospital Logo"
                    className="max-h-24 max-w-full object-contain mx-auto"
                    crossOrigin="anonymous"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow"
                      style={{ background: liveReceiptHeader.header_bold_color || '#4A2E2B' }}
                    >
                      {hospitalProfile?.name?.charAt(0) || 'V'}
                    </div>
                    <div className="text-left">
                      <h1 className="font-bold text-base leading-tight text-slate-900 tracking-wide uppercase">
                        {hospitalProfile?.name || 'HOSPITAL & FERTILITY INSTITUTE'}
                      </h1>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {liveReceiptHeader.tagline || 'Clinical Department & Medical Records'}
                      </p>
                    </div>
                  </div>
                )}
                {/* ── SMALL / THIN DIVIDER LINE UNDER LOGO ── */}
                <div
                  className="w-full mt-2"
                  style={{
                    height: '1.5px',
                    background: liveReceiptHeader.header_small_color || '#C29B7F',
                    borderTop: `1.5px solid ${liveReceiptHeader.header_small_color || '#C29B7F'}`,
                  }}
                />
              </div>

              {/* ── DOCUMENT TITLE ── */}
              <div className="text-center py-2 border-b border-slate-100 px-6 relative z-10">
                <h2 className="text-xs font-bold text-slate-900 tracking-wide uppercase">OFFICIAL INVOICE / CLINICAL REPORT</h2>
              </div>

              {/* ── PATIENT METADATA BANNER ── */}
              <div className="bg-slate-50/90 border-b border-slate-200 p-3 grid grid-cols-4 gap-3 text-[10px] px-6 relative z-10 backdrop-blur-2xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Patient</span>
                  <span className="font-bold text-slate-800">Priya Sharma</span>
                  <span className="text-slate-500 block">29Y / Female</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">VID / MRN</span>
                  <span className="font-bold font-mono text-slate-800">HYD01-2024-0012</span>
                  <span className="text-slate-500 block">Blood: A+</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Consultant</span>
                  <span className="font-bold text-slate-800">Dr. Ananya Rao</span>
                  <span className="text-slate-500 block">MD, DRM · TSMC-44912</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Document No.</span>
                  <span className="font-bold font-mono text-slate-800">INV-MAIN-00104</span>
                  <span className="text-slate-500 block">Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* ── SAMPLE LINE ITEMS ── */}
              <div className="flex-1 px-6 py-4 relative z-10">
                <table className="w-full text-left text-[10px] border border-slate-200 rounded overflow-hidden bg-white/95">
                  <thead className="bg-slate-100 text-slate-700 text-[9px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Service Description</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 px-3 font-medium">IVF ICSI Cycle Procedure Fee</td><td className="py-1.5 px-2 text-center">1</td><td className="py-1.5 px-2 text-right font-mono">₹1,20,000</td><td className="py-1.5 px-3 text-right font-mono">₹1,20,000</td></tr>
                    <tr><td className="py-1.5 px-3 font-medium">Follicular Monitoring Ultrasound</td><td className="py-1.5 px-2 text-center">4</td><td className="py-1.5 px-2 text-right font-mono">₹1,200</td><td className="py-1.5 px-3 text-right font-mono">₹4,800</td></tr>
                    <tr><td className="py-1.5 px-3 font-medium">LIMS Serum Estradiol (E2) Assay</td><td className="py-1.5 px-2 text-center">2</td><td className="py-1.5 px-2 text-right font-mono">₹800</td><td className="py-1.5 px-3 text-right font-mono">₹1,600</td></tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-[10px]">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right">Total Payable:</td>
                      <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: liveReceiptHeader.header_bold_color || '#4A2E2B' }}>
                        ₹1,26,400
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatory */}
                <div className="flex justify-between items-end mt-6 text-[10px] text-slate-500">
                  <p className="italic">{liveReceiptHeader.disclaimer || 'Computer-generated certified clinical documentation.'}</p>
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">Authorized Signatory</span>
                  </div>
                </div>
              </div>

              {/* ── FOOTER — matches PrintableReportFooter exactly (Full Bleed) ── */}
              <div className="relative z-10 mt-auto w-full">
                <div className="px-6 space-y-1 text-center">
                  {/* ── Small Divider Line Above Footer ── */}
                  <div
                    className="w-full"
                    style={{
                      height: '1.5px',
                      background: liveReceiptHeader.header_small_color || '#C29B7F',
                      borderTop: `1.5px solid ${liveReceiptHeader.header_small_color || '#C29B7F'}`,
                    }}
                  />

                  <div className="pt-2 pb-1 space-y-1">
                    {(hospitalProfile?.address || liveReceiptHeader?.address) && (
                      <div className="flex items-start justify-center gap-1 font-semibold text-slate-700 text-[9px]">
                        <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{hospitalProfile?.address || liveReceiptHeader?.address || 'Clinic Address'}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-x-2.5 text-[8.5px] text-slate-600 font-medium">
                      {(hospitalProfile?.phone || liveReceiptHeader?.phone) && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-2 h-2 text-slate-500" />
                          <span>{hospitalProfile?.phone || liveReceiptHeader?.phone}</span>
                        </div>
                      )}
                      {(hospitalProfile?.phone || liveReceiptHeader?.phone) && (hospitalProfile?.email || liveReceiptHeader?.email) && <span className="text-slate-300">|</span>}
                      {(hospitalProfile?.email || liveReceiptHeader?.email) && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-2 h-2 text-slate-500" />
                          <span>{hospitalProfile?.email || liveReceiptHeader?.email}</span>
                        </div>
                      )}
                      {(liveReceiptHeader?.website) && <><span className="text-slate-300">|</span><div className="flex items-center gap-1"><Globe className="w-2 h-2 text-slate-500" /><span>{liveReceiptHeader.website}</span></div></>}
                      {(liveReceiptHeader?.timings) && <><span className="text-slate-300">|</span><div className="flex items-center gap-1"><Clock className="w-2 h-2 text-slate-500" /><span>{liveReceiptHeader.timings}</span></div></>}
                    </div>
                  </div>

                  {/* Dynamic Page Counter & Certification */}
                  <div className="flex items-center justify-between text-[8px] text-slate-400 pb-1">
                    <span className="italic truncate">{liveReceiptHeader.disclaimer || 'Certified computer-generated medical record.'}</span>
                    <span className="font-mono font-medium shrink-0">Page 1 of 1</span>
                  </div>
                </div>

                {/* ── BOTTOM BOLD ACCENT STRIPE (Full Bleed to Paper Edges) ── */}
                <div
                  className="h-2 w-full block m-0 p-0"
                  style={{
                    backgroundColor: liveReceiptHeader.header_bold_color || '#4A2E2B',
                    borderTop: `6px solid ${liveReceiptHeader.header_bold_color || '#4A2E2B'}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

  );
}
