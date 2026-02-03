import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getVouchers, createVoucher, deleteVoucher } from '../services/api';
import { format } from 'date-fns';

interface Voucher {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  pointsCost: number;
  quantity?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function Vouchers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', code: '', type: 'percentage', value: 0, pointsCost: 0, quantity: '', validFrom: '', validUntil: '',
  });

  const { data, isLoading } = useQuery({ queryKey: ['vouchers'], queryFn: getVouchers });

  const createMutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vouchers'] }); setShowModal(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, quantity: formData.quantity ? parseInt(formData.quantity) : undefined });
  };

  const formatValue = (v: Voucher) => v.type === 'percentage' ? `${v.value}%` : v.type === 'fixed' ? `$${v.value}` : 'Free';

  const vouchers: Voucher[] = data?.vouchers || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vouchers</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Plus className="h-5 w-5" /> New Voucher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No vouchers found</td></tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="font-medium text-gray-900">{voucher.name}</div><div className="text-sm text-gray-500">{voucher.code}</div></td>
                  <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{formatValue(voucher)} OFF</span></td>
                  <td className="px-6 py-4 text-sm">{voucher.pointsCost} pts</td>
                  <td className="px-6 py-4 text-sm">{voucher.usedCount}{voucher.quantity ? ` / ${voucher.quantity}` : ''}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(voucher.validUntil), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-indigo-600 mr-3"><Pencil className="h-5 w-5" /></button>
                    <button onClick={() => confirm('Delete?') && deleteMutation.mutate(voucher.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Create Voucher</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option><option value="freebie">Freebie</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Value</label><input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Points Cost</label><input type="number" value={formData.pointsCost} onChange={(e) => setFormData({ ...formData, pointsCost: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Unlimited" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label><input type="date" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label><input type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
