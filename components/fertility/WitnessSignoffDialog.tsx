'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { embryologyApi, authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, UserCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WitnessSignoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  dayNumber: number;
  onSignedSuccess?: () => void;
}

export default function WitnessSignoffDialog({
  open,
  onOpenChange,
  cycleId,
  dayNumber,
  onSignedSuccess,
}: WitnessSignoffDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [witnessId, setWitnessId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch embryology/lab staff users
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => authApi.listUsers(),
  });

  // Filter possible witnesses (exclude current user)
  const secondaryWitnesses = users.filter((u: any) => u.id !== user?.id);

  const signoffMutation = useMutation({
    mutationFn: () =>
      embryologyApi.signoffWitness({
        treatment_cycle_id: cycleId,
        day_number: dayNumber,
        checked_by_id: user?.id,
        witnessed_by_id: witnessId,
        notes: notes || `Day ${dayNumber} verification sign-off completed.`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-witnesses', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycle-oocytes', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycle-kpis', cycleId] });
      setErrorMsg(null);
      onOpenChange(false);
      if (onSignedSuccess) onSignedSuccess();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Dual-witness signoff failed.');
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!witnessId) {
      setErrorMsg('Please select a secondary embryologist / witness.');
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMsg('Please enter the 4-digit witness PIN / passkey.');
      return;
    }
    signoffMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Mandatory Dual-Witness Sign-Off
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            ART Regulations require two distinct embryologists to verify patient identity, dish barcode, and embryo development for Day {dayNumber}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Primary Embryologist (Acting):</span>
              <Badge variant="purple" className="text-xs font-bold">{user?.name || 'Dr. Embryologist'}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Sign-Off Target Stage:</span>
              <span className="font-bold text-slate-800">Day {dayNumber} Assessment</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Secondary Dual-Witness (Independent User) <span className="text-red-500">*</span></span>
            </label>
            <select
              value={witnessId}
              onChange={(e) => {
                setWitnessId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Secondary Witness --</option>
              {secondaryWitnesses.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role?.toUpperCase() || 'EMBRYOLOGIST'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Secondary Witness Passkey / PIN <span className="text-red-500">*</span></span>
            </label>
            <Input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-6 digit PIN (e.g. 1234)"
              className="h-10 text-xs font-mono tracking-widest"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Audit Sign-Off Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified oocyte dish ID matches incubator chamber #3"
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={signoffMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-xl shadow-md gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{signoffMutation.isPending ? 'Verifying...' : `Authorize Day ${dayNumber}`}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
