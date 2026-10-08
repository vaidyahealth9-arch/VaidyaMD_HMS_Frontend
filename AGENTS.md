# 🏥 VaidyaMD HMS Frontend — Agent & Copilot Instructions

> **Purpose:** This file is the single source of truth for any AI agent, copilot, or developer working on `VaidyaMD_HMS_Frontend`.
> Read this fully before touching any file in this project.

---

## 1. Project Overview

**VaidyaMD HMS** is an enterprise-grade Hospital Management System built for fertility clinics, IVF centres, and gynaecology practices. The frontend is a **Next.js 14+ App Router** application written in **TypeScript 5+**.

**Tech Stack:**
- **Framework:** Next.js 14+ (App Router, `'use client'` components where needed)
- **Language:** TypeScript 5 (strict mode — zero tolerance for `any` unless explicitly justified)
- **Styling:** Tailwind CSS (utility-first, curated slate/teal/emerald/[#2878a8] brand system)
- **Icons:** `lucide-react` only — no other icon libraries
- **API Client:** Custom typed functions in `lib/api.ts` — no raw `fetch()` inside components
- **Auth/Tenant Context:** `useAuth()` from `contexts/AuthContext.tsx`
- **Shared UI Kit:** `@/shared/ui/*` (Badge, Button, Card, Dialog, Table, Sheet, Select, etc.)

---

## 2. Repository Structure (Canonical)

```
VaidyaMD_HMS_Frontend/
├── app/
│   ├── (dashboard)/          # All authenticated routes (App Router groups)
│   │   ├── appointments/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── cosgyn/page.tsx
│   │   ├── counseling/page.tsx
│   │   ├── fertility/treatment-board/page.tsx
│   │   ├── ipd/page.tsx
│   │   ├── ivf-lab/page.tsx
│   │   ├── lims/page.tsx
│   │   ├── opd/page.tsx
│   │   ├── patients/page.tsx
│   │   ├── patients/register/page.tsx
│   │   ├── pharmacy/page.tsx
│   │   └── settings/page.tsx
│   └── (auth)/               # Unauthenticated routes
├── components/               # ALL DOMAIN UI COMPONENTS LIVE HERE
│   ├── analytics/
│   ├── appointments/
│   ├── billing/tabs/
│   ├── counseling/
│   ├── fertility/
│   │   ├── hrt-fet/          # HRT FET Protocol submodule (8 components)
│   │   └── wizard/           # Treatment Cycle Wizard steps
│   ├── ipd/
│   ├── ivf/
│   │   ├── tabs/
│   │   └── modals/
│   ├── lims/
│   ├── opd/
│   │   └── proforma/         # Clinical history proforma (8 section components)
│   ├── patients/registration/
│   ├── pharmacy/
│   └── settings/
│       ├── tabs/
│       └── modals/
├── shared/ui/                # Shared primitives: badge, button, card, dialog, table…
├── lib/
│   ├── api.ts                # All API call functions (typed)
│   ├── utils.ts              # Utility helpers (cn, formatDate, …)
│   └── hooks/                # Custom React hooks
├── contexts/
│   ├── AuthContext.tsx        # useAuth() → user, currentBranch, token
│   └── ToastContext.tsx       # toast.success() / toast.error()
└── components/app-shell/     # Sidebar, TopNav, layout wrappers
```

---

## 3. Mandatory Architecture Rules

### 3.0 No Hardcoding Policy
> **CRITICAL:** ABSOLUTELY NO HARDCODING of clinical protocols, medical configurations, drugs, or data-driven logic. All protocols (e.g. Antagonist, Long Agonist, HRT FET) and configuration details must be database-driven and dynamically loaded. If you are adding a list of static templates or fallback drugs in code, **STOP** and move it to the database/config instead.

### 3.1 The Golden Rule — No Monoliths

> **Every `app/(dashboard)/*/page.tsx` MUST be a thin orchestrator of ≤ 350 lines.**

Page files MUST NOT contain:
- Inline JSX form sections (> 60 lines each)
- Inline modal definitions
- Domain-specific business logic or state trees

All UI sections, modals, tables, and forms belong in `components/<domain>/`.

### 3.2 Component Extraction Hierarchy

When a feature grows, decompose it in this order:

```
page.tsx (orchestrator, ≤ 350 lines)
  └── components/<domain>/
        ├── <Domain>Tab.tsx           # One component per tab view
        ├── <Domain>Modal.tsx         # Action modals
        ├── <Domain>Table.tsx         # Table + row actions
        ├── types.ts                  # All interfaces for this domain
        └── index.ts                  # Barrel export (re-exports everything)
```

For complex sub-features, use nested subdirectories:
```
components/fertility/
  ├── hrt-fet/
  │   ├── types.ts
  │   ├── printUtils.ts
  │   ├── HrtFetMedicationModal.tsx
  │   ├── HrtFetSetupSection.tsx
  │   ├── HrtFetProtocolTable.tsx
  │   ├── HrtFetCalendarView.tsx
  │   └── index.ts
  └── wizard/
      ├── types.ts
      ├── WizardStep1.tsx  …  WizardStep5.tsx
      └── index.ts
```

---

## 4. Design System & Styling Rules

### 4.1 Color System (NEVER use plain red/blue/green)

| Semantic           | Tailwind Classes                                         |
| :----------------- | :------------------------------------------------------- |
| **Primary Brand**  | `bg-[#2878a8]`, `text-[#2878a8]`                         |
| **Fertility / OPD**| `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`|
| **Warning**        | `bg-amber-50`, `text-amber-800`, `border-amber-200`      |
| **Danger / Alert** | `bg-rose-50`, `text-rose-700`, `border-rose-200`         |
| **Neutral**        | `bg-slate-50`, `text-slate-700`, `border-slate-200`      |
| **IVF Accent**     | `bg-[#2F6F8F]`, `text-[#2F6F8F]`                        |

### 4.2 Tab Navigation — Standard Pill Tab Bar

All tab bars MUST use the following pill tab pattern. **Never** build bespoke tab bars with unstyled `<button>` elements.

```tsx
<div className="flex bg-slate-100/80 p-0.5 rounded-xl text-xs font-semibold gap-0.5">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
        activeTab === tab.id
          ? 'bg-white text-slate-900 shadow-sm font-bold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
      }`}
    >
      {tab.icon}
      <span>{tab.label}</span>
      {tab.badge !== undefined && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2878a8]/10 text-[#2878a8]">
          {tab.badge}
        </span>
      )}
    </button>
  ))}
