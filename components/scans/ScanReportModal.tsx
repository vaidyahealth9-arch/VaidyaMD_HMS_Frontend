'use client';

import React from 'react';
import { Activity, FileText } from 'lucide-react';
import PrintableModal from '@/components/common/PrintableModal';
import { getScanSchemaInfo } from './scanSchemas';

export interface ScanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  patient?: any;
  partner?: any;
  onEdit?: (record: any) => void;
}

export default function ScanReportModal({
  isOpen,
  onClose,
  record,
  patient,
  partner,
  onEdit,
}: ScanReportModalProps) {
  if (!isOpen || !record) return null;

  const schemaInfo = getScanSchemaInfo(record.schema_type || record.record_type);
  const data = record.data || {};
  const scanDate =
    data.scan_date ||
    data.date_of_scan ||
    data.collection_date ||
    (record.created_at ? record.created_at.split('T')[0] : '---');

  // Humanize keys helper
  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Filter out meta keys to get clinical observation entries
  const observationEntries = Object.entries(data).filter(([key, val]) => {
    if (
      [
        'scan_date',
        'date_of_scan',
        'collection_date',
        'analysis_date',
        'clinical_history',
        'remarks',
        'indication',
        'cycle_day',
        'impression',
        'recommendations',
        'lmp_date',
        'lmp',
        'edd_lmp',
        'ga_lmp',
        'ga_lmp_days',
        'obstetric_history',
        'referring_clinician',
      ].includes(key)
    ) {
      return false;
    }
    return val !== null && val !== undefined && val !== '';
  }).map(([key, val]) => {
    const isObj = typeof val === 'object';
    const strVal = isObj ? JSON.stringify(val) : String(val);
    return [key, strVal] as [string, string];
  });

  const isMale = schemaInfo.category === 'male';
  const isObstetric = schemaInfo.category === 'obstetric';

  const metaFields = isObstetric
    ? [
        { label: 'Investigation', value: schemaInfo.shortLabel },
        { label: 'GA by Dating', value: String(data.ga_lmp || data.ga_crl || data.ga_prior_scan || '—') },
        { label: 'EDD', value: String(data.edd_lmp || data.edd_prior_scan || '—') },
        { label: 'Session ID', value: record.id?.slice(0, 8)?.toUpperCase() || 'OBS-1' },
      ]
    : [
        { label: 'Investigation', value: schemaInfo.shortLabel },
        { label: 'Cycle Day', value: data.cycle_day ? `Day ${data.cycle_day}` : '—' },
        { label: 'Session ID', value: record.id?.slice(0, 8)?.toUpperCase() || 'OBS-1' },
        { label: 'Status', value: 'Authorized & Certified' },
      ];

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${schemaInfo.label} — Clinical Report`}
      subtitle={`Session Date: ${scanDate} · Patient VID: ${patient?.vid || record.patient_id}`}
      defaultIncludeHeader={true}
      headerProps={{
        title: schemaInfo.label,
        subtitle: isMale
          ? 'Andrology Laboratory & Male Reproductive Diagnostics Division'
          : isObstetric
          ? 'Fetal Medicine & Antenatal Ultrasound Imaging Division'
          : 'Diagnostic Ultrasound & Clinical Imaging Division',
        department: isMale
          ? 'Department of Andrology & Reproductive Biology'
          : isObstetric
          ? 'Department of Fetal Medicine & Perinatal Ultrasonography'
          : 'Department of Reproductive Medicine & Ultrasonography',
        patient: patient || {
          name: record.patient_name || 'Patient',
          vid: record.patient_id,
        },
        partner: partner,
        doctor: {
          name:
            record.doctor_name ||
            record.created_by_name ||
            (isMale
              ? 'Consultant Andrologist'
              : isObstetric
              ? 'Consultant Fetal Medicine Specialist'
              : 'Consultant Sonologist'),
          qualification: isMale
            ? 'MD (Pathology), Clinical Embryologist & Andrologist'
            : isObstetric
            ? 'MD, DNB (OBGYN), Fellowship in Fetal Medicine'
            : 'MD (OBGYN), Fellowship in Reproductive Ultrasound',
          department: isMale
            ? 'Andrology & Fetal Medicine'
            : isObstetric
            ? 'Fetal Medicine & Obstetrics'
            : 'Fetal & Reproductive Medicine',
        },
        date: scanDate,
        metaFields,
      }}
      footerProps={{
        signatoryName:
          record.doctor_name ||
          record.created_by_name ||
          (isMale
            ? 'Consultant Andrologist & Embryologist'
            : isObstetric
            ? 'Consultant Fetal Medicine Specialist'
            : 'Consultant Sonologist & Infertility Specialist'),
        signatoryTitle: isMale
          ? 'Consultant Andrologist / Embryologist'
          : isObstetric
          ? 'Consultant Fetal Medicine Specialist'
          : 'Consultant Sonologist & Infertility Specialist',
        signatoryQualification: isMale
          ? 'MD, PhD (Andrology)'
          : isObstetric
          ? 'MD, DNB (OBGYN), Fellowship in Fetal Medicine'
          : 'MD, DNB (OBGYN), F.ART',
        showSignatory: true,
        showComputerGeneratedNotice: true,
      }}
    >
      {({ hideHeader }) => (
        <div className="px-6 sm:px-8 print:px-[12mm] py-4 space-y-6 text-slate-800 bg-transparent">
          {/* Action Bar for On-Screen View (Hidden on Print) */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg p-3 print:hidden">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold border ${schemaInfo.badgeBg} ${schemaInfo.badgeColor} ${schemaInfo.badgeBorder}`}
              >
                {schemaInfo.label}
              </span>
              <span className="text-xs text-slate-500 font-mono font-semibold">
                {scanDate}
              </span>
            </div>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="px-3 py-1 bg-primary hover:bg-primary-mid text-white text-xs font-bold rounded-md transition-colors shadow-sm cursor-pointer"
              >
                Edit Readings in Workbench →
              </button>
            )}
          </div>

          {/* Clinical Indications & Patient History (Clean Text — No Opaque Box Patches) */}
          {/* Clinical Indications & Antenatal Patient History */}
          {(data.clinical_history || data.indication || data.cycle_day || data.lmp_date || data.lmp || data.edd_lmp || data.ga_lmp || data.obstetric_history) && (
            <div className="space-y-1.5 py-1 bg-transparent">
              <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  {isObstetric
                    ? 'Antenatal Clinical Profile & Obstetric Dating'
                    : 'Clinical Indication & Patient History'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs pt-1">
                {data.obstetric_history && (
                  <p>
                    <span className="text-slate-500 font-medium">Obstetric History:</span>{' '}
                    <strong className="text-slate-900 ml-1">{data.obstetric_history}</strong>
                  </p>
                )}
                {(data.lmp_date || data.lmp) && (
                  <p>
                    <span className="text-slate-500 font-medium">LMP:</span>{' '}
                    <strong className="text-slate-900 ml-1">{data.lmp_date || data.lmp}</strong>
                  </p>
                )}
                {data.edd_lmp && (
                  <p>
                    <span className="text-slate-500 font-medium">EDD (by LMP):</span>{' '}
                    <strong className="text-slate-900 ml-1">{data.edd_lmp}</strong>
                  </p>
                )}
                {data.ga_lmp && (
                  <p>
                    <span className="text-slate-500 font-medium">GA (by LMP):</span>{' '}
                    <strong className="text-slate-900 ml-1">{data.ga_lmp}</strong>
                  </p>
                )}
                {data.cycle_day && (
                  <p>
                    <span className="text-slate-500 font-medium">Cycle Day:</span>{' '}
                    <strong className="text-slate-900 ml-1">Day {data.cycle_day}</strong>
                  </p>
                )}
                {data.indication && (
                  <p className={isObstetric ? 'col-span-full' : ''}>
                    <span className="text-slate-500 font-medium">Indication:</span>{' '}
                    <strong className="text-slate-900 ml-1">{data.indication}</strong>
                  </p>
                )}
                {data.clinical_history && (
                  <p className="col-span-full">
                    <span className="text-slate-500 font-medium">Clinical History:</span>{' '}
                    <span className="text-slate-800 ml-1">{data.clinical_history}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Structured Diagnostic Findings (Clean Key-Value Rows — No Opaque Card Patches) */}
          <div className="space-y-2 bg-transparent">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-600" />
              <span>
                {isMale
                  ? 'Andrology Lab Parameters & Semen Profile'
                  : isObstetric
                  ? 'Ultrasound Biometry, Doppler & Anatomical Survey'
                  : 'Biometric Observations & Ultrasound Findings'}
              </span>
            </h4>

            {observationEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs pt-1 bg-transparent">
                {observationEntries.map(([key, strVal]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between border-b border-slate-200/80 py-1 bg-transparent"
                  >
                    <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">
                      {formatLabel(key)}:
                    </span>
                    <span className="font-bold text-slate-900 text-xs text-right break-words pl-2">
                      {strVal}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No individual biometric observations recorded for this session.
              </p>
            )}
          </div>

          {/* Clinical Impression & Recommendations (Clean Underlined Typography — No Tinted Patches) */}
          {(data.impression || data.remarks || data.recommendations) && (
            <div className="space-y-2.5 pt-2 bg-transparent">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Clinical Impression &amp; Recommendations
              </h4>
              <div className="text-xs space-y-2 pt-1 bg-transparent">
                {data.impression && (
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">
                      Diagnostic Impression:
                    </span>
                    <p className="text-slate-800 font-semibold leading-relaxed mt-0.5">
                      {data.impression}
                    </p>
                  </div>
                )}
                {data.remarks && (
                  <div>
                    <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wide">
                      Clinical Remarks:
                    </span>
                    <p className="text-slate-700 leading-relaxed mt-0.5">{data.remarks}</p>
                  </div>
                )}
                {data.recommendations && (
                  <div>
                    <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wide">
                      Advised Follow-Up / Next Steps:
                    </span>
                    <p className="text-slate-700 leading-relaxed mt-0.5">
                      {data.recommendations}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PrintableModal>
  );
}
