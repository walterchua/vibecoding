import { useState, useEffect } from 'react';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getMerchantOperators,
  createMerchantOperator,
  updateMerchantOperator,
  deleteMerchantOperator,
} from '../services/api';
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface MerchantOperator {
  id: string;
  name: string;
  email: string;
  posId: string;
  locationId: string;
  locationName: string;
  role?: string;
  isActive: boolean;
}

export default function Staff() {
  const [tab, setTab] = useState<'admins' | 'operators'>('admins');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [operators, setOperators] = useState<MerchantOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showOpForm, setShowOpForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editingOp, setEditingOp] = useState<MerchantOperator | null>(null);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'merchant_staff' });
  const [opForm, setOpForm] = useState({ name: '', email: '', password: '', posId: '', locationId: '', locationName: '', role: 'cashier' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminData, opData] = await Promise.all([getAdminUsers(), getMerchantOperators()]);
      setAdminUsers(adminData.admins || []);
      setOperators(opData.merchants || []);
    } catch (err) {
      console.error('Failed to load staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        const { password, ...rest } = adminForm;
        await updateAdminUser(editingAdmin.id, password ? adminForm : rest);
      } else {
        await createAdminUser(adminForm);
      }
      setShowAdminForm(false);
      setEditingAdmin(null);
      setAdminForm({ email: '', password: '', firstName: '', lastName: '', role: 'merchant_staff' });
      loadData();
    } catch (err) {
      console.error('Failed to save admin user', err);
    }
  };

  const handleOpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOp) {
        const { password, ...rest } = opForm;
        await updateMerchantOperator(editingOp.id, password ? opForm : rest);
      } else {
        await createMerchantOperator(opForm);
      }
      setShowOpForm(false);
      setEditingOp(null);
      setOpForm({ name: '', email: '', password: '', posId: '', locationId: '', locationName: '', role: 'cashier' });
      loadData();
    } catch (err) {
      console.error('Failed to save operator', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('admins')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'admins' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
        >
          Admin Users ({adminUsers.length})
        </button>
        <button
          onClick={() => setTab('operators')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'operators' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
        >
          Merchant Operators ({operators.length})
        </button>
      </div>

      {/* Admin Users Tab */}
      {tab === 'admins' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowAdminForm(true); setEditingAdmin(null); setAdminForm({ email: '', password: '', firstName: '', lastName: '', role: 'merchant_staff' }); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Admin User
            </button>
          </div>

          {showAdminForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">{editingAdmin ? 'Edit' : 'New'} Admin User</h3>
              <form onSubmit={handleAdminSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password{editingAdmin ? ' (leave blank to keep)' : ''}</label>
                  <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required={!editingAdmin} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={adminForm.role} onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="merchant_admin">Merchant Admin</option>
                    <option value="merchant_staff">Merchant Staff</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowAdminForm(false); setEditingAdmin(null); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingAdmin ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">{user.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditingAdmin(user); setAdminForm({ email: user.email, password: '', firstName: user.firstName, lastName: user.lastName, role: user.role }); setShowAdminForm(true); }} className="p-1 text-gray-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={async () => { if (confirm('Deactivate this admin?')) { await deleteAdminUser(user.id); loadData(); } }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {adminUsers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No admin users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Merchant Operators Tab */}
      {tab === 'operators' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowOpForm(true); setEditingOp(null); setOpForm({ name: '', email: '', password: '', posId: '', locationId: '', locationName: '', role: 'cashier' }); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Operator
            </button>
          </div>

          {showOpForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">{editingOp ? 'Edit' : 'New'} Merchant Operator</h3>
              <form onSubmit={handleOpSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={opForm.name} onChange={(e) => setOpForm({ ...opForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={opForm.email} onChange={(e) => setOpForm({ ...opForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password{editingOp ? ' (leave blank to keep)' : ''}</label>
                  <input type="password" value={opForm.password} onChange={(e) => setOpForm({ ...opForm, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required={!editingOp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POS ID</label>
                  <input value={opForm.posId} onChange={(e) => setOpForm({ ...opForm, posId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location ID</label>
                  <input value={opForm.locationId} onChange={(e) => setOpForm({ ...opForm, locationId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                  <input value={opForm.locationName} onChange={(e) => setOpForm({ ...opForm, locationName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={opForm.role} onChange={(e) => setOpForm({ ...opForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowOpForm(false); setEditingOp(null); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingOp ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">POS ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operators.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{op.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{op.email}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{op.posId}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{op.locationName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${op.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {op.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditingOp(op); setOpForm({ name: op.name, email: op.email, password: '', posId: op.posId, locationId: op.locationId, locationName: op.locationName, role: op.role || 'cashier' }); setShowOpForm(true); }} className="p-1 text-gray-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={async () => { if (confirm('Deactivate this operator?')) { await deleteMerchantOperator(op.id); loadData(); } }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {operators.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No merchant operators found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