</div>
```

### 4.3 Page Headers — Standard Header Pattern

```tsx
<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-[#2878a8]/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-[#2878a8]" />
    </div>
    <div>
      <h1 className="text-lg font-bold text-slate-900">Module Title</h1>
      <p className="text-xs text-slate-500">Descriptive subtitle</p>
    </div>
  </div>
  <div className="flex items-center gap-2">{/* CTA Buttons */}</div>
</div>
```

### 4.4 Card Containers

```tsx
<div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
    <h3 className="text-sm font-semibold text-slate-800">Card Title</h3>
  </div>
  <div className="p-4">{/* content */}</div>
</div>
```

### 4.5 Tables

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-left text-xs border-collapse">
    <thead className="sticky top-0 bg-slate-50 z-10">
      <tr>
        <th className="px-3 py-2.5 font-semibold text-slate-600 border-b border-slate-200">Column</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
          <td className="px-3 py-2.5 text-slate-700">{item.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 5. TypeScript Rules (Zero-Error Policy)

> **`npx tsc --noEmit` must pass with 0 errors after every change. No exceptions.**

### Do
- Use specific interfaces — never `any` unless unavoidable for API payload fields.
- Use `unknown` and type-narrow with `instanceof Error`.
- Use `React.RefObject<HTMLElement | null>` for refs (React 18 signature).
- Create a `types.ts` in every component folder.

### Don't
- `@ts-ignore` / `@ts-expect-error` — fix the type.
- Leave unused imports or variables (ESLint will flag these).
- Use `as any` to bypass type errors.

### Import Paths (CRITICAL)
```ts
// ✅ CORRECT
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { patientsApi } from '@/lib/api';

// ❌ WRONG — this path does not exist
import { Badge } from '@/components/ui/badge';
```

### Barrel Pattern (required for every component folder)
```ts
// types.ts
export interface PatientRow { id: string; name: string; }

// index.ts
export * from './types';
export { default as PatientTable } from './PatientTable';
```

---

## 6. Printing & PDF Pattern

Never use `@media print` on the live page. Always open a clean `window.open()` print window:

```ts
const openPrintWindow = (title: string, bodyHtml: string) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Allow popups for printing.'); return; }
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 8mm 10mm; }
      body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #111827; }
    </style>
  </head><body>${bodyHtml}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
  win.onafterprint = () => win.close();
};
```

---

## 7. API & Error Handling Rules

### Always use `lib/api.ts` typed helpers
```ts
// ✅ CORRECT
const patient = await patientsApi.getPatient(patientId);

