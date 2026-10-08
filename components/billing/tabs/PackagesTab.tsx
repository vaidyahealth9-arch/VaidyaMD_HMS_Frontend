'use client';

import React from 'react';

interface PackagesTabProps {
  packages: any[];
  onSelectPackage: (pkg: any) => void;
}

export default function PackagesTab({
  packages,
  onSelectPackage,
}: PackagesTabProps) {
  return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const pkgItems = Array.isArray(pkg.items) ? pkg.items : [];
            const standardTotal = pkgItems.reduce(
              (acc: number, it: any) => acc + (Number(it.price ?? it.cost ?? 0) * Number(it.quantity || 1)),
              0
            );
            const packagePrice = parseFloat(pkg.base_price ?? pkg.price ?? 0) || 0;
            const savings = Math.max(0, standardTotal - packagePrice);

            return (
              <div
                key={pkg.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      {pkg.plugin_id || 'Clinical'} Package
                    </span>
                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                        Save ₹{savings.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {pkg.description || 'Comprehensive clinical procedure bundle.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 pb-0.5 border-b border-slate-100">
                      <span>Included Components ({pkgItems.length})</span>
                      <span>Tariff Value</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {pkgItems.map((item: any, idx: number) => {
                        const price = Number(item.price ?? item.cost ?? 0);
                        const qty = Number(item.quantity || 1);
                        return (
                          <div
                            key={idx}
                            className="flex justify-between text-xs text-slate-700 py-0.5 border-b border-slate-50 last:border-0"
                          >
                            <span className="truncate pr-2">
                              • {item.name || item.description}{' '}
                              <span className="text-slate-400 font-mono text-[10px]">({qty}x)</span>
                            </span>
                            <span className="font-bold font-mono text-slate-900 shrink-0">
                              ₹{(price * qty).toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })}
                      {pkgItems.length === 0 && (
                        <p className="text-slate-400 text-xs italic">No individual components specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                      Package Net Price
                    </span>
                    <span className="text-xl font-extrabold text-primary font-mono">
                      ₹{packagePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectPackage(pkg)}
                    className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    Bill Package
                  </button>
                </div>
              </div>
            );
          })}
        </div>
  );
}
