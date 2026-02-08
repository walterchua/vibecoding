import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../services/api';

interface BrandingConfig {
  businessName: string;
  logoUrl: string;
  contactEmail: string;
  supportPhone: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  otpRequired: boolean;
}

interface DisplayConfig {
  currencySymbol: string;
  pointsLabel: string;
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
    >
      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
    </button>
  );
}

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const [branding, setBranding] = useState<BrandingConfig>({
    businessName: 'My Business',
    logoUrl: '',
    contactEmail: '',
    supportPhone: '',
  });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  const [system, setSystem] = useState<SystemConfig>({
    maintenanceMode: false,
    registrationEnabled: true,
    otpRequired: true,
  });
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemSaved, setSystemSaved] = useState(false);

  const [display, setDisplay] = useState<DisplayConfig>({
    currencySymbol: '$',
    pointsLabel: 'Points',
  });
  const [displaySaving, setDisplaySaving] = useState(false);
  const [displaySaved, setDisplaySaved] = useState(false);

  const { data: brandingData } = useQuery({
    queryKey: ['settings', 'admin_branding'],
    queryFn: () => getSettings('admin_branding'),
  });

  const { data: systemData } = useQuery({
    queryKey: ['settings', 'admin_system'],
    queryFn: () => getSettings('admin_system'),
  });

  const { data: displayData } = useQuery({
    queryKey: ['settings', 'admin_display'],
    queryFn: () => getSettings('admin_display'),
  });

  useEffect(() => {
    if (brandingData?.settings) {
      setBranding({
        businessName: String(brandingData.settings.businessName ?? 'My Business'),
        logoUrl: String(brandingData.settings.logoUrl ?? ''),
        contactEmail: String(brandingData.settings.contactEmail ?? ''),
        supportPhone: String(brandingData.settings.supportPhone ?? ''),
      });
    }
  }, [brandingData]);

  useEffect(() => {
    if (systemData?.settings) {
      setSystem({
        maintenanceMode: Boolean(systemData.settings.maintenanceMode),
        registrationEnabled: systemData.settings.registrationEnabled !== false,
        otpRequired: systemData.settings.otpRequired !== false,
      });
    }
  }, [systemData]);

  useEffect(() => {
    if (displayData?.settings) {
      setDisplay({
        currencySymbol: String(displayData.settings.currencySymbol ?? '$'),
        pointsLabel: String(displayData.settings.pointsLabel ?? 'Points'),
      });
    }
  }, [displayData]);

  const saveBranding = async () => {
    setBrandingSaving(true);
    try {
      await updateSettings('admin_branding', branding);
      queryClient.invalidateQueries({ queryKey: ['settings', 'admin_branding'] });
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    } finally {
      setBrandingSaving(false);
    }
  };

  const saveSystem = async () => {
    setSystemSaving(true);
    try {
      await updateSettings('admin_system', system);
      queryClient.invalidateQueries({ queryKey: ['settings', 'admin_system'] });
      setSystemSaved(true);
      setTimeout(() => setSystemSaved(false), 2000);
    } finally {
      setSystemSaving(false);
    }
  };

  const saveDisplay = async () => {
    setDisplaySaving(true);
    try {
      await updateSettings('admin_display', display);
      queryClient.invalidateQueries({ queryKey: ['settings', 'admin_display'] });
      setDisplaySaved(true);
      setTimeout(() => setDisplaySaved(false), 2000);
    } finally {
      setDisplaySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>

      {/* Platform Branding */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={branding.businessName}
              onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="text"
              value={branding.logoUrl}
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={branding.contactEmail}
              onChange={(e) => setBranding({ ...branding, contactEmail: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
            <input
              type="tel"
              value={branding.supportPhone}
              onChange={(e) => setBranding({ ...branding, supportPhone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
        <div className="mt-4">
          <SaveButton saving={brandingSaving} saved={brandingSaved} onClick={saveBranding} />
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Configuration</h3>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
              <p className="text-xs text-gray-500">Disable public access while updating</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={system.maintenanceMode}
                onChange={(e) => setSystem({ ...system, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Registration Enabled</p>
              <p className="text-xs text-gray-500">Allow new members to sign up</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={system.registrationEnabled}
                onChange={(e) => setSystem({ ...system, registrationEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">OTP Required</p>
              <p className="text-xs text-gray-500">Require phone verification for login</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={system.otpRequired}
                onChange={(e) => setSystem({ ...system, otpRequired: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>
        </div>
        <div className="mt-4">
          <SaveButton saving={systemSaving} saved={systemSaved} onClick={saveSystem} />
        </div>
      </div>

      {/* Points Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Points Display</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={display.currencySymbol}
              onChange={(e) => setDisplay({ ...display, currencySymbol: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points Label</label>
            <input
              type="text"
              value={display.pointsLabel}
              onChange={(e) => setDisplay({ ...display, pointsLabel: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Points"
            />
          </div>
        </div>
        <div className="mt-4">
          <SaveButton saving={displaySaving} saved={displaySaved} onClick={saveDisplay} />
        </div>
      </div>
    </div>
  );
}
