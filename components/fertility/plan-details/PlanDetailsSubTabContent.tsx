'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Save, Check, FileSpreadsheet, Activity } from 'lucide-react';
import {
  PlanViewMode,
  PlanTimelineItem,
  TreatmentCycleRecord,
} from './types';
import {
  flattenDaysToTimelineItems,
  calculateFollicleStats,
  formatDoseDisplay,
  generateDaysFromProtocol,
  getProtocolActualDays,
  fillMissingCalendarDays,
} from './utils';
import { treatmentCyclesApi, protocolsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

import PlanDetailsDateFilterBar from './PlanDetailsDateFilterBar';
import FollicleCohortSummaryCard from './FollicleCohortSummaryCard';
import PlanDetailsTimelineTable from './PlanDetailsTimelineTable';
import StimulationCalendar7DayView from './StimulationCalendar7DayView';
import InsertEditPlanModal from './InsertEditPlanModal';
import TakeawayCalendarModal from './TakeawayCalendarModal';
import QuickScanEditModal from './QuickScanEditModal';
import StimulationBatchActionBar, { BatchOperationMode } from './StimulationBatchActionBar';
import BatchDeleteConfirmModal from './BatchDeleteConfirmModal';
import BatchAddEventModal, { BatchAddEventPayload } from './BatchAddEventModal';
import BatchModifyMedModal, { BatchModifyMedPayload } from './BatchModifyMedModal';
import HrtFetProtocolSheet from '@/components/fertility/HrtFetProtocolSheet';

interface PlanDetailsSubTabContentProps {
  activeCycle?: TreatmentCycleRecord | any;
  cycleCalendar?: any;
  initialDays?: any[];
  onDaysChange?: (days: any[], protocolInfo?: { protocolId: string; protocolName: string }) => void;
  patient?: any;
  partner?: any;
  onRefreshData?: () => void;
  isWizardStep?: boolean;
  onNavigateNext?: () => void;
}

export default function PlanDetailsSubTabContent({
  activeCycle,
  cycleCalendar,
  initialDays,
  onDaysChange,
  patient,
  partner,
  onRefreshData,
  isWizardStep = false,
  onNavigateNext,
}: PlanDetailsSubTabContentProps) {
  const [viewMode, setViewMode] = useState<PlanViewMode>('timeline_ledger');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [showInsertPlanModal, setShowInsertPlanModal] = useState(false);
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);
  const [takeawayLogoMode, setTakeawayLogoMode] = useState(true);
  const [editingScanDay, setEditingScanDay] = useState<any | null>(null);
  const [isBatchModeActive, setIsBatchModeActive] = useState(false);
  const [batchMode, setBatchMode] = useState<BatchOperationMode>('modify');
  const [activeMedName, setActiveMedName] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [showBatchAddModal, setShowBatchAddModal] = useState(false);
  const [showBatchAdvanceModal, setShowBatchAdvanceModal] = useState(false);



  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [localDays, setLocalDays] = useState<any[]>([]);

  // Modality auto-detection (FET vs Stimulation)
  const isFetModality = useMemo(() => {
    const type = (activeCycle?.treatment_type || '').toUpperCase();
    return type.includes('FET') || Boolean(activeCycle?.sentinel_dates?.is_hrt_fet);
  }, [activeCycle?.treatment_type, activeCycle?.sentinel_dates]);

  const activeSheetType = isFetModality ? 'hrt_fet' : 'stimulation';

  useEffect(() => {
    if (initialDays && initialDays.length > 0) {
      setLocalDays(initialDays);
    } else if (cycleCalendar?.days && cycleCalendar.days.length > 0) {
      setLocalDays(cycleCalendar.days);
    } else if (activeCycle?.medication_calendar && activeCycle.medication_calendar.length > 0) {
      setLocalDays(activeCycle.medication_calendar);
    } else {
      // Auto-populate from protocol if days are currently empty!
      const protoName = activeCycle?.sentinel_dates?.protocol_name;
      const protoId = (activeCycle as any)?.protocol_template_id;
      protocolsApi
        .list({ include_inactive: false })
        .then((res: any) => {
          if (Array.isArray(res) && res.length > 0) {
            const matched =
              (protoId && res.find((p: any) => p.id === protoId)) ||
              (protoName && res.find((p: any) => p.name?.trim().toLowerCase() === protoName.trim().toLowerCase())) ||
              res[0];
            if (matched) {
              const startRef =
                activeCycle?.start_date ||
                activeCycle?.sentinel_dates?.stim_start ||
                activeCycle?.sentinel_dates?.lmp_day1 ||
                new Date().toISOString().split('T')[0];
              const actualDays = getProtocolActualDays(matched, activeCycle?.sentinel_dates, activeCycle?.treatment_type);
              const gen = generateDaysFromProtocol(matched, startRef, actualDays, activeCycle?.sentinel_dates, activeCycle?.treatment_type);
              if (gen && gen.length > 0) {
                updateDays(gen, { protocolId: matched.id, protocolName: matched.name });
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [initialDays, cycleCalendar?.days, activeCycle?.medication_calendar, activeCycle?.protocol_template_id, activeCycle?.sentinel_dates?.protocol_name]);

  const activeDays = useMemo(() => {
    let source: any[] = [];
    if (localDays.length > 0) source = localDays;
    else if (initialDays && initialDays.length > 0) source = initialDays;
    else if (cycleCalendar?.days && cycleCalendar.days.length > 0) source = cycleCalendar.days;
    else if (activeCycle?.medication_calendar && activeCycle.medication_calendar.length > 0) source = activeCycle.medication_calendar;
    return fillMissingCalendarDays(source);
  }, [localDays, initialDays, cycleCalendar?.days, activeCycle?.medication_calendar]);

  const drugList = useMemo(() => {
    const set = new Set<string>([
      'rFSH (Gonal-F / Rekovelle)',
      'HMG (Menopur)',
      'GnRH Antagonist (Cetrotide / Orgalutran)',
      'GnRH Agonist (Leuprolide / Lupride)',
      'r-hCG / Ovitrelle 250mcg',
      'Progesterone (Susten / Gestone)',
      'Estradiol Valerate (Progynova)',
      'Aspirin 75mg',
      'Low Molecular Weight Heparin (Clexane)',
    ]);
    activeDays.forEach((d: any) => {
      (d.medications || []).forEach((m: any) => {
        const name = m.drug_name || m.name;
        if (name) set.add(name);
      });
    });
    return Array.from(set);
  }, [activeDays]);



  const handleToggleSelectDay = (dayNum: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleSelectAllDays = (selectAll: boolean) => {
    const visibleDays = Array.from(new Set(filteredTimelineItems.map((i) => i.day_number))).filter(Boolean);
    setSelectedDays(selectAll ? visibleDays : []);
  };

  const handleToggleSelectItem = (itemId: string, item?: PlanTimelineItem) => {
    const targetItem = item || timelineItems.find((x) => x.id === itemId);
    if (!targetItem) return;

    if (batchMode === 'modify') {
      if (targetItem.category !== 'medication') return;

      // Smart Auto-Select with Exclusion: If starting new med selection
      if (!activeMedName || activeMedName.toLowerCase() !== targetItem.name.toLowerCase()) {
        setActiveMedName(targetItem.name);
        const matchingIds = timelineItems
          .filter(
            (i) =>
              i.category === 'medication' &&
              i.name.toLowerCase() === targetItem.name.toLowerCase()
          )
          .map((i) => i.id);
        setSelectedItemIds(matchingIds);
        const matchingDays = Array.from(
          new Set(
            timelineItems
              .filter(
                (i) =>
                  i.category === 'medication' &&
                  i.name.toLowerCase() === targetItem.name.toLowerCase()
              )
              .map((i) => i.day_number)
          )
        );
        setSelectedDays(matchingDays);
      } else {
        // Uncheck to exclude a specific day
        setSelectedItemIds((prev) => {
          const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
          if (next.length === 0) {
            setActiveMedName(null);
            setSelectedDays([]);
          } else {
            const nextDays = Array.from(
              new Set(timelineItems.filter((i) => next.includes(i.id)).map((i) => i.day_number))
            );
            setSelectedDays(nextDays);
          }
          return next;
        });
      }
    } else {
      // In delete mode or general multi-select
      setSelectedItemIds((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    }
  };

  const handleSelectAllItems = (selectAll: boolean) => {
    if (batchMode === 'modify') {
      if (!selectAll) {
        setSelectedItemIds([]);
        setActiveMedName(null);
        setSelectedDays([]);
      }
    } else {
      setSelectedItemIds(selectAll ? filteredTimelineItems.map((item) => item.id) : []);
    }
  };

  const handleQuickApplyDose = (newDose: string) => {
    if (!activeMedName || selectedItemIds.length === 0) return;
    const targetItems = timelineItems.filter((i) => selectedItemIds.includes(i.id));
    const targetDayNumbers = new Set(targetItems.map((i) => i.day_number));

    const nextDays = activeDays.map((d: any) => {
      if (!targetDayNumbers.has(d.day_number)) return d;
      const meds = (d.medications || []).map((m: any) => {
        if ((m.drug_name || m.name || '').toLowerCase() === activeMedName.toLowerCase()) {
          return {
            ...m,
            dose: newDose,
            dose_display: formatDoseDisplay(newDose),
          };
        }
        return m;
      });
      return { ...d, medications: meds };
    });

    updateDays(nextDays);
    toast.success('Dose Updated', `Updated ${activeMedName} to ${newDose} across ${targetDayNumbers.size} days.`);
    setSelectedItemIds([]);
    setSelectedDays([]);
    setActiveMedName(null);
  };

  const handleQuickPresetDays = (preset: 'all' | 'stim' | 'next5' | 'clear') => {
    const allDayNums = Array.from(new Set(activeDays.map((d: any) => d.day_number))).sort((a, b) => a - b);
    if (preset === 'all') {
      setSelectedDays(allDayNums);
    } else if (preset === 'stim') {
      const stims = activeDays
        .filter((d: any) => d.day_number >= 2 && d.day_number <= 11)
        .map((d: any) => d.day_number);
      setSelectedDays(stims.length > 0 ? stims : allDayNums.slice(1, 10));
    } else if (preset === 'next5') {
      setSelectedDays(allDayNums.slice(0, 5));
    } else {
      setSelectedDays([]);
    }
  };

  const handleApplyAdvanceModify = (payload: BatchModifyMedPayload) => {
    if (!activeMedName || selectedDays.length === 0) return;
    const { dose, route, frequency, instructions } = payload;
    const targetDaysSet = new Set(selectedDays);

    const nextDays = activeDays.map((d: any) => {
      if (!targetDaysSet.has(d.day_number)) return d;

      let updatedMeds = [...(d.medications || [])];
      const existingIdx = updatedMeds.findIndex(
        (m: any) => (m.drug_name || m.name || '').toLowerCase() === activeMedName.toLowerCase()
      );

      const modifiedMed = {
        id: `med-${d.day_number}-${Date.now()}`,
        drug_name: activeMedName,
        name: activeMedName,
        dose,
        dose_display: formatDoseDisplay(dose),
        route: route || 'SC',
        frequency: frequency || 'OD',
        status: 'planned',
        instructions: instructions || undefined,
      };

      if (existingIdx >= 0) {
        updatedMeds[existingIdx] = { ...updatedMeds[existingIdx], ...modifiedMed };
      } else {
        updatedMeds.push(modifiedMed);
      }

      return { ...d, medications: updatedMeds };
    });

    updateDays(nextDays);
    toast.success('Medication Updated', `Updated ${activeMedName} (${dose}) across ${selectedDays.length} days.`);
    setSelectedItemIds([]);
    setSelectedDays([]);
    setActiveMedName(null);
  };

  const handleApplyBatchAdd = (payload: BatchAddEventPayload) => {
    const { category, name, dose, route, frequency, notes, targetDays } = payload;
    const nextDays = activeDays.map((d: any) => {
      if (!targetDays.includes(d.day_number)) return d;
      let updated = { ...d };
      if (category === 'medication') {
        const meds = [...(updated.medications || [])];
        const existingIdx = meds.findIndex(
          (m: any) => (m.drug_name || m.name || '').toLowerCase() === name.toLowerCase()
        );
        const newMed = {
          id: `med-${d.day_number}-${Date.now()}`,
          drug_name: name,
          name: name,
          dose: dose || '',
          dose_display: formatDoseDisplay(dose || ''),
          route: route || 'SC',
          frequency: frequency || 'OD',
          status: 'planned',
          instructions: notes || undefined,
        };
        if (existingIdx >= 0) meds[existingIdx] = { ...meds[existingIdx], ...newMed };
        else meds.push(newMed);
        updated.medications = meds;
      } else if (category === 'scan') {
        const scans = [...(updated.scans || [])];
        if (!scans.includes(name)) scans.push(name);
        updated.scans = scans;
        if (!updated.milestone) updated.milestone = name;
      } else if (category === 'lab') {
        const labs = [...(updated.investigations || [])];
        if (!labs.includes(name)) labs.push(name);
        updated.investigations = labs;
      } else if (category === 'procedure') {
        const procs = [...(updated.procedures || [])];
        if (!procs.includes(name)) procs.push(name);
        updated.procedures = procs;
        updated.milestone = name;
      }
      return updated;
    });

    updateDays(nextDays);
    toast.success('Batch Added', `Added ${name} across ${targetDays.length} days.`);
    setSelectedDays([]);
    setSelectedItemIds([]);
  };

  const handleConfirmDelete = () => {
    if (selectedItemIds.length === 0) return;
    const isAllSelected = selectedItemIds.length >= filteredTimelineItems.length;

    let nextDays: any[] = [];
    if (isAllSelected) {
      // Complete wipe of all scheduled items across all days
      nextDays = activeDays.map((d: any) => ({
        ...d,
        medications: [],
        scans: [],
        procedures: [],
        investigations: [],
        milestone: undefined,
        right_follicles: '',
        left_follicles: '',
        endometrium_mm: '',
        endometrial_pattern: undefined,
        e2_pgml: '',
        p4_ngml: '',
        lh_miu: '',
        notes: '',
      }));
    } else {
      const targets = timelineItems.filter((x: PlanTimelineItem) => selectedItemIds.includes(x.id));
      if (targets.length === 0) return;

      const norm = (s: any) =>
        typeof s === 'string'
          ? s.trim().toLowerCase()
          : (s?.name || s?.test_name || s?.drug_name || '').trim().toLowerCase();

      nextDays = activeDays.map((d: any, dayIdx: number) => {
        const dayNum = d.day_number ?? dayIdx + 1;
        const dayTargets = targets.filter(
          (t) => t.day_number === dayNum || (t.date && d.date && t.date === d.date)
        );
        if (dayTargets.length === 0) return d;

        // Check if all items for this specific day were selected
        const allItemsForDay = timelineItems.filter(
          (t) => t.day_number === dayNum || (t.date && d.date && t.date === d.date)
        );
        const allDayItemsSelected = allItemsForDay.every((i) => selectedItemIds.includes(i.id));

        if (allDayItemsSelected) {
          return {
            ...d,
            medications: [],
            scans: [],
            procedures: [],
            investigations: [],
            milestone: undefined,
            right_follicles: '',
            left_follicles: '',
            endometrium_mm: '',
            endometrial_pattern: undefined,
            e2_pgml: '',
            p4_ngml: '',
            lh_miu: '',
            notes: '',
          };
        }

        let updated = { ...d };
        for (const target of dayTargets) {
          const tNorm = norm(target.name);

          if (target.category === 'medication') {
            updated.medications = (updated.medications || []).filter((m: any) => {
              if (m.id && target.id && m.id === target.id) return false;
              const mNorm = norm(m.drug_name || m.name);
              return mNorm !== tNorm && !mNorm.includes(tNorm) && !tNorm.includes(mNorm);
            });
          } else if (target.category === 'scan') {
            updated.scans = (updated.scans || []).filter((s: any) => {
              const sNorm = norm(s);
              return sNorm !== tNorm && !sNorm.includes(tNorm) && !tNorm.includes(sNorm);
            });
            if (!updated.scans || updated.scans.length === 0) {
              updated.right_follicles = '';
              updated.left_follicles = '';
              updated.endometrium_mm = '';
            }
            if (updated.milestone && norm(updated.milestone) === tNorm) {
              updated.milestone = undefined;
            }
          } else if (target.category === 'procedure') {
            updated.procedures = (updated.procedures || []).filter((p: any) => {
              const pNorm = norm(p);
              return pNorm !== tNorm && !pNorm.includes(tNorm) && !tNorm.includes(pNorm);
            });
            if (updated.milestone && norm(updated.milestone) === tNorm) {
              updated.milestone = undefined;
            }
          } else {
            updated.investigations = (updated.investigations || []).filter((i: any) => {
              const iNorm = norm(i);
              return iNorm !== tNorm && !iNorm.includes(tNorm) && !tNorm.includes(iNorm);
            });
            if (tNorm.includes('lh') || tNorm.includes('luteinising')) updated.lh_miu = '';
            if (tNorm.includes('estradiol') || tNorm.includes('e2')) updated.e2_pgml = '';
            if (tNorm.includes('progesterone') || tNorm.includes('p4')) updated.p4_ngml = '';
          }
        }
        return updated;
      });
    }

    updateDays(nextDays);
    toast.success('Deleted Items', `Successfully removed ${selectedItemIds.length} item(s) from schedule.`);
    setSelectedItemIds([]);
    setSelectedDays([]);
    setActiveMedName(null);
  };


  const updateDays = (nextDays: any[], protocolInfo?: { protocolId: string; protocolName: string }) => {
    setLocalDays(nextDays);
    if (onDaysChange) {
      onDaysChange(nextDays, protocolInfo);
    }
  };

  const timelineItems: PlanTimelineItem[] = useMemo(() => flattenDaysToTimelineItems(activeDays), [activeDays]);

  const filteredTimelineItems = useMemo(() => {
    return timelineItems.filter((item: PlanTimelineItem) => {
      if (startDateFilter && item.date && item.date < startDateFilter) return false;
      if (endDateFilter && item.date && item.date > endDateFilter) return false;
      return true;
    });
  }, [timelineItems, startDateFilter, endDateFilter]);

  const activeMedDefaults = useMemo(() => {
    if (!activeMedName) return null;
    const matching = timelineItems
      .filter(
        (i) =>
          i.category === 'medication' &&
          i.name.toLowerCase() === activeMedName.toLowerCase()
      )
      .sort((a, b) => a.day_number - b.day_number);

    if (matching.length === 0) return null;
    const first = matching[0];
    return {
      dose: first.dosage || first.dose_display || '',
      route: first.route || 'SC',
      frequency: first.frequency || 'OD',
      instructions: first.notes || '',
    };
  }, [activeMedName, timelineItems]);


  const follicleStats = useMemo(() => calculateFollicleStats(activeDays), [activeDays]);

  const handleUpdateItemDose = (itemId: string, newDose: string) => {
    const target = timelineItems.find((x: PlanTimelineItem) => x.id === itemId);
    if (!target) return;
    const nextDays = activeDays.map((d: any) => {
      if (d.day_number !== target.day_number) return d;
      const meds = [...(d.medications || [])];
      const idx = meds.findIndex((m: any) => (m.drug_name || m.name) === target.name);
      if (idx >= 0) {
        if (!newDose.trim()) meds.splice(idx, 1);
        else meds[idx] = { ...meds[idx], dose: newDose, dose_display: formatDoseDisplay(newDose) };
      }
      return { ...d, medications: meds };
    });
    updateDays(nextDays);
  };

  const handleUpdateItemScan = (itemId: string, newScanDetails: string) => {
    const target = timelineItems.find((x: PlanTimelineItem) => x.id === itemId);
    if (!target) return;
    let endo = target.endometrium_mm;
    let right = target.right_follicles;
    let left = target.left_follicles;
    const etMatch = newScanDetails.match(/ET\s*[-:]?\s*([\d.]+)/i);
    if (etMatch) endo = etMatch[1];
    const rMatch = newScanDetails.match(/R\s*[-:]?\s*([0-9,\s]+)/i);
    if (rMatch) right = rMatch[1].trim();
    const lMatch = newScanDetails.match(/L\s*[-:]?\s*([0-9,\s]+)/i);
    if (lMatch) left = lMatch[1].trim();
    const nextDays = activeDays.map((d: any) =>
      d.day_number === target.day_number
        ? { ...d, endometrium_mm: endo, right_follicles: right, left_follicles: left, notes: newScanDetails }
        : d
    );
    updateDays(nextDays);
  };

  const handleToggleStatus = (itemId: string) => {
    const target = timelineItems.find((x: PlanTimelineItem) => x.id === itemId);
    if (!target) return;
    const newStatus = target.status === 'administered' ? 'planned' : 'administered';
    const nextDays = activeDays.map((d: any) => {
      if (d.day_number !== target.day_number) return d;
      const meds = (d.medications || []).map((m: any) =>
        (m.drug_name || m.name) === target.name
          ? { ...m, status: newStatus, administered_at: newStatus === 'administered' ? new Date().toISOString() : undefined }
          : m
      );
      return { ...d, medications: meds };
    });
    updateDays(nextDays);
    toast.success(newStatus === 'administered' ? 'Administered' : 'Scheduled', `${target.name} (Day ${target.day_number})`);
  };

  const handleDeleteItem = (itemId: string) => {
    const target = timelineItems.find((x: PlanTimelineItem) => x.id === itemId);
    if (!target) return;

    const targetDayNumber = target.day_number;
    const targetDate = target.date;
    const targetNameClean = (target.name || '').trim().toLowerCase();

    const nextDays = activeDays.map((d: any, dIdx: number) => {
      const dayMatches =
        d.day_number === targetDayNumber ||
        (targetDate && d.date === targetDate) ||
        (!d.day_number && dIdx + 1 === targetDayNumber);

      if (!dayMatches) return d;

      if (target.category === 'medication') {
        const parts = (target.id || '').split('-');
        const parsedIdx = parts[0] === 'med' && parts.length >= 3 ? parseInt(parts[2], 10) : -1;

        const filteredMeds = (d.medications || []).filter((m: any, mIdx: number) => {
          if (m.id && m.id === target.id) return false;
          if (parsedIdx >= 0 && mIdx === parsedIdx) return false;
          const mClean = (m.drug_name || m.name || '').trim().toLowerCase();
          if (mClean === targetNameClean) return false;
          if (targetNameClean && mClean && (targetNameClean.startsWith(mClean) || mClean.startsWith(targetNameClean))) return false;
          return true;
        });
        return { ...d, medications: filteredMeds };
      }

      if (target.category === 'scan') {
        const remainingScans = (d.scans || []).filter(
          (s: string) => (s || '').trim().toLowerCase() !== targetNameClean
        );
        return {
          ...d,
          scans: remainingScans,
          right_follicles: remainingScans.length === 0 ? '' : d.right_follicles,
          left_follicles: remainingScans.length === 0 ? '' : d.left_follicles,
          endometrium_mm: remainingScans.length === 0 ? '' : d.endometrium_mm,
          milestone: (d.milestone || '').trim().toLowerCase() === targetNameClean ? undefined : d.milestone,
        };
      }

      if (target.category === 'procedure') {
        return {
          ...d,
          procedures: (d.procedures || []).filter((p: string) => (p || '').trim().toLowerCase() !== targetNameClean),
          milestone: (d.milestone || '').trim().toLowerCase() === targetNameClean ? undefined : d.milestone,
        };
      }

      return {
        ...d,
        investigations: (d.investigations || []).filter((i: string) => (i || '').trim().toLowerCase() !== targetNameClean),
        lh_miu: targetNameClean.includes('lh') ? '' : d.lh_miu,
        e2_pgml: targetNameClean.includes('e2') || targetNameClean.includes('estradiol') ? '' : d.e2_pgml,
        p4_ngml: targetNameClean.includes('p4') || targetNameClean.includes('progesterone') ? '' : d.p4_ngml,
      };
    });

    updateDays(nextDays);
    toast.success('Item Deleted', `${target.name} removed from Day ${target.day_number}.`);

    if (activeCycle?.id) {
      treatmentCyclesApi.updateMedicationCalendar(activeCycle.id, nextDays).catch((err: any) => {
        console.warn('Auto-save calendar deletion note:', err);
      });
    }
  };

  const handleAddItem = (newItem: Partial<PlanTimelineItem>) => {
    if (!newItem.day_number || !newItem.name) return;
    const exists = activeDays.some((d: any) => d.day_number === newItem.day_number);
    let nextDays: any[];
    if (exists) {
      nextDays = activeDays.map((d: any) => {
        if (d.day_number !== newItem.day_number) return d;
        if (newItem.category === 'medication') {
          const meds = [...(d.medications || [])];
          meds.push({ drug_name: newItem.name, dose: newItem.dosage || '1 tab', dose_display: newItem.dose_display, frequency: 'OD', status: 'planned' });
          return { ...d, medications: meds };
        }
        if (newItem.category === 'scan') {
          return {
            ...d,
            scans: [...(d.scans || []).filter((s: string) => s !== newItem.name), newItem.name!],
            notes: newItem.scan_details || d.notes,
            milestone: d.milestone || newItem.name,
          };
        }
        if (newItem.category === 'procedure') {
          return {
            ...d,
            procedures: [...(d.procedures || []).filter((p: string) => p !== newItem.name), newItem.name!],
            scans: (d.scans || []).filter((s: string) => s !== newItem.name),
            milestone: d.milestone || newItem.name,
            notes: newItem.notes || d.notes,
          };
        }
        return { ...d, investigations: [...(d.investigations || []), newItem.name!] };
      });
    } else {
      const newDayObj: any = {
        day_number: newItem.day_number,
        stim_day_number: newItem.stim_day_number || newItem.day_number,
        date: newItem.date || '',
        display_date: newItem.display_date || '',
        day_of_week: newItem.day_of_week || '',
        medications: [],
        scans: [],
        investigations: [],
        procedures: [],
      };
      if (newItem.category === 'medication') {
        newDayObj.medications.push({ drug_name: newItem.name, dose: newItem.dosage || '1 tab', dose_display: newItem.dose_display, frequency: 'OD', status: 'planned' });
      } else if (newItem.category === 'scan') {
        newDayObj.scans.push(newItem.name);
        newDayObj.milestone = newItem.name;
        if (newItem.scan_details) newDayObj.notes = newItem.scan_details;
      } else if (newItem.category === 'procedure') {
        newDayObj.procedures.push(newItem.name);
        newDayObj.milestone = newItem.name;
        if (newItem.notes) newDayObj.notes = newItem.notes;
      } else {
        newDayObj.investigations.push(newItem.name);
      }
      nextDays = [...activeDays, newDayObj].sort((a: any, b: any) => a.day_number - b.day_number);
    }
    updateDays(nextDays);
    toast.success('Item Added', `${newItem.name} added to Day ${newItem.day_number}`);
  };

  const handleApplyPlanFromModal = async (
    items: PlanTimelineItem[],
    mode: 'overwrite' | 'merge',
    protocolInfo?: { protocolId: string; protocolName: string }
  ) => {
    if (!items?.length) return;
    const dayMap = new Map<number, any>();
    items.forEach((it) => {
      if (!dayMap.has(it.day_number)) {
        dayMap.set(it.day_number, {
          day_number: it.day_number,
          stim_day_number: it.stim_day_number,
          date: it.date,
          display_date: it.display_date,
          day_of_week: it.day_of_week,
          medications: [],
          scans: [],
          investigations: [],
          procedures: [],
          milestone: it.category === 'scan' || it.category === 'procedure' ? it.name : undefined,
          right_follicles: it.right_follicles,
          left_follicles: it.left_follicles,
          endometrium_mm: it.endometrium_mm,
        });
      }
      const d = dayMap.get(it.day_number);
      if (it.category === 'medication') {
        d.medications.push({ drug_name: it.name, dose: it.dosage, dose_display: it.dose_display, frequency: it.frequency || 'OD', status: 'planned' });
      } else if (it.category === 'scan') {
        d.scans.push(it.name);
        d.milestone = it.name;
        if (it.scan_details) d.notes = it.scan_details;
      } else if (it.category === 'procedure') {
        if (!d.procedures) d.procedures = [];
        d.procedures.push(it.name);
        d.milestone = it.name;
        if (it.notes) d.notes = it.notes;
      } else if (it.category === 'lab') {
        d.investigations.push(it.name);
      }
    });

    const newDays = Array.from(dayMap.values()).sort((a, b) => a.day_number - b.day_number);
    let finalDays: any[] = [];
    if (mode === 'overwrite') {
      finalDays = fillMissingCalendarDays(newDays);
    } else {
      const merged = [...activeDays];
      newDays.forEach((nd) => {
        const idx = merged.findIndex((x) => x.day_number === nd.day_number);
        if (idx >= 0) merged[idx] = { ...merged[idx], ...nd };
        else merged.push(nd);
      });
      finalDays = fillMissingCalendarDays(merged);
    }
    updateDays(finalDays, protocolInfo);

    if (protocolInfo?.protocolId) {
      if (activeCycle) {
        activeCycle.protocol_template_id = protocolInfo.protocolId;
        if (!activeCycle.sentinel_dates) activeCycle.sentinel_dates = {};
        activeCycle.sentinel_dates.protocol_name = protocolInfo.protocolName;
      }

      if (activeCycle?.id) {
        try {
          await treatmentCyclesApi.update(activeCycle.id, {
            protocol_template_id: protocolInfo.protocolId,
            sentinel_dates: {
              ...(activeCycle.sentinel_dates || {}),
              protocol_name: protocolInfo.protocolName,
            },
            medication_calendar: finalDays,
          });
          if (onRefreshData) onRefreshData();
        } catch (err: any) {
          console.error('Failed to update cycle protocol on server:', err);
        }
      }
    }

    toast.success(
      'Protocol Applied',
      protocolInfo?.protocolName
        ? `Protocol switched to ${protocolInfo.protocolName} & schedule updated.`
        : 'Treatment schedule updated.'
    );
  };

  const handleUpdateItemRemarks = (itemId: string, newRemarks: string) => {
    const target = timelineItems.find((x: PlanTimelineItem) => x.id === itemId);
    if (!target) return;
    const nextDays = activeDays.map((d: any) => {
      if (d.day_number !== target.day_number) return d;
      if (target.category === 'medication') {
        const meds = (d.medications || []).map((m: any) =>
          (m.drug_name || m.name) === target.name
            ? { ...m, notes: newRemarks, instructions: newRemarks }
            : m
        );
        return { ...d, medications: meds };
      }
      return { ...d, notes: newRemarks };
    });
    updateDays(nextDays);
    toast.success('Remark Recorded', `Updated note for ${target.name} (Day ${target.day_number})`);
  };

  const handleSaveSchedule = async (andNext = false) => {
    if (isWizardStep || !activeCycle?.id) {
      if (onDaysChange) onDaysChange(activeDays);
      setSaveMessage('Stimulation schedule saved to draft!');
      toast.success('Schedule Drafted', 'Day-by-day medication schedule recorded for this new cycle.');
      setTimeout(() => setSaveMessage(null), 3000);
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
      return;
    }

    setIsSaving(true);
    try {
      await treatmentCyclesApi.updateMedicationCalendar(activeCycle.id, activeDays);
      setSaveMessage('Stimulation schedule saved successfully!');
      toast.success('Schedule Saved', 'Stimulation calendar updated.');
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSaveMessage(null), 3000);
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
    } catch (err: any) {
      toast.error('Failed to save calendar', err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Single Modality Header (No confusing dual protocol switcher) */}
      <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2">
          {isFetModality ? (
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          ) : (
            <Activity className="w-4 h-4 text-primary" />
          )}
          <h3 className="text-xs font-bold text-slate-800">
            {isFetModality
              ? 'HRT Frozen Embryo Transfer (FET) Protocol Sheet'
              : 'Ovarian Stimulation Medication & Monitoring Schedule'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Modality:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {activeCycle?.treatment_type || 'Stimulation'}
          </span>
        </div>
      </div>

      {/* RENDER HRT FET PROTOCOL SHEET */}
      {activeSheetType === 'hrt_fet' ? (
        <HrtFetProtocolSheet
          cycleId={activeCycle?.id}
          startDate={activeCycle?.start_date}
          initialDays={activeDays}
          sentinelDates={activeCycle?.sentinel_dates}
          onCalendarSaved={(savedDays) => {
            updateDays(savedDays);
            if (onRefreshData) onRefreshData();
          }}
        />
      ) : (
        /* RENDER STIMULATION SUITE (Ledger or 7-Day View) */
        <>
          <PlanDetailsDateFilterBar
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
            onStartDateChange={setStartDateFilter}
            onEndDateChange={setEndDateFilter}
            onResetDates={() => { setStartDateFilter(''); setEndDateFilter(''); }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenInsertEditPlan={() => setShowInsertPlanModal(true)}
            isBatchModeActive={isBatchModeActive}
            onToggleBatchMode={() => {
              setIsBatchModeActive((prev) => {
                const nextVal = !prev;
                if (!nextVal) {
                  setSelectedItemIds([]);
                  setSelectedDays([]);
                  setActiveMedName(null);
                }
                return nextVal;
              });
            }}
            onPrintCalendar={() => { setTakeawayLogoMode(true); setShowTakeawayModal(true); }}
          />

          <FollicleCohortSummaryCard
            stats={follicleStats}
            estimatedTriggerDate={activeCycle?.sentinel_dates?.trigger || activeCycle?.sentinel_dates?.trigger_datetime}
          />

          {viewMode === 'timeline_ledger' && (
            <PlanDetailsTimelineTable
              items={filteredTimelineItems}
              isBatchModeActive={isBatchModeActive}
              onUpdateItemDose={handleUpdateItemDose}
              onUpdateItemScan={handleUpdateItemScan}
              onUpdateItemRemarks={handleUpdateItemRemarks}
              onToggleStatus={handleToggleStatus}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
              batchMode={batchMode}
              activeMedName={activeMedName}
              selectedDays={selectedDays}
              onToggleSelectDay={handleToggleSelectDay}
              onSelectAllDays={handleSelectAllDays}
              selectedItemIds={selectedItemIds}
              onToggleSelectItem={handleToggleSelectItem}
              onSelectAllItems={handleSelectAllItems}
              onOpenScanEdit={(dayNum) => {
                const day = activeDays.find((d: any) => d.day_number === dayNum);
                if (day) setEditingScanDay({ ...day, _initialCategory: 'scan' });
              }}
              onSave={() => handleSaveSchedule(false)}
              isSaving={isSaving}
            />
          )}

          {viewMode === 'calendar_7day' && (
            <StimulationCalendar7DayView
              days={activeDays}
              selectedDays={selectedDays}
              onToggleSelectDay={handleToggleSelectDay}
              onUpdateMedDose={(dayNum, medIdx, newDose) => {
                const nextDays = activeDays.map((d: any) => {
                  if (d.day_number !== dayNum) return d;
                  const meds = [...(d.medications || [])];
                  if (meds[medIdx]) meds[medIdx] = { ...meds[medIdx], dose: newDose };
                  return { ...d, medications: meds };
                });
                updateDays(nextDays);
              }}
              onRemoveMed={(dayNum, medIdx) => {
                const nextDays = activeDays.map((d: any) =>
                  d.day_number === dayNum
                    ? { ...d, medications: (d.medications || []).filter((_: any, i: number) => i !== medIdx) }
                    : d
                );
                updateDays(nextDays);
              }}
              onAddMed={(dayNum, drugName, dose) => {
                const nextDays = activeDays.map((d: any) =>
                  d.day_number === dayNum
                    ? { ...d, medications: [...(d.medications || []), { drug_name: drugName, dose: dose || '175 IU', frequency: 'OD', status: 'planned' }] }
                    : d
                );
                updateDays(nextDays);
              }}
              onCopyForward={(sourceDayNum, daysToForward = 3) => {
                const sourceDay = activeDays.find((d: any) => d.day_number === sourceDayNum);
                if (!sourceDay?.medications?.length) return;
                const nextDays = activeDays.map((d: any) =>
                  d.day_number > sourceDayNum && d.day_number <= sourceDayNum + daysToForward
                    ? { ...d, medications: sourceDay.medications.map((m: any) => ({ ...m })) }
                    : d
                );
                updateDays(nextDays);
                toast.success('Copied Medications', `Medications copied forward ${daysToForward} days.`);
              }}
              onOpenScanEdit={(day, initialCategory) =>
                setEditingScanDay({ ...day, _initialCategory: initialCategory || 'scan' })
              }
            />
          )}

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div>
              {saveMessage && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />{saveMessage}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSchedule(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isWizardStep ? 'Save Schedule Draft' : 'Save Schedule'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveSchedule(true)}
                disabled={isSaving}
                className="px-5 py-2 bg-primary hover:bg-primary-mid disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
              >
                {isSaving ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>Save &amp; Next: Summary →</span>
              </button>
            </div>
          </div>
        </>
      )}

      <InsertEditPlanModal
        isOpen={showInsertPlanModal}
        onClose={() => setShowInsertPlanModal(false)}
        startDate={
          activeCycle?.start_date ||
          activeCycle?.sentinel_dates?.stim_start ||
          activeCycle?.sentinel_dates?.lmp_day1 ||
          startDateFilter ||
          new Date().toISOString().split('T')[0]
        }
        defaultProtocolName={activeCycle?.sentinel_dates?.protocol_name}
        defaultProtocolId={(activeCycle as any)?.protocol_template_id}
        onApplyPlan={handleApplyPlanFromModal}
      />

      <TakeawayCalendarModal
        isOpen={showTakeawayModal}
        onClose={() => setShowTakeawayModal(false)}
        patient={patient}
        partner={partner}
        cycle={activeCycle}
        days={activeDays}
        defaultShowLogo={takeawayLogoMode}
      />

      {editingScanDay && (
        <QuickScanEditModal
          isOpen={Boolean(editingScanDay)}
          onClose={() => setEditingScanDay(null)}
          day={editingScanDay}
          initialCategory={editingScanDay._initialCategory}
          onSaveScan={(updatedDay) => {
            const nextDays = activeDays.map((d: any) => (d.day_number === updatedDay.day_number ? updatedDay : d));
            updateDays(nextDays);
            toast.success('Event Saved', `Day ${updatedDay.day_number} schedule updated.`);
          }}
        />
      )}


      {isBatchModeActive && (
        <StimulationBatchActionBar
          batchMode={batchMode}
          onSetBatchMode={setBatchMode}
          selectedDays={selectedDays}
          selectedItemIds={selectedItemIds}
          activeMedName={activeMedName}
          initialDose={activeMedDefaults?.dose || ''}
          onQuickPresetDays={handleQuickPresetDays}
          onOpenAddModal={() => setShowBatchAddModal(true)}
          onQuickApplyDose={handleQuickApplyDose}
          onOpenAdvanceModal={() => setShowBatchAdvanceModal(true)}
          onOpenDeleteModal={() => setShowBatchDeleteModal(true)}
          onClearSelection={() => {
            setSelectedDays([]);
            setSelectedItemIds([]);
            setActiveMedName(null);
          }}
          onCloseBatchMode={() => {
            setIsBatchModeActive(false);
            setSelectedDays([]);
            setSelectedItemIds([]);
            setActiveMedName(null);
          }}
        />
      )}

      <BatchDeleteConfirmModal
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        selectedItems={timelineItems.filter((i) => selectedItemIds.includes(i.id))}
        onConfirmDelete={handleConfirmDelete}
      />

      <BatchAddEventModal
        isOpen={showBatchAddModal}
        onClose={() => setShowBatchAddModal(false)}
        selectedDays={selectedDays}
        allDays={activeDays}
        drugList={drugList}
        onApplyAdd={handleApplyBatchAdd}
      />

      <BatchModifyMedModal
        isOpen={showBatchAdvanceModal}
        onClose={() => setShowBatchAdvanceModal(false)}
        medName={activeMedName || ''}
        selectedDays={selectedDays}
        initialDose={activeMedDefaults?.dose || ''}
        initialRoute={activeMedDefaults?.route || 'SC'}
        initialFrequency={activeMedDefaults?.frequency || 'OD'}
        initialInstructions={activeMedDefaults?.instructions || ''}
        onApplyModify={handleApplyAdvanceModify}
      />

    </div>
  );
}
