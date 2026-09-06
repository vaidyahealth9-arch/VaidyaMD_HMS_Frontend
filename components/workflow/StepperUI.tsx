'use client';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

interface StepperUIProps {
  steps: Step[];
  onStepClick?: (stepId: string) => void;
}

const statusIcons: Record<string, string> = {
  completed: '✓',
  active: '',
  pending: '',
};

export default function StepperUI({ steps, onStepClick }: StepperUIProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <div className="relative flex justify-between items-start w-full max-w-3xl mx-auto">
        {/* Background connecting line */}
        <div className="absolute left-0 top-6 w-full h-0.5 bg-slate-100 z-0 rounded" />

        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`step-${step.status} relative z-10 flex flex-col items-center gap-3`}
            style={{ width: `${100 / steps.length}%` }}
          >
            {/* Connecting line to next step */}
            {idx < steps.length - 1 && (
              <div className={`step-line absolute left-1/2 top-6 h-0.5 w-full -z-10 rounded ${
                step.status === 'completed' ? 'bg-indigo-500' : 'bg-slate-100'
              }`} />
            )}

            {/* Step Circle */}
            <button
              onClick={() => onStepClick?.(step.id)}
              className={`step-circle w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm shadow-sm bg-white transition-all duration-300 ${
                onStepClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              }`}
            >
              {step.status === 'completed' ? (
                <span className="text-sm">✓</span>
              ) : (
                <span>{idx + 1}</span>
              )}
            </button>

            {/* Step Label */}
            <span className={`text-xs font-semibold text-center leading-tight ${
              step.status === 'active' ? 'text-indigo-700 font-bold' :
              step.status === 'completed' ? 'text-slate-700' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
