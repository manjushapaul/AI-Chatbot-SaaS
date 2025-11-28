'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Key, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { NotificationSettings } from '@/components/dashboard/NotificationSettings';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'team';
      activitySharing: boolean;
      analyticsSharing: boolean;
    };
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    loginHistory: Array<{
      date: string;
      ip: string;
      location: string;
      device: string;
    }>;
  };
}

interface TenantSettings {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  branding: {
    logo?: string;
    primaryColor: string;
    companyName: string;
    supportEmail: string;
  };
  integrations: {
    slack?: string;
    discord?: string;
    webhook?: string;
  };
  limits: {
    maxUsers: number;
    maxBots: number;
    maxStorage: number;
    maxApiCalls: number;
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Read tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'preferences', 'security', 'notifications', 'account'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
  };
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    timezone: '',
    language: ''
  });
  
  const { theme, setTheme } = useTheme();
  
  const [preferencesForm, setPreferencesForm] = useState({
    theme: 'light' as 'light' | 'dark',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'team' as 'public' | 'private' | 'team',
      activitySharing: true,
      analyticsSharing: true
    }
  });
  
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    fetchSettings();
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem('userPreferences');
      let savedTimezone = 'UTC';
      let savedLanguage = 'en';
      let savedTheme = 'system';
      let savedNotifications = {
        email: true,
        push: true,
        sms: false
      };
      let savedPrivacy = {
        profileVisibility: 'team' as 'public' | 'private' | 'team',
        activitySharing: true,
        analyticsSharing: true
      };
      let savedTwoFactorEnabled = false;
      
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences);
          savedTimezone = prefs.timezone || 'UTC';
          savedLanguage = prefs.language || 'en';
          savedTheme = prefs.theme || 'light';
          if (prefs.notifications) {
            savedNotifications = { ...savedNotifications, ...prefs.notifications };
          }
          if (prefs.privacy) {
            savedPrivacy = { ...savedPrivacy, ...prefs.privacy };
          }
          if (prefs.security?.twoFactorEnabled !== undefined) {
            savedTwoFactorEnabled = prefs.security.twoFactorEnabled;
          }
        } catch (e) {
          console.error('Error parsing saved preferences:', e);
        }
      }
      
      // Fetch user settings
      const userResponse = await fetch('/api/users/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserSettings(userData.data);
        setProfileForm({
          name: userData.data.name || '',
          email: userData.data.email || '',
          timezone: savedTimezone || userData.data.preferences?.timezone || 'UTC',
          language: savedLanguage || userData.data.preferences?.language || 'en'
        });
        // Sync theme with theme hook
        const finalTheme = savedTheme || userData.data.preferences?.theme || 'light';
        if (finalTheme === 'light' || finalTheme === 'dark') {
          setTheme(finalTheme);
        }
        setPreferencesForm({
          theme: finalTheme,
          notifications: savedNotifications || userData.data.preferences?.notifications || {
            email: true,
            push: true,
            sms: false
          },
          privacy: savedPrivacy || userData.data.preferences?.privacy || {
            profileVisibility: 'team',
            activitySharing: true,
            analyticsSharing: true
          }
        });
        setSecurityForm(prev => ({
          ...prev,
          twoFactorEnabled: savedTwoFactorEnabled || userData.data.security?.twoFactorEnabled || false
        }));
      }
      
      // Fetch tenant settings
      const tenantResponse = await fetch('/api/tenant/settings');
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenantSettings(tenantData.data);
      }
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Save preferences to localStorage
      const preferences = {
        timezone: profileForm.timezone,
        language: profileForm.language,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Update user profile (name) via API
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          timezone: profileForm.timezone,
          language: profileForm.language
        })
      });
      
      if (response.ok) {
        setSuccess('Profile updated successfully!');
        // Update the form state to reflect saved values
        setUserSettings(prev => prev ? {
          ...prev,
          name: profileForm.name,
          email: profileForm.email,
          preferences: {
            ...prev.preferences,
            timezone: profileForm.timezone,
            language: profileForm.language
          }
        } : null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Update theme via theme hook (this also saves to localStorage)
      setTheme(preferencesForm.theme);
      
      // Save preferences to localStorage (merge with existing preferences)
      const existingPrefs = localStorage.getItem('userPreferences');
      const existingData = existingPrefs ? JSON.parse(existingPrefs) : {};
      const savedPreferences = {
        ...existingData,
        theme: preferencesForm.theme,
        notifications: preferencesForm.notifications,
        privacy: preferencesForm.privacy,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('userPreferences', JSON.stringify(savedPreferences));
      
      // Update via API (for future database storage)
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencesForm)
      });
      
      if (response.ok) {
        setSuccess('Preferences updated successfully!');
        // Update the form state to reflect saved values
        setUserSettings(prev => prev ? {
          ...prev,
          preferences: {
            ...prev.preferences,
            theme: preferencesForm.theme,
            notifications: preferencesForm.notifications,
            privacy: preferencesForm.privacy
          }
        } : null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (securityForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword
        })
      });
      
      if (response.ok) {
        setSuccess('Password changed successfully!');
        setShowPasswordModal(false);
        setSecurityForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactorEnabled: securityForm.twoFactorEnabled
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch('/api/users/me', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        router.push('/auth');
      } else {
        setError('Failed to delete account');
      }
    } catch (error) {
      setError('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <AppPage>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className={typography.body}>Loading settings...</p>
        </div>
      </AppPage>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Key }
  ];

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div>
          <h1 className={typography.pageTitle}>Settings</h1>
          <p className={typography.pageSubtitle}>Manage your account and preferences</p>
        </div>

        {/* Success/Error Notifications */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <nav className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur px-2 py-1 text-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-soft text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Card */}
        <div className="rounded-2xl bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur border border-white/70 px-6 py-5 space-y-5">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              <h3 className={typography.sectionTitle}>Profile Information</h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>Timezone</label>
                  <select
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>Language</label>
                  <select
                    value={profileForm.language}
                    onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="rounded-full bg-accent-soft text-white px-5 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <>
              <h3 className={typography.sectionTitle}>User Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`${typography.labelLarge} block mb-3`}>Theme</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={theme === 'light'}
                        onChange={() => {
                          setTheme('light');
                          setPreferencesForm({ ...preferencesForm, theme: 'light' });
                        }}
                        className="h-4 w-4 text-accent-soft border-gray-300 ring-accent-soft"
                      />
                      <span>Light</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={theme === 'dark'}
                        onChange={() => {
                          setTheme('dark');
                          setPreferencesForm({ ...preferencesForm, theme: 'dark' });
                        }}
                        className="h-4 w-4 text-accent-soft border-gray-300 ring-accent-soft"
                      />
                      <span>Dark</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-3`}>Notifications</label>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email Notifications' },
                      { key: 'push', label: 'Push Notifications' },
                      { key: 'sms', label: 'SMS Notifications' }
                    ].map((notification) => (
                      <label key={notification.key} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferencesForm.notifications[notification.key as keyof typeof preferencesForm.notifications]}
                          onChange={(e) => setPreferencesForm({
                            ...preferencesForm,
                            notifications: {
                              ...preferencesForm.notifications,
                              [notification.key]: e.target.checked
                            }
                          })}
                          className="mr-2 w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                        />
                        <span className={typography.body}>{notification.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-3`}>Privacy</label>
                  <div className="space-y-3">
                    <div>
                      <label className={`${typography.meta} block mb-1`}>Profile Visibility</label>
                      <select
                        value={preferencesForm.privacy.profileVisibility}
                        onChange={(e) => setPreferencesForm({
                          ...preferencesForm,
                          privacy: {
                            ...preferencesForm.privacy,
                            profileVisibility: e.target.value as 'public' | 'private' | 'team'
                          }
                        })}
                        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      >
                        <option value="public">Public</option>
                        <option value="team">Team Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        { key: 'activitySharing', label: 'Share activity with team' },
                        { key: 'analyticsSharing', label: 'Share analytics data' }
                      ].map((privacy) => (
                        <label key={privacy.key} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferencesForm.privacy[privacy.key as keyof typeof preferencesForm.privacy] as boolean}
                            onChange={(e) => setPreferencesForm({
                              ...preferencesForm,
                              privacy: {
                                ...preferencesForm.privacy,
                                [privacy.key]: e.target.checked
                              }
                            })}
                            className="mr-2 w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                          />
                          <span className={typography.body}>{privacy.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handlePreferencesSave}
                  disabled={saving}
                  className="rounded-full bg-accent-soft text-white px-5 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <h3 className={typography.sectionTitle}>Security Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className={`${typography.sectionTitle} mb-3`}>Password</h4>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
                
                <div>
                  <h4 className={`${typography.sectionTitle} mb-3`}>Two-Factor Authentication</h4>
                  <div className={`${cardBase} ${cardPadding.compact} flex items-center justify-between`}>
                    <div>
                      <p className={typography.body}>Two-Factor Authentication</p>
                      <p className={typography.meta}>Add an extra layer of security to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securityForm.twoFactorEnabled}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setSecurityForm({ ...securityForm, twoFactorEnabled: newValue });
                          // Save to localStorage immediately
                          const existingPrefs = localStorage.getItem('userPreferences');
                          const existingData = existingPrefs ? JSON.parse(existingPrefs) : {};
                          const savedPreferences = {
                            ...existingData,
                            security: {
                              ...existingData.security,
                              twoFactorEnabled: newValue,
                              updatedAt: new Date().toISOString()
                            }
                          };
                          localStorage.setItem('userPreferences', JSON.stringify(savedPreferences));
                          // Update user settings state
                          setUserSettings(prev => prev ? {
                            ...prev,
                            security: {
                              ...prev.security,
                              twoFactorEnabled: newValue
                            }
                          } : null);
                          setSuccess('Two-factor authentication ' + (newValue ? 'enabled' : 'disabled') + ' successfully!');
                        }}
                        className="sr-only peer check-peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-strong"></div>
                    </label>
                  </div>
                </div>
                
                {userSettings?.security?.loginHistory && userSettings.security.loginHistory.length > 0 && (
                  <div>
                    <h4 className={`${typography.sectionTitle} mb-3`}>Recent Login Activity</h4>
                    <div className="space-y-2">
                      {userSettings.security.loginHistory.slice(0, 5).map((login, index) => (
                        <div key={index} className={`${cardBase} ${cardPadding.compact} flex items-center justify-between`}>
                          <div>
                            <p className={typography.body}>{login.device}</p>
                            <p className={typography.meta}>{login.location} • {login.ip}</p>
                          </div>
                          <span className={typography.meta}>{new Date(login.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && <NotificationSettings />}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <>
              <h3 className={typography.sectionTitle}>Account Management</h3>
              
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-amber-600 mr-2" />
                    <div>
                      <h4 className={`${typography.sectionTitle} text-amber-800`}>Danger Zone</h4>
                      <p className={`${typography.meta} text-amber-700 mt-1`}>
                        These actions cannot be undone. Please proceed with caution.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className={`${typography.sectionTitle} mb-3`}>Delete Account</h4>
                  <p className={`${typography.body} mb-4`}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className={`${typography.sectionTitle} text-base`}>Change Password</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>Current Password</label>
                  <input
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>New Password</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>Confirm New Password</label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePasswordChange}
                  className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className={`${typography.sectionTitle} text-base`}>Delete Account</h3>
                </div>
              </div>
              
              <div className="p-6">
                <p className={typography.body}>
                  Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                </p>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAccountDelete}
                  className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
