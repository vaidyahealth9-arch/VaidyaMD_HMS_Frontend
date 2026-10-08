'use client';

import React from 'react';
import { Truck, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PurchaseOrdersTabProps {
  purchaseOrders: any[];
  onOpenNewPoModal: () => void;
}

export default function PurchaseOrdersTab({
  purchaseOrders,
  onOpenNewPoModal,
}: PurchaseOrdersTabProps) {
  return (
    <div className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Vendor Purchase Orders</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Procurement orders dispatched to approved pharmaceutical distributors</p>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenNewPoModal()}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs h-8 px-3 rounded-md shadow-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Purchase Order</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">PO Number</th>
                    <th className="p-3.5">Vendor Name</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-xs">No Vendor Purchase Orders</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                          Create formal purchase orders to send to pharmaceutical distributors for supply replenishment.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => onOpenNewPoModal()}
                            className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-8 px-3 rounded-md gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Purchase Order</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po: any) => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{po.po_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{po.vendor_name}</td>
                        <td className="p-3.5 font-bold text-slate-900">{formatCurrency(po.total_amount)}</td>
                        <td className="p-3.5">
                          <Badge variant="purple" className="text-[10px] uppercase font-bold">{po.status}</Badge>
                        </td>
                        <td className="p-3.5 text-slate-500">{formatDate(po.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

    </div>
  );
}
