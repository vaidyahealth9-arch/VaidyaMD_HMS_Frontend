'use client';

import React from 'react';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import type { ObstetricRow } from './types';

interface ProformaPrintViewProps {
  patient: any;
  partner?: any;
  activeTab: 'fertility' | 'gynaecology' | 'obstetric';
  usePrePrintedPad: boolean;
  setUsePrePrintedPad: (v: boolean) => void;
  data: {
    femaleName: string;
    maleName: string;
    referredBy: string;
    livesIn: string;
    seenByDr: string;
    staffInAttendance: string;
    reasonForConsultation: string;
    fertilityType: string;
    fertilityFactor: string;
    marriedInYear: string;
    tryingForPregnancy: string;
    consanguinity: string;
    femaleProfession: string;
    femaleWeight: string;
    femaleBmi: string;
    femalePallor: string;
    femalePedalEdema: string;
    femaleGoitre: string;
    femaleBp: string;
    periodsEvery: string;
    durationBleeding: string;
    lmp: string;
    periodsPainful: string;
    periodsHeavy: string;
    ageAtMenarche: string;
    menstrualAdditional: string;
    femaleSmoking: string;
    femaleGutka: string;
    femaleAlcohol: string;
    femaleToddy: string;
    femaleCoffee: string;
    femaleAdmissions: string;
    femaleRegularMed: string;
    femaleTb: string;
    femaleBleedingDisorders: string;
    femaleGalactorrhoea: string;
    femaleAllergies: string;
    femaleCervicalSmear: string;
    femalePastSurgical: string;
    femaleFamilyHistory: string[];
    gpal: string;
    obRows: ObstetricRow[];
    maleProfession: string;
    maleWeight: string;
    maleBmi: string;
    malePallor: string;
    malePedalEdema: string;
    maleBp: string;
    frequencyIntercourse: string;
    maleLastSi: string;
    maleErectileIssues: string;
    maleDyspareunia: string;
    maleScrotalInjury: string;
    maleMumps: string;
    maleSmoking: string;
    maleGutka: string;
    maleAlcohol: string;
    maleToddy: string;
    maleCoffee: string;
    maleAdmissions: string;
    maleRegularMed: string;
    maleTb: string;
    maleAllergies: string;
    malePastSurgical: string;
    paFindings: string;
    paScars: string;
    psVulvaVagina: string;
    psCervixHealthy: boolean;
    psCervixEctropion: boolean;
    psCervicalSmearDone: boolean;
    psBleedingOnTouch: boolean;
    pvUterusPosition: string;
    pvUterusSize: string;
    pvUterusMobility: string;
    pvFornicesTenderness: string;
    threeDScan: string;
    factorsInFavour: string;
    factorsNotInFavour: string;
    recommendedWifeTests: string[];
    recommendedHusbandTests: string[];
    recSemenAnalysis: boolean;
    recDfi: boolean;
    pendingHusbandTests: string[];
    pendingWifeTests: string[];
    fertilityFoods: string[];
    fertilitySupplements: string;
    followUpPlan: string;
    finalDiagnosis: string;
  };
}

