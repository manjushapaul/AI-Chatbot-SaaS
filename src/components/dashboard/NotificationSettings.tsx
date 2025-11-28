'use client';

import { useState, useEffect } from 'react';
import { typography } from '@/lib/design-tokens';

interface NotificationPreference {
  id?: string;
  category: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  frequency: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

const categories = [
  {
    category: 'bot_activity',
    name: 'Bot Activity',
    description: 'New conversations, ratings, and bot activity',
  },
  {
    category: 'system',
    name: 'System & Performance',
    description: 'Bot status, training updates, and system alerts',
  },
  {
    category: 'metrics',
    name: 'Business Metrics',
    description: 'Daily summaries and usage limits',
  },
  {
    category: 'billing',
    name: 'Billing & Subscription',
    description: 'Payment updates and subscription changes',
  },
  {
    category: 'security',
    name: 'Security & Login',
    description: 'Login alerts and security events',
  },
  {
    category: 'kb',
    name: 'Knowledge Base',
    description: 'Document uploads and processing updates',
  },
  {
    category: 'widget',
    name: 'Widgets',
    description: 'Widget installation and error alerts',
  },
];

export function NotificationSettings() {
  const [globalSettings, setGlobalSettings] = useState({
    inAppEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data || []);
          // Initialize preferences for all categories if not present
          const existingCategories = new Set(data.data?.map((p: NotificationPreference) => p.category) || []);
          const missingCategories = categories.filter(
            (c) => !existingCategories.has(c.category)
          );
          if (missingCategories.length > 0) {
            const newPreferences = missingCategories.map((c) => ({
              category: c.category,
              inAppEnabled: true,
              emailEnabled: false,
              smsEnabled: false,
              frequency: 'REALTIME',
            }));
            setPreferences((prev) => [...prev, ...newPreferences]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (category: string, field: string, value: boolean | string) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.category === category ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setSuccess('Notification preferences saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save preferences');
      }
    } catch (error) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Test notification sent! Check your notification center.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to send test notification');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      setError('Failed to send test notification. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const getPreference = (category: string): NotificationPreference => {
    return (
      preferences.find((p) => p.category === category) || {
        category,
        inAppEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        frequency: 'REALTIME',
      }
    );
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Global Settings */}
      <div>
        <h3 className={typography.sectionTitle}>Global Notification Settings</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className={`${typography.labelLarge} block`}>
                Enable in-app notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive notifications in the app
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={globalSettings.inAppEnabled}
                onChange={(e) =>
                  setGlobalSettings({ ...globalSettings, inAppEnabled: e.target.checked })
                }
                className="sr-only peer check-peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-soft"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`${typography.labelLarge} block`}>
                Enable email notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={globalSettings.emailEnabled}
                onChange={(e) =>
                  setGlobalSettings({ ...globalSettings, emailEnabled: e.target.checked })
                }
                className="sr-only peer check-peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-soft"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`${typography.labelLarge} block`}>
                Enable SMS notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive notifications via SMS (coming soon)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer opacity-50">
              <input
                type="checkbox"
                checked={globalSettings.smsEnabled}
                disabled
                className="sr-only peer check-peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-soft"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className={`${typography.labelLarge} block`}>
                  Do Not Disturb
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Quiet hours for notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.quietHoursEnabled}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      quietHoursEnabled: e.target.checked,
                    })
                  }
                  className="sr-only peer check-peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-soft"></div>
              </label>
            </div>
            {globalSettings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    From
                  </label>
                  <input
                    type="time"
                    value={globalSettings.quietHoursStart}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        quietHoursStart: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    To
                  </label>
                  <input
                    type="time"
                    value={globalSettings.quietHoursEnd}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        quietHoursEnd: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div>
        <h3 className={typography.sectionTitle}>Notification Categories</h3>
        <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className={`${typography.labelLarge} text-left py-3 px-2`}>
                  Category
                </th>
                <th className={`${typography.labelLarge} text-center py-3 px-2`}>
                  In-app
                </th>
                <th className={`${typography.labelLarge} text-center py-3 px-2`}>
                  Email
                </th>
                <th className={`${typography.labelLarge} text-center py-3 px-2`}>
                  SMS
                </th>
                <th className={`${typography.labelLarge} text-left py-3 px-2`}>
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const pref = getPreference(cat.category);
                return (
                  <tr key={cat.category} className="border-b border-gray-50">
                    <td className="py-4 px-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cat.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {cat.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.inAppEnabled}
                          onChange={(e) =>
                            updatePreference(cat.category, 'inAppEnabled', e.target.checked)
                          }
                          className="sr-only peer check-peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-soft"></div>
                      </label>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.emailEnabled}
                          onChange={(e) =>
                            updatePreference(cat.category, 'emailEnabled', e.target.checked)
                          }
                          className="sr-only peer check-peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-soft"></div>
                      </label>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <label className="relative inline-flex items-center cursor-pointer opacity-50">
                        <input
                          type="checkbox"
                          checked={pref.smsEnabled}
                          disabled
                          className="sr-only peer check-peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-soft"></div>
                      </label>
                    </td>
                    <td className="py-4 px-2">
                      <select
                        value={pref.frequency}
                        onChange={(e) =>
                          updatePreference(cat.category, 'frequency', e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-xs text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      >
                        <option value="REALTIME">Realtime</option>
                        <option value="HOURLY_DIGEST">Hourly digest</option>
                        <option value="DAILY_DIGEST">Daily digest</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Test Notification */}
      <div>
        <h3 className={typography.sectionTitle}>Test Notification</h3>
        <div className="mt-4 space-y-4">
          <p className="text-xs text-gray-500">
            Send a test notification to verify your settings are working correctly.
          </p>
          <button
            onClick={handleTestNotification}
            className="rounded-full bg-accent-soft text-white text-sm font-medium px-5 py-2 shadow hover:bg-accent-soft/80 transition-colors"
          >
            Send test notification
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-accent-soft text-white px-5 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

