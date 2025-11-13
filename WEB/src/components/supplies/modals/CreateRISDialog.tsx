import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRISRequests } from '@/hooks/data/useRISRequests';
import { useSupplyStore } from '@/store/supply/useSupplyStore';
import { v4 as uuidv4 } from 'uuid';

export const CreateRISDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }> = ({ open, onOpenChange }) => {
  const { create } = useRISRequests();
  const { supplies } = useSupplyStore();

  const [requester, setRequester] = useState('');
  const [department, setDepartment] = useState('');
  const [items, setItems] = useState([{ supplyId: '', quantityRequested: 0, purpose: '' }]);

  const submit = async () => {
    const risNumber = `RIS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
    const mapped = items.map(i => {
      const s = supplies.find(x => x.id === i.supplyId);
      return {
        id: uuidv4(),
        supplyId: i.supplyId,
        description: s?.description || '',
        unit: s?.unit || 'Piece',
        quantityRequested: i.quantityRequested,
        unitCost: s?.unitCost || 0,
        purpose: i.purpose
      };
    });

    await create({
      id: uuidv4(),
      risNumber,
      requester,
      department,
      dateRequested: new Date().toISOString(),
      items: mapped,
      status: 'pending',
      totalEstimatedValue: mapped.reduce((sum, it) => sum + (it.unitCost || 0) * it.quantityRequested, 0)
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create RIS Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm">Requester</label>
            <Input value={requester} onChange={(e)=>setRequester(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Department</label>
            <Input value={department} onChange={(e)=>setDepartment(e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium">Items</p>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-end mb-2">
                <select className="col-span-2 border p-2" value={it.supplyId} onChange={(e)=> {
                  const newItems = [...items]; newItems[idx].supplyId = e.target.value; setItems(newItems);
                }}>
                  <option value="">Select item</option>
                  {supplies.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                </select>
                <input type="number" className="border p-2" value={it.quantityRequested} onChange={(e)=>{ const newItems = [...items]; newItems[idx].quantityRequested = parseInt(e.target.value)||0; setItems(newItems); }} />
                <input className="border p-2" value={it.purpose} onChange={(e)=>{ const newItems = [...items]; newItems[idx].purpose = e.target.value; setItems(newItems); }} />
              </div>
            ))}
            <Button variant="outline" onClick={()=> setItems(prev => [...prev, { supplyId:'', quantityRequested:0, purpose:'' }])}>Add Item</Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button className="bg-blue-600" onClick={submit}>Create RIS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};





