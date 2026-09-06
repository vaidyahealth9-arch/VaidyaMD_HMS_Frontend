'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { embryologyApi } from '@/lib/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import WitnessSignoffDialog from './WitnessSignoffDialog';
import {
  ShieldAlert,
  ShieldCheck,
  Percent,
  Sparkles,
  Layers,
  CheckCircle,
  Plus,
  Loader2,
} from 'lucide-react';

interface OocyteGridTableProps {
  cycleId: string;
}

export default function OocyteGridTable({ cycleId }: OocyteGridTableProps) {
  const queryClient = useQueryClient();
  const [witnessDialogOpen, setWitnessDialogOpen] = useState(false);
  const [targetWitnessDay, setTargetWitnessDay] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Oocytes
  const { data: oocytes = [], isLoading: oocytesLoading } = useQuery({
    queryKey: ['cycle-oocytes', cycleId],
    queryFn: () => embryologyApi.getOocytes(cycleId),
    enabled: !!cycleId,
  });

  // Fetch Dual-Witness Records
  const { data: witnesses = [] } = useQuery({
    queryKey: ['cycle-witnesses', cycleId],
    queryFn: () => embryologyApi.getWitnesses(cycleId),
    enabled: !!cycleId,
  });

  // Fetch Live KPIs
  const { data: kpiData } = useQuery({
    queryKey: ['cycle-kpis', cycleId],
    queryFn: () => embryologyApi.getCycleKPIs(cycleId),
    enabled: !!cycleId,
  });

  // Batch create oocytes if empty
  const batchCreateMutation = useMutation({
    mutationFn: () =>
      embryologyApi.batchCreateOocytes({
        treatment_cycle_id: cycleId,
        count: 10,
        procedure_type: 'ICSI',
        default_maturity: 'MII',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-oocytes', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycle-kpis', cycleId] });
    },
  });

  // Update Oocyte Day Mutation
  const updateDayMutation = useMutation({
    mutationFn: (payload: { oocyte_id: string; day_number: number; day_data: any; fert_check?: string; disposition?: any }) =>
      embryologyApi.updateOocyteDay(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-oocytes', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycle-kpis', cycleId] });
      setErrorMessage(null);
    },
    onError: (err: any, variables) => {
      // If 422 error from witness gate, trigger modal for prior day
      if (err.status === 422 || err.message?.includes('DUAL-WITNESSING GATE') || err.message?.includes('422')) {
        setTargetWitnessDay(variables.day_number - 1);
        setWitnessDialogOpen(true);
        setErrorMessage(`Day ${variables.day_number - 1} witness sign-off is required before grading Day ${variables.day_number}.`);
      } else {
        setErrorMessage(err.message || 'Failed to update oocyte record.');
      }
    },
  });

  const isDaySigned = (dayNum: number) => {
    return witnesses.some((w: any) => w.day_number === dayNum && w.is_verified);
  };

  const handleCellChange = (oocyteId: string, dayNumber: number, field: string, val: string) => {
    const oocyte = oocytes.find((o: any) => o.id === oocyteId);
    if (!oocyte) return;

    if (dayNumber === 1 && field === 'fert_check') {
      updateDayMutation.mutate({
        oocyte_id: oocyteId,
        day_number: 1,
        day_data: { pn_details: val },
        fert_check: val,
      });
    } else if (dayNumber >= 2 && dayNumber <= 4) {
      updateDayMutation.mutate({
        oocyte_id: oocyteId,
        day_number: dayNumber,
        day_data: { [field]: val },
      });
    } else if (dayNumber >= 5 && dayNumber <= 6) {
      updateDayMutation.mutate({
        oocyte_id: oocyteId,
        day_number: dayNumber,
        day_data: { stage: 'Blastocyst', gardner: val },
      });
    } else if (field === 'disposition') {
      updateDayMutation.mutate({
        oocyte_id: oocyteId,
        day_number: 6,
        day_data: {},
        disposition: { status: val, date: new Date().toISOString() },
      });
    }
  };

  const kpis = kpiData?.kpis || {
    fertilization_rate_pct: 0,
    cleavage_rate_pct: 0,
    blastocyst_rate_pct: 0,
    utilization_rate_pct: 0,
  };

  return (
    <div className="space-y-4">
      {/* LIVE KPI HEADER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fertilization Rate (2PN/MII)</p>
              <h3 className="text-2xl font-extrabold text-indigo-700 mt-0.5">{kpis.fertilization_rate_pct}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cleavage Rate (Day 2-3)</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-0.5">{kpis.cleavage_rate_pct}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blastocyst Rate (Day 5-6)</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-0.5">{kpis.blastocyst_rate_pct}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Embryo Utilization Rate</p>
              <h3 className="text-2xl font-extrabold text-blue-700 mt-0.5">{kpis.utilization_rate_pct}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DUAL-WITNESSING GATE STATUS BAR */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Dual-Witnessing Gate Status</h4>
            <p className="text-[10px] text-slate-500">Every day step requires 2 independent embryologists sign-off</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const signed = isDaySigned(day);
            return (
              <Button
                key={day}
                size="sm"
                variant={signed ? 'default' : 'outline'}
                onClick={() => {
                  setTargetWitnessDay(day);
                  setWitnessDialogOpen(true);
                }}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold gap-1 ${
                  signed ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <span>Day {day}</span>
                {signed ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3 text-amber-600" />}
              </Button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <Button
            size="sm"
            onClick={() => setWitnessDialogOpen(true)}
            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            Sign-Off Day {targetWitnessDay} Now
          </Button>
        </div>
      )}

      {/* DENSE OOCYTE TRACKING GRID TABLE */}
      {oocytes.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-slate-600">No oocytes recorded for this cycle yet (Day 0 OPU).</p>
          <Button
            onClick={() => batchCreateMutation.mutate()}
            disabled={batchCreateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{batchCreateMutation.isPending ? 'Creating...' : 'Initialize Day 0 Cohort (10 Oocytes)'}</span>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="text-[11px]">
                <TableHead className="w-16 font-bold">#</TableHead>
                <TableHead className="font-bold">Day 0 (OPU / Maturity)</TableHead>
                <TableHead className="font-bold">Day 1 (Fert Check)</TableHead>
                <TableHead className="font-bold">Day 2 (Cleavage)</TableHead>
                <TableHead className="font-bold">Day 3 (8-Cell)</TableHead>
                <TableHead className="font-bold">Day 5 (Blastocyst)</TableHead>
                <TableHead className="font-bold">Day 6 (Expansion)</TableHead>
                <TableHead className="font-bold">Embryo Disposition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oocytes.map((o: any) => (
                <TableRow key={o.id} className="hover:bg-slate-50/80 text-xs">
                  <TableCell className="font-bold text-slate-900 bg-slate-50/50">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-[11px]">
                      {o.oocyte_number}
                    </span>
                  </TableCell>

                  {/* Day 0 */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="purple" className="text-[10px] font-bold">{o.procedure_type || 'ICSI'}</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold bg-white text-indigo-700">{o.maturity_day0 || 'MII'}</Badge>
                    </div>
                  </TableCell>

                  {/* Day 1: Fert Check */}
                  <TableCell>
                    <select
                      value={o.fert_check_day1 || ''}
                      onChange={(e) => handleCellChange(o.id, 1, 'fert_check', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Pending --</option>
                      <option value="2PN">2PN (Normal)</option>
                      <option value="1PN">1PN (Abnormal)</option>
                      <option value="3PN+">3PN+ (Polyspermy)</option>
                      <option value="0PN">0PN (Unfertilized)</option>
                      <option value="Degenerated">Degenerated</option>
                    </select>
                  </TableCell>

                  {/* Day 2 */}
                  <TableCell>
                    <select
                      value={o.day2_data?.cells || ''}
                      onChange={(e) => handleCellChange(o.id, 2, 'cells', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">--</option>
                      <option value="2">2-Cell (Grade 1)</option>
                      <option value="4">4-Cell (Grade 1)</option>
                      <option value="3">3-Cell (Uneven)</option>
                      <option value="Arrested">Arrested</option>
                    </select>
                  </TableCell>

                  {/* Day 3 */}
                  <TableCell>
                    <select
                      value={o.day3_data?.cells || ''}
                      onChange={(e) => handleCellChange(o.id, 3, 'cells', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">--</option>
                      <option value="8">8-Cell (Grade 1)</option>
                      <option value="6">6-Cell (Grade 2)</option>
                      <option value="10">10-Cell (Grade 1)</option>
                      <option value="Compacting">Compacting Morula</option>
                      <option value="Arrested">Arrested</option>
                    </select>
                  </TableCell>

                  {/* Day 5: Gardner Grading */}
                  <TableCell>
                    <select
                      value={o.day5_data?.gardner || ''}
                      onChange={(e) => handleCellChange(o.id, 5, 'gardner', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-purple-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">--</option>
                      <option value="4AA">4AA (Top Quality)</option>
                      <option value="4AB">4AB (Good)</option>
                      <option value="4BA">4BA (Good)</option>
                      <option value="3BB">3BB (Fair)</option>
                      <option value="2CB">2CB (Early/Poor)</option>
                      <option value="Morula">Morula</option>
                      <option value="Arrested">Arrested</option>
                    </select>
                  </TableCell>

                  {/* Day 6 */}
                  <TableCell>
                    <select
                      value={o.day6_data?.gardner || ''}
                      onChange={(e) => handleCellChange(o.id, 6, 'gardner', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">--</option>
                      <option value="5AA">5AA (Hatching Top)</option>
                      <option value="6AA">6AA (Hatched Top)</option>
                      <option value="4BB">4BB (Good)</option>
                      <option value="Arrested">Arrested</option>
                    </select>
                  </TableCell>

                  {/* Disposition */}
                  <TableCell>
                    <select
                      value={o.disposition?.status || ''}
                      onChange={(e) => handleCellChange(o.id, 6, 'disposition', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Action --</option>
                      <option value="Transferred">Fresh Transfer</option>
                      <option value="Frozen">Vitrified / Frozen</option>
                      <option value="PGT_Biopsied">PGT Biopsied</option>
                      <option value="Discarded">Discarded</option>
                      <option value="Arrested">Arrested</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DUAL-WITNESS SIGN-OFF MODAL */}
      <WitnessSignoffDialog
        open={witnessDialogOpen}
        onOpenChange={setWitnessDialogOpen}
        cycleId={cycleId}
        dayNumber={targetWitnessDay}
      />
    </div>
  );
}
