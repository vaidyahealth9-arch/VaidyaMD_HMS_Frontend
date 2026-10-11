'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { LeadSource } from '../types';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: {
    name: string;
    phone: string;
    city?: string;
    source: LeadSource;
    source_campaign?: string;
    notes_summary?: string;
  }) => void;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [source, setSource] = useState<LeadSource>('excel_import');
  const [campaign, setCampaign] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim() || undefined,
      source,
      source_campaign: campaign.trim() || undefined,
      notes_summary: notes.trim() || undefined,
    });

    setName('');
    setPhone('');
    setCity('');
    setCampaign('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">Add New Patient Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Patient Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
              className="text-xs h-9"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              required
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">City / Location</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Acquisition Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full h-9 rounded-md border border-slate-200 px-2.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              >
                <option value="google_ads">Google Ads</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="website">Website</option>
                <option value="doctor_referral">Doctor Referral</option>
                <option value="walk_in">Walk-in Inquiry</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="excel_import">Excel / List Import</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Source Campaign Name</label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. Fertility Camp Oct 2026"
              className="text-xs h-9"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notes / Inquiry Summary</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter initial inquiry remarks or reason for consultation..."
              rows={2}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
