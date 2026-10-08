'use client';

import React from 'react';
import {
  Plus,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/lib/utils';

interface BedboardTabProps {
  wards: any[];
  beds: any[];
  selectedWardId: string;
  setSelectedWardId: (id: string) => void;
  onAdmit: (bed: any) => void;
  onDischarge: (admissionId: string) => void;
  onCleanBed: (bedId: string) => void;
}

export default function BedboardTab({
  wards,
  beds,
  selectedWardId,
  setSelectedWardId,
  onAdmit,
  onDischarge,
  onCleanBed,
}: BedboardTabProps) {
  return (
    <div className="space-y-4 pt-2">
          {/* Ward Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedWardId('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                selectedWardId === 'all'
                  ? 'bg-[rgb(var(--clr-primary))] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Wards ({beds.length})
            </button>
            {wards.map((w: any) => (
              <button
                key={w.id}
                onClick={() => setSelectedWardId(w.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  selectedWardId === w.id
                    ? 'bg-[rgb(var(--clr-primary))] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {w.name} (₹{w.base_charge_per_day}/day)
              </button>
            ))}
          </div>

          {/* Bed Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beds.map((bed: any) => {
              const isOccupied = bed.status === 'Occupied';
              const isCleaning = bed.status === 'Cleaning';
              const isVacant = bed.status === 'Vacant' || bed.status?.toLowerCase() === 'available';

              return (
                <Card
                  key={bed.id}
                  className={`overflow-hidden border-2 transition-all hover:shadow-md ${
                    isOccupied
                      ? 'border-red-300 bg-gradient-to-b from-red-50/50 to-white'
                      : isCleaning
                      ? 'border-amber-300 bg-gradient-to-b from-amber-50/50 to-white'
                      : 'border-emerald-300 bg-gradient-to-b from-emerald-50/50 to-white'
                  }`}
                >
                  <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{bed.bed_type} Bed</span>
                      <CardTitle className="text-sm font-bold text-slate-900">{bed.bed_number}</CardTitle>
                    </div>
                    <Badge
                      variant={isOccupied ? 'destructive' : isCleaning ? 'warning' : 'success'}
                      className="text-[10px] font-bold uppercase"
                    >
                      {bed.status}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-3.5 space-y-3">
                    {isOccupied && bed.current_admission ? (
                      <div className="space-y-2 text-xs">
                        <div className="bg-white p-2.5 rounded-md border border-red-100 shadow-sm">
                          <p className="font-bold text-slate-900 text-sm truncate">{bed.current_admission.patient_name}</p>
                          <p className="text-[11px] text-[rgb(var(--clr-primary))] font-semibold">{bed.current_admission.patient_mrn}</p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Dx: {bed.current_admission.diagnosis || 'Observation'}</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Accrued:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(bed.current_admission.total_accrued_amount || bed.daily_rate)}</span>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDischarge(bed.current_admission.admission_id)}
                            className="flex-1 h-8 rounded-lg text-xs font-bold gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Discharge</span>
                          </Button>
                        </div>
                      </div>
                    ) : isCleaning ? (
                      <div className="space-y-3 text-center py-2">
                        <p className="text-xs text-amber-800 font-medium">Under housekeeping / disinfection cycle</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCleanBed(bed.id)}
                          className="w-full h-8 rounded-lg text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Mark Sanitized & Vacant</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center py-2">
                        <p className="text-xs text-emerald-800 font-semibold">Rate: {formatCurrency(bed.daily_rate)} / day</p>
                        <Button
                          size="sm"
                          onClick={() => onAdmit(bed)}
                          className="w-full h-8 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Admit Patient</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
    </div>
  );
}