export default function ProformaPrintView({
  patient,
  partner,
  activeTab,
  usePrePrintedPad,
  setUsePrePrintedPad,
  data,
}: ProformaPrintViewProps) {
  return (
    <div className="printable-document max-w-4xl mx-auto bg-white p-6 sm:p-8 border border-slate-300 rounded-lg shadow-sm space-y-5 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0">
      {/* Header */}
      <PrintableReportHeader
        title={
          activeTab === 'fertility'
            ? 'COUPLE FERTILITY ASSESSMENT & CLINICAL PROFORMA'
            : activeTab === 'gynaecology'
            ? 'GYNAECOLOGY CLINICAL CASE HISTORY & PROFORMA'
            : 'OBSTETRIC ANTENATAL CONSULTATION RECORD'
        }
        subtitle="Department of Reproductive Medicine, Obstetrics & Gynaecology"
        hideHospitalHeader={usePrePrintedPad}
        onTogglePrePrintedPad={() => setUsePrePrintedPad(!usePrePrintedPad)}
        patient={{
          name: data.femaleName || patient?.name,
          vid: patient?.vid,
          age: patient?.age,
          gender: 'Female',
          partner_name: data.maleName || partner?.name || patient?.partner_name,
        }}
        metaFields={[
          { label: 'Date', value: new Date().toISOString().split('T')[0] },
          { label: 'Consultant', value: data.seenByDr || 'Treating Specialist' },
          { label: 'Proforma Type', value: `${activeTab.toUpperCase()} CONSULTATION` },
          { label: 'Referred By', value: data.referredBy || 'Self / Direct Walk-in' },
        ]}
      />

      {/* Demographics / Referral Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
            Referred by
          </span>
          <strong>{data.referredBy || 'Direct Walk-in'}</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
            Lives in
          </span>
          <strong>{data.livesIn || '—'}</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
            Seen by Dr
          </span>
          <strong>{data.seenByDr || 'Treating Specialist'}</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
            Staff in attendance
          </span>
          <strong>{data.staffInAttendance || '—'}</strong>
        </div>
      </div>

      {/* Reason for consultation */}
      <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">
          Reason for consultation
        </span>
        <p className="text-xs font-semibold text-slate-900 leading-snug">
          {data.reasonForConsultation}
        </p>
      </div>

      {/* Couple Fertility Profile */}
      {activeTab === 'fertility' && (
        <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
          <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1 font-bold uppercase tracking-wider">
            Couple Fertility Profile
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Type / Factor
              </span>
              <strong>
                {data.fertilityType} Infertility ({data.fertilityFactor})
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Married in year
              </span>
              <strong>{data.marriedInYear || '—'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Trying for pregnancy
              </span>
              <strong>{data.tryingForPregnancy ? `${data.tryingForPregnancy} years` : '—'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Consanguinity
              </span>
              <strong>{data.consanguinity}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Female Assessment */}
      <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
        <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1 font-bold uppercase tracking-wider">
          Female Partner Assessment
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-1">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              Female Name
            </span>
            <strong>
              {data.femaleName || patient?.name} {data.femaleProfession && `(${data.femaleProfession})`}
            </strong>
          </div>
          <div className="p-1 sm:pl-3">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              Weight / BMI
            </span>
            <strong>
              {data.femaleWeight || '—'} kg {data.femaleBmi && `/ ${data.femaleBmi}`}
            </strong>
          </div>
          <div className="p-1 sm:pl-3">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              Examination
            </span>
            <strong>
              {data.femalePallor === 'No' ? 'No pallor' : 'Pallor'},{' '}
              {data.femalePedalEdema === 'No' ? 'No pedal edema' : 'Edema'},{' '}
              {data.femaleGoitre === 'No' ? 'No goitre' : 'Goitre'}, BP {data.femaleBp}
            </strong>
          </div>
          <div className="p-1 sm:pl-3">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              Menstrual Cycle
            </span>
            <strong>
              Every {data.periodsEvery}d / {data.durationBleeding}d (LMP: {data.lmp})
            </strong>
          </div>
        </div>

        {/* Menstrual Details */}
        <div className="px-3 pb-2.5 pt-1.5 text-[11px] text-slate-700 border-t border-slate-100 flex flex-wrap gap-4">
          <span>
            Painful: <strong>{data.periodsPainful}</strong>
          </span>
          <span>
            Heavy: <strong>{data.periodsHeavy}</strong>
          </span>
          <span>
            Menarche: <strong>{data.ageAtMenarche}y</strong>
          </span>
          {data.menstrualAdditional && <span>Notes: {data.menstrualAdditional}</span>}
        </div>

        {/* Habits */}
        <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 text-[11px] grid grid-cols-5 gap-2">
          <span>
            Smoking: <strong>{data.femaleSmoking}</strong>
          </span>
          <span>
            Gutka: <strong>{data.femaleGutka}</strong>
          </span>
          <span>
            Alcohol: <strong>{data.femaleAlcohol}</strong>
          </span>
          <span>
            Toddy: <strong>{data.femaleToddy}</strong>
          </span>
          <span>
            Coffee: <strong>{data.femaleCoffee}</strong>
          </span>
        </div>

        {/* Past Medical / Surgical */}
        <div className="p-3 border-t border-slate-100 text-xs space-y-1">
          <p>
            <strong>Past Medical:</strong> Admissions: {data.femaleAdmissions} | Regular Meds:{' '}
            {data.femaleRegularMed} | TB: {data.femaleTb} | Bleeding Disorders:{' '}
            {data.femaleBleedingDisorders} | Galactorrhoea: {data.femaleGalactorrhoea}
          </p>
          <p>
            <strong>Allergies:</strong> {data.femaleAllergies} | <strong>Smears:</strong>{' '}
            {data.femaleCervicalSmear}
          </p>
          <p>
            <strong>Past Surgical:</strong> {data.femalePastSurgical} |{' '}
            <strong>Family History:</strong> {data.femaleFamilyHistory.join(', ')}
          </p>
        </div>
      </div>

      {/* Obstetric History */}
      <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
        <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1 font-bold uppercase tracking-wider flex justify-between">
          <span>Obstetric History</span>
          <span className="font-mono">{data.gpal}</span>
        </div>
        <div className="p-2">
          {data.obRows.some((r) => r.year || r.outcome) ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-1 text-left">Year</th>
                  <th className="p-1 text-left">Place</th>
                  <th className="p-1 text-left">Details / Mode</th>
                  <th className="p-1 text-left">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {data.obRows
                  .filter((r) => r.year || r.outcome)
                  .map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-1">{r.year}</td>
                      <td className="p-1">{r.place}</td>
                      <td className="p-1">{r.details}</td>
                      <td className="p-1 font-bold">{r.outcome}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 italic p-1">Nulligravida / G0</p>
          )}
        </div>
      </div>

      {/* Male Assessment */}
      {activeTab === 'fertility' && (
        <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
          <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1 font-bold uppercase tracking-wider">
            Male Partner Assessment
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-1">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Male Name
              </span>
              <strong>
                {data.maleName || partner?.name || '—'} {data.maleProfession && `(${data.maleProfession})`}
              </strong>
            </div>
            <div className="p-1 sm:pl-3">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Weight / BMI
              </span>
              <strong>
                {data.maleWeight || '—'} kg {data.maleBmi && `/ ${data.maleBmi}`}
              </strong>
            </div>
            <div className="p-1 sm:pl-3">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Examination
              </span>
              <strong>
                {data.malePallor === 'No' ? 'No pallor' : 'Pallor'},{' '}
                {data.malePedalEdema === 'No' ? 'No pedal edema' : 'Edema'}, BP {data.maleBp}
              </strong>
            </div>
            <div className="p-1 sm:pl-3">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Sexual History
              </span>
              <strong>
                Intercourse: {data.frequencyIntercourse} | Last SI: {data.maleLastSi}
              </strong>
            </div>
          </div>

          <div className="px-3 pb-2 pt-1 text-[11px] text-slate-700 border-t border-slate-100 flex flex-wrap gap-4">
            <span>
              Erection/Ejaculation: <strong>{data.maleErectileIssues}</strong>
            </span>
            <span>
              Pain during SI: <strong>{data.maleDyspareunia}</strong>
            </span>
            <span>
              Groin injury: <strong>{data.maleScrotalInjury}</strong>
            </span>
            <span>
              Mumps: <strong>{data.maleMumps}</strong>
            </span>
          </div>

          <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 text-[11px] grid grid-cols-5 gap-2">
            <span>
              Smoking: <strong>{data.maleSmoking}</strong>
            </span>
            <span>
              Gutka: <strong>{data.maleGutka}</strong>
            </span>
            <span>
              Alcohol: <strong>{data.maleAlcohol}</strong>
            </span>
            <span>
              Toddy: <strong>{data.maleToddy}</strong>
            </span>
            <span>
              Coffee: <strong>{data.maleCoffee}</strong>
            </span>
          </div>

          <div className="p-3 border-t border-slate-100 text-xs">
            <p>
              <strong>Medical:</strong> Admissions: {data.maleAdmissions} | Regular Meds:{' '}
              {data.maleRegularMed} | TB: {data.maleTb} | Allergies: {data.maleAllergies} | Surgeries:{' '}
              {data.malePastSurgical}
            </p>
          </div>
        </div>
      )}

      {/* Investigations & Consultation Notes */}
      <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
        <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1 font-bold uppercase tracking-wider">
          Clinical Pelvic Examination &amp; Diagnostics
        </div>
        <div className="p-3 space-y-2">
          <p>
            <strong>P/A:</strong> Soft: {data.paFindings} | Scars: {data.paScars}
          </p>
          <p>
            <strong>P/S:</strong> Vulva Vagina: {data.psVulvaVagina} | Cervix:{' '}
            {data.psCervixHealthy ? 'Healthy' : 'Abnormal'}{' '}
            {data.psCervixEctropion && '(Ectropion noted)'}{' '}
            {data.psCervicalSmearDone && '(Smear done LBC)'} |{' '}
            {data.psBleedingOnTouch ? 'Bleeding on touch noted' : 'No bleeding noted on touch'}
          </p>
          <p>
            <strong>P/V:</strong> Uterus: {data.pvUterusPosition}, Size: {data.pvUterusSize},{' '}
            {data.pvUterusMobility} | Fornices: Tenderness: {data.pvFornicesTenderness}
          </p>
          {data.threeDScan && (
            <p>
              <strong>3-D Scan Findings:</strong> {data.threeDScan}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <strong>Factors in favour:</strong> {data.factorsInFavour}
            </div>
            <div>
              <strong>Factors not in favour:</strong> {data.factorsNotInFavour}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Investigations */}
      <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
        <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1 font-bold uppercase tracking-wider">
          Recommended Basic Investigations &amp; Instructions
        </div>
        <div className="p-3 space-y-2">
          <p>
            <strong>Wife:</strong> {data.recommendedWifeTests.join(', ')}
          </p>
          <p>
            <strong>Husband:</strong> {data.recommendedHusbandTests.join(', ')}
          </p>
          {data.recSemenAnalysis && (
            <p className="text-slate-800">
              • <strong>Semen analysis</strong> (Attend with 3 to 7 days abstinence, BY
              APPOINTMENT ONLY) Between 9 AM TO 11 AM
            </p>
          )}
          {data.recDfi && (
            <p className="text-slate-800">
              • <strong>Sperm DNA Fragmentation DFI</strong> (Attend with 2 days abstinence,
              BY APPOINTMENT ONLY) Between 9 AM TO 11 AM
            </p>
          )}
          <div className="pt-1 border-t border-slate-100">
            <p>
              <strong>Pending Husband:</strong> {data.pendingHusbandTests.join(', ')}
            </p>
            <p>
              <strong>Pending Wife:</strong> {data.pendingWifeTests.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Advised & Diagnosis */}
      <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50 space-y-2 text-xs">
        <p>
          <strong>Advised Fertility Foods:</strong> {data.fertilityFoods.join(', ')}
        </p>
        <p>
          <strong>Fertility Supplements:</strong> {data.fertilitySupplements}
        </p>
        <p>
          <strong>Review Plan:</strong> {data.followUpPlan}
        </p>
        <div className="pt-2 border-t border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Provisional Diagnosis
          </span>
          <strong className="text-sm text-slate-900">{data.finalDiagnosis}</strong>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs avoid-break">
        <div>
          <div className="border-b border-slate-400 w-48 mb-1" />
          <p className="font-bold text-slate-800">{data.femaleName || patient?.name}</p>
          <p className="text-slate-500">Patient Attestation</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="border-b border-slate-400 w-48 mb-1" />
          <p className="font-bold text-slate-800">{data.seenByDr || 'Treating Consultant'}</p>
          <p className="text-slate-500">Consultant Infertility Specialist</p>
        </div>
      </div>
    </div>
  );
}
