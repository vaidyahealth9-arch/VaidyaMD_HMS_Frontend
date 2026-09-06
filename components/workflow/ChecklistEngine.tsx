'use client';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
}

interface ChecklistEngineProps {
  title: string;
  items: ChecklistItem[];
  completedItems: string[];
  onToggle: (itemId: string) => void;
  stepNumber?: number;
}

export default function ChecklistEngine({ title, items, completedItems, onToggle, stepNumber }: ChecklistEngineProps) {
  const totalComplete = items.filter((i) => completedItems.includes(i.id)).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center gap-3">
        {stepNumber && (
          <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {stepNumber}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Checklist Engine — {totalComplete}/{items.length} complete
          </p>
        </div>
        {totalComplete === items.length && (
          <span className="text-emerald-600 text-sm font-bold flex items-center gap-1">
            ✓ All done
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-indigo-500 transition-all duration-500 rounded-r"
          style={{ width: `${(totalComplete / items.length) * 100}%` }}
        />
      </div>

      {/* Items */}
      <div className="p-5 space-y-3">
        {items.map((item) => {
          const isComplete = completedItems.includes(item.id);
          return (
            <label
              key={item.id}
              className={`
                flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group
                ${isComplete
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={isComplete}
                onChange={() => onToggle(item.id)}
                className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 ${isComplete ? 'accent-emerald-600' : 'accent-indigo-600'}`}
              />
              <div>
                <p className={`text-sm font-bold ${isComplete ? 'text-emerald-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                  {item.label}
                </p>
                {item.description && (
                  <p className={`text-xs mt-0.5 ${isComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {item.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
