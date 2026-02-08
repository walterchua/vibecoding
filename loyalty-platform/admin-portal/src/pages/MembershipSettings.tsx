import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, X } from 'lucide-react';
import { getTiers, createTier, updateTier, getSettings, updateSettings } from '../services/api';

interface Tier {
  id: string;
  name: string;
  code: string;
  minPoints: number;
  maxPoints: number;
  pointsMultiplier: number;
  color: string;
  isActive: boolean;
}

interface PointsConfig {
  baseEarningRate: number;
  roundingRule: string;
  enableExpiry: boolean;
  expiryDays: number;
}

const defaultTierForm = {
  name: '',
  code: '',
  minPoints: 0,
  maxPoints: 0,
  pointsMultiplier: 1,
  color: '#CD7F32',
  isActive: true,
};

export default function MembershipSettings() {
  const queryClient = useQueryClient();
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState(defaultTierForm);

  const [pointsConfig, setPointsConfig] = useState<PointsConfig>({
    baseEarningRate: 1,
    roundingRule: 'floor',
    enableExpiry: false,
    expiryDays: 365,
  });
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsSaved, setPointsSaved] = useState(false);

  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['tiers'],
    queryFn: getTiers,
  });

  const { data: pointsData } = useQuery({
    queryKey: ['settings', 'points_config'],
    queryFn: () => getSettings('points_config'),
  });

  useEffect(() => {
    if (pointsData?.settings) {
      setPointsConfig({
        baseEarningRate: Number(pointsData.settings.baseEarningRate) || 1,
        roundingRule: pointsData.settings.roundingRule || 'floor',
        enableExpiry: Boolean(pointsData.settings.enableExpiry),
        expiryDays: Number(pointsData.settings.expiryDays) || 365,
      });
    }
  }, [pointsData]);

  const createMutation = useMutation({
    mutationFn: (data: typeof defaultTierForm) => createTier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
      closeTierModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof defaultTierForm }) => updateTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
      closeTierModal();
    },
  });

  const closeTierModal = () => {
    setShowTierModal(false);
    setEditingTierId(null);
    setTierForm(defaultTierForm);
  };

  const openEditTier = (tier: Tier) => {
    setEditingTierId(tier.id);
    setTierForm({
      name: tier.name,
      code: tier.code,
      minPoints: tier.minPoints,
      maxPoints: tier.maxPoints,
      pointsMultiplier: tier.pointsMultiplier,
      color: tier.color,
      isActive: tier.isActive,
    });
    setShowTierModal(true);
  };

  const handleTierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTierId) {
      updateMutation.mutate({ id: editingTierId, data: tierForm });
    } else {
      createMutation.mutate(tierForm);
    }
  };

  const handlePointsSave = async () => {
    setPointsSaving(true);
    try {
      await updateSettings('points_config', pointsConfig);
      queryClient.invalidateQueries({ queryKey: ['settings', 'points_config'] });
      setPointsSaved(true);
      setTimeout(() => setPointsSaved(false), 2000);
    } finally {
      setPointsSaving(false);
    }
  };

  const tiers: Tier[] = tiersData?.tiers || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Membership Settings</h2>

      {/* Tiers Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Tier Management</h3>
          <button
            onClick={() => { setEditingTierId(null); setTierForm(defaultTierForm); setShowTierModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add Tier
          </button>
        </div>

        {tiersLoading ? (
          <p className="text-gray-500">Loading tiers...</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Points Range</th>
                <th className="pb-3 font-medium">Multiplier</th>
                <th className="pb-3 font-medium">Color</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{tier.name}</td>
                  <td className="py-3 text-gray-600">{tier.code}</td>
                  <td className="py-3 text-gray-600">
                    {tier.minPoints.toLocaleString()} - {tier.maxPoints.toLocaleString()}
                  </td>
                  <td className="py-3 text-gray-600">{tier.pointsMultiplier}x</td>
                  <td className="py-3">
                    <span
                      className="inline-block w-6 h-6 rounded-full border"
                      style={{ backgroundColor: tier.color }}
                    />
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tier.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => openEditTier(tier)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Points Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Points Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Earning Rate (points per $1)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={pointsConfig.baseEarningRate}
              onChange={(e) => setPointsConfig({ ...pointsConfig, baseEarningRate: parseFloat(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rounding Rule</label>
            <select
              value={pointsConfig.roundingRule}
              onChange={(e) => setPointsConfig({ ...pointsConfig, roundingRule: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="floor">Floor (round down)</option>
              <option value="round">Round (nearest)</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pointsConfig.enableExpiry}
                onChange={(e) => setPointsConfig({ ...pointsConfig, enableExpiry: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
            <span className="text-sm font-medium text-gray-700">Enable Points Expiry</span>
          </div>
          {pointsConfig.enableExpiry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Period (days)
              </label>
              <input
                type="number"
                min="1"
                value={pointsConfig.expiryDays}
                onChange={(e) => setPointsConfig({ ...pointsConfig, expiryDays: parseInt(e.target.value) || 365 })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={handlePointsSave}
            disabled={pointsSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {pointsSaving ? 'Saving...' : pointsSaved ? 'Saved!' : 'Save Points Config'}
          </button>
        </div>
      </div>

      {/* Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingTierId ? 'Edit Tier' : 'Create Tier'}
              </h3>
              <button onClick={closeTierModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={tierForm.code}
                  onChange={(e) => setTierForm({ ...tierForm, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tierForm.minPoints}
                    onChange={(e) => setTierForm({ ...tierForm, minPoints: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tierForm.maxPoints}
                    onChange={(e) => setTierForm({ ...tierForm, maxPoints: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.05"
                    required
                    value={tierForm.pointsMultiplier}
                    onChange={(e) => setTierForm({ ...tierForm, pointsMultiplier: parseFloat(e.target.value) || 1 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={tierForm.color}
                    onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                    className="w-full h-10 border rounded-lg px-1 py-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierForm.isActive}
                    onChange={(e) => setTierForm({ ...tierForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTierModal}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingTierId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
