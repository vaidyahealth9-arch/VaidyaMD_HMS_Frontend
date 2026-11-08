'use client';

import React from 'react';
import {
  Plus,
  LogOut,
  CheckCircle2,
  Receipt,
  Settings,
  ArrowRightLeft,
  Stethoscope,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Ward, Bed } from '@/features/ipd/types';

interface BedboardTabProps {
  wards: Ward[];
  beds: Bed[];
  selectedWardId: string;
  setSelectedWardId: (id: string) => void;
  onAdmit: (bed: Bed) => void;
  onOpenChart: (admissionId: string) => void;
  onTransfer: (admission: any) => void;
  onDischarge: (admissionId: string) => void;
  onInterimBill?: (admissionId: string) => void;
  onCleanBed: (bedId: string) => void;
  onManageWards: () => void;
  onAccrueCharges?: () => void;
}

export default function BedboardTab({
  wards,
  beds,
  selectedWardId,
  setSelectedWardId,
  onAdmit,
  onOpenChart,
  onTransfer,
  onDischarge,
  onInterimBill,
  onCleanBed,
  onManageWards,
  onAccrueCharges,
}: BedboardTabProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* Ward Filter Pills & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedWardId('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors shrink-0 ${
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
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors shrink-0 ${
                selectedWardId === w.id
                  ? 'bg-[rgb(var(--clr-primary))] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {w.name} (₹{w.base_charge_per_day}/d)
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onAccrueCharges && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAccrueCharges}
              className="h-8 text-xs font-semibold gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50"
              title="Manually calculate and accrue today's room charges for active census"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>Accrue Tariff</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onManageWards}
            className="h-8 text-xs font-semibold gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Manage Wards & Beds</span>
          </Button>
        </div>
      </div>

      {/* Bed Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {beds.map((bed: any) => {
          const isOccupied = bed.status === 'Occupied';
          const isCleaning = bed.status === 'Cleaning';
          const isMaint = bed.status === 'Maintenance';
          const isVacant = bed.status === 'Vacant' || bed.status?.toLowerCase() === 'available';

          const adm = bed.current_admission;

          return (
            <Card
              key={bed.id}
              className={`overflow-hidden border-2 transition-all hover:shadow-md ${
                isOccupied
                  ? 'border-red-300 bg-gradient-to-b from-red-50/40 via-white to-white'
                  : isCleaning
                  ? 'border-amber-300 bg-gradient-to-b from-amber-50/50 to-white'
                  : isMaint
                  ? 'border-slate-300 bg-slate-50 opacity-80'
                  : 'border-emerald-300 bg-gradient-to-b from-emerald-50/40 via-white to-white'
              }`}
            >
              <CardHeader className="p-3 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    {bed.bed_type} Bed
                  </span>
                  <CardTitle className="text-sm font-bold text-slate-900">{bed.bed_number}</CardTitle>
                </div>
                <Badge
                  variant={isOccupied ? 'destructive' : isCleaning || isMaint ? 'warning' : 'success'}
                  className="text-[10px] font-bold uppercase"
                >
                  {bed.status}
                </Badge>
              </CardHeader>

              <CardContent className="p-3 space-y-2.5">
                {isOccupied && adm ? (
                  <div className="space-y-2 text-xs">
                    {/* Patient Info Card with Click to open Chart */}
                    <div
                      onClick={() => onOpenChart(adm.admission_id)}
                      className="bg-white p-2.5 rounded-lg border border-red-100 shadow-xs hover:border-red-300 cursor-pointer transition-all space-y-1"
                      title="Click to open Inpatient Bedside Chart"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm truncate">{adm.patient_name}</p>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          Chart ➔
                        </span>
                      </div>
                      <p className="text-[11px] text-[rgb(var(--clr-primary))] font-semibold font-mono">
                        {adm.patient_mrn}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Dx: {adm.diagnosis || 'Clinical Observation'}
                      </p>

                      {/* Safety Flags */}
                      <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                        {adm.allergies && adm.allergies.length > 0 && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">
                            Allergies ({adm.allergies.length})
                          </span>
                        )}
                        {adm.risk_factors?.fall_risk && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                            Fall Risk
                          </span>
                        )}
                        {adm.risk_factors?.npo && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-100 text-red-800 rounded">
                            NPO
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                      <span>Room Accrued:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(adm.total_accrued_amount || bed.daily_rate)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onTransfer({
                            admission_id: adm.admission_id,
                            patient_name: adm.patient_name,
                            bed_number: bed.bed_number,
                            ward_name: bed.ward_name,
                          })
                        }
                        className="h-7 rounded-md text-[11px] font-semibold px-1 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
                        title="Transfer to another vacant bed"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                        <span>Shift</span>
                      </Button>

                      {onInterimBill && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onInterimBill(adm.admission_id)}
                          className="h-7 rounded-md text-[11px] font-semibold px-1 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
                          title="Generate interim bill"
                        >
                          <Receipt className="w-3 h-3 text-slate-500" />
                          <span>Bill</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDischarge(adm.admission_id)}
                        className="h-7 rounded-md text-[11px] font-bold px-1 gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Discharge</span>
                      </Button>
                    </div>
                  </div>
                ) : isCleaning ? (
                  <div className="space-y-2.5 text-center py-2">
                    <p className="text-xs text-amber-800 font-medium">Housekeeping disinfection cycle</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCleanBed(bed.id)}
                      className="w-full h-8 rounded-lg text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Mark Sanitized</span>
                    </Button>
                  </div>
                ) : isMaint ? (
                  <div className="space-y-2 text-center py-2">
                    <p className="text-xs text-slate-500 font-medium">Under maintenance / repairs</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCleanBed(bed.id)}
                      className="w-full h-8 rounded-lg text-xs font-bold border-slate-300 text-slate-700"
                    >
                      <span>Return to Service</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-center py-2">
                    <p className="text-xs text-emerald-800 font-semibold">
                      Tariff: {formatCurrency(bed.daily_rate)} / day
                    </p>
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
