'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import type { IPDOrder } from '@/features/ipd/types';

interface BedsideOrderItemCardProps {
  order: IPDOrder;
  onAdminister: (orderId: string) => void;
  isAdministering?: boolean;
}

export default function BedsideOrderItemCard({
  order,
  onAdminister,
  isAdministering = false,
}: BedsideOrderItemCardProps) {
  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={order.order_type === 'Medication' ? 'purple' : 'outline'} className="text-[10px]">
            {order.order_type}
          </Badge>
          <span className="font-bold text-slate-900 text-sm">
            {order.item_name} {order.dosage || ''}
          </span>
          {order.route && <span className="text-xs text-slate-500 font-medium">({order.route})</span>}
        </div>
        <Badge variant={order.status === 'Active' ? 'success' : 'secondary'} className="text-[10px]">
          {order.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <p>
          <span className="font-medium text-slate-500">Regimen:</span> {order.frequency || 'OD'} ·{' '}
          {order.duration || 'Ongoing'}
        </p>
        <p className="text-[11px] text-slate-400">
          Ordered by: <span className="font-semibold text-slate-700">{order.ordered_by_name || 'Doctor'}</span>
        </p>
      </div>

      {order.instructions && (
        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
          &ldquo;{order.instructions}&rdquo;
        </p>
      )}

      {/* Administered Log (eMAR) */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-slate-500">
          Doses Given: {order.administered_logs?.length || 0}
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isAdministering}
            onClick={() => onAdminister(order.id)}
            className="h-6 text-[11px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Give Dose (eMAR)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