// ❌ WRONG
const res = await fetch(`/api/patients/${patientId}`);
```

### Standard async error handling
```ts
try {
  setIsSaving(true);
  await someApi.action(payload);
  toast.success('Saved', 'Action completed.');
} catch (err: unknown) {
  toast.error('Failed', err instanceof Error ? err.message : 'Unknown error');
} finally {
  setIsSaving(false);
}
```

---

## 8. File Naming Conventions

| Type | Pattern | Example |
| :--- | :--- | :--- |
| Tab component | `<Domain>Tab.tsx` or `<Domain>ListView.tsx` | `PharmacyStockTab.tsx` |
| Modal component | `<Action><Domain>Modal.tsx` | `AddStockModal.tsx` |
| Section (inside modal/sheet) | `<Section>Section.tsx` | `ProformaFemaleSection.tsx` |
| Table | `<Domain>Table.tsx` | `LimsWorklistTable.tsx` |
| Utility helpers | `<name>Utils.ts` | `printUtils.ts` |
| Domain types | `types.ts` (always lowercase) | `types.ts` |
| Barrel export | `index.ts` (always lowercase) | `index.ts` |
| Static presets | `<name>Templates.ts` or `<name>Presets.ts` | `opdTemplates.ts` |

---

## 9. Forbidden Patterns

| Pattern | Correct Alternative |
| :--- | :--- |
| `import ... from '@/components/ui/badge'` | Use `@/shared/ui/badge` |
| Raw `fetch()` inside components | Use `lib/api.ts` functions |
| Page files > 350 lines | Extract to `components/<domain>/` |
| `useEffect` for client-side filtering/sorting | `useMemo` |
| Hardcoded `text-red-500` for status colours | Use semantic colour system (§4.1) |
| Custom tab bars without pill style | Standard pill tab bar (§4.2) |
| `console.log` left in committed code | Remove before commit |
| `window.print()` on the live document | Use `openPrintWindow()` pattern (§6) |
| `@ts-ignore` | Fix the TypeScript type |
| Monolith page files (> 350 lines) | Decompose into components |

---

## 10. Module-to-Component Directory Map

| Route | Component Folder |
| :--- | :--- |
| `/pharmacy` | `components/pharmacy/` |
| `/settings` | `components/settings/tabs/` + `components/settings/modals/` |
| `/patients` | `components/patients/` |
| `/patients/register` | `components/patients/registration/` |
| `/appointments` | `components/appointments/` |
| `/ivf-lab` | `components/ivf/tabs/` + `components/ivf/modals/` |
| `/billing` | `components/billing/tabs/` |
| `/ipd` | `components/ipd/` |
| `/lims` | `components/lims/` |
| `/counseling` | `components/counseling/` |
| `/fertility/treatment-board` | `components/fertility/TreatmentBoardTable.tsx` |
| `/analytics` | `components/analytics/` |
| OPD Workbench | `components/opd/OPDWorkbench.tsx` + `components/opd/proforma/` |
| Stimulation Calendar | `components/fertility/StimulationCalendarGrid.tsx` |
| HRT FET Sheet | `components/fertility/HrtFetProtocolSheet.tsx` + `components/fertility/hrt-fet/` |
| Cycle Wizard | `components/fertility/TreatmentCycleWizard.tsx` + `components/fertility/wizard/` |

---

## 11. Adding a New Feature — Checklist

1. **Identify the domain** — which module? (billing, pharmacy, opd…)
2. **Check `components/<domain>/`** — does it already exist? Extend it.
3. **Write types first** — add interfaces to `components/<domain>/types.ts`.
4. **Build the component** — create a `.tsx` file with a clean default export.
5. **Export from barrel** — add to `components/<domain>/index.ts`.
6. **Import in page** — `import { NewComponent } from '@/components/<domain>';`
7. **Run TypeScript check** — `npx tsc --noEmit` → must show 0 errors.
8. **Keep page thin** — page file must stay ≤ 350 lines.

---

## 12. Windows / PowerShell Dev Notes

- **Never** run `python -c "..."` with Unicode characters (e.g., `₹`, `→`, emoji) on Windows — it will throw `UnicodeEncodeError`.
- **Always** write Python automation code to a `.py` file, then run: `python path/to/script.py`.
- Avoid complex inline PowerShell string escaping — use `.py` scripts instead.
