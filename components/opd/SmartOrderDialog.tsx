'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { opdApi } from '@/lib/api';
import { Sparkles, Plus, FlaskConical, Pill, Save, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SmartOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrderSet: (orderSet: any) => void;
}

export default function SmartOrderDialog({
  open,
  onOpenChange,
  onSelectOrderSet,
}: SmartOrderDialogProps) {
  const [orderSets, setOrderSets] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Order Set Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newInvestigations, setNewInvestigations] = useState('');
  const [newMedications, setNewMedications] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  const fetchOrderSets = () => {
    opdApi.getOrderSets().then((res) => {
      if (Array.isArray(res)) setOrderSets(res);
    }).catch(() => {});
  };

  useEffect(() => {
    if (open && !isCreating && !editingId) {
      fetchOrderSets();
    }
  }, [open, isCreating, editingId]);

  const handleCreateOrUpdate = async () => {
    if (!newName || !newCategory) return;
    try {
      const payload = {
        name: newName,
        category: newCategory,
        investigations: newInvestigations.split('\n').filter(s => s.trim()),
        medications: newMedications.split('\n').filter(s => s.trim()),
        instructions: newInstructions
      };

      if (editingId) {
        await opdApi.updateOrderSet(editingId, payload);
      } else {
        await opdApi.createOrderSet(payload);
      }

      setIsCreating(false);
      setEditingId(null);
      fetchOrderSets();
      
      // Reset form
      setNewName(''); setNewCategory(''); setNewInvestigations(''); setNewMedications(''); setNewInstructions('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (os: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent select trigger
    setEditingId(os.id);
    setNewName(os.name);
    setNewCategory(os.category);
    setNewInvestigations(os.investigations.join('\n'));
    setNewMedications(os.medications.join('\n'));
    setNewInstructions(os.instructions || '');
    setIsCreating(true);
  };

  const filteredSets = orderSets.filter(os => 
    os.name.toLowerCase().includes(search.toLowerCase()) || 
    os.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) { setIsCreating(false); setEditingId(null); }}}>
      <DialogContent className="sm:max-w-[600px] p-0 bg-white overflow-hidden shadow-2xl border-0 rounded-2xl">
        <DialogTitle className="sr-only">Smart Order Sets</DialogTitle>
        
        {!isCreating ? (
          <div className="flex flex-col bg-transparent text-slate-800">
            <div className="p-3 border-b border-slate-100 flex items-center gap-2">
               <Input 
                 placeholder="Search Order Sets (e.g. Fever, Antenatal, PCOS)..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 autoFocus
                 className="h-10 text-sm shadow-none focus-visible:ring-0 border-0 flex-1" 
               />
               <Button 
                 onClick={() => {
                   setEditingId(null);
                   setNewName(''); setNewCategory(''); setNewInvestigations(''); setNewMedications(''); setNewInstructions('');
                   setIsCreating(true);
                 }} 
                 size="sm" 
                 className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 gap-1.5 text-xs font-bold px-4 shrink-0"
               >
                 <Plus className="w-3.5 h-3.5" />
                 Create New
               </Button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto bg-white p-2">
              {filteredSets.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">No clinical order sets found.</div>
              ) : (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">Clinical Order Sets (Bundles)</div>
                  {filteredSets.map((os) => (
                    <div
                      key={os.id}
                      onClick={() => {
                        onSelectOrderSet(os);
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-indigo-50/80 rounded-xl mb-1 group relative transition-colors"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-800 text-sm">{os.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50/50">{os.category}</Badge>
                          <button 
                            onClick={(e) => handleEditClick(os, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-indigo-100 rounded-md text-indigo-600 transition-opacity"
                            title="Edit Order Set"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1.5 mt-1 pr-8">
                        <FlaskConical className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">Labs: {os.investigations.join(', ')}</span>
                      </div>

                      <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1.5 mt-0.5 pr-8">
                        <Pill className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Rx: {os.medications.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white max-h-[85vh] overflow-y-auto">
             <div className="mb-4 flex items-center justify-between">
               <div>
                 <h3 className="font-bold text-lg text-slate-900">{editingId ? 'Edit Order Set' : 'Create New Order Set'}</h3>
                 <p className="text-xs text-slate-500">Define clinical bundles for rapid charting.</p>
               </div>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-700 mb-1 block">Bundle Name *</label>
                 <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. URI Pediatric Protocol" className="h-9 text-xs" />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-700 mb-1 block">Category *</label>
                 <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Pediatrics" className="h-9 text-xs" />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-700 mb-1 block">Investigations (One per line)</label>
                 <textarea value={newInvestigations} onChange={e => setNewInvestigations(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} placeholder="CBC&#10;CRP" />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-700 mb-1 block">Medications (One per line)</label>
                 <textarea value={newMedications} onChange={e => setNewMedications(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} placeholder="Syrup Paracetamol 5ml TDS&#10;Syp Cetirizine 2.5ml HS" />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-700 mb-1 block">General Instructions</label>
                 <Input value={newInstructions} onChange={e => setNewInstructions(e.target.value)} placeholder="Sponge for fever >101" className="h-9 text-xs" />
               </div>
             </div>
             
             <div className="mt-6 flex items-center justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsCreating(false)} className="text-xs font-bold rounded-xl h-9 text-slate-600">Cancel</Button>
               <Button onClick={handleCreateOrUpdate} disabled={!newName || !newCategory} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 gap-1.5 text-xs font-bold">
                 <Save className="w-3.5 h-3.5" />
                 {editingId ? 'Save Changes' : 'Create Order Set'}
               </Button>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
