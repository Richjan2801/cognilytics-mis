import { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell, Globe, CheckCircle, AlertCircle, Save, Settings as SettingsIcon } from 'lucide-react';
import showToast from '../utils/toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

/**
 * Settings Page
 * 
 * User settings and preferences with validation and save functionality
 * Adapts to user role (Teacher/Student/Admin)
 */

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'teacher@cognilytics.com',
    role: 'Teacher',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileStatus, setProfileStatus] = useState(null);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStatus, setPasswordStatus] = useState(null);

  // Notification state - will be adapted based on role
  const [notifications, setNotifications] = useState({
    overloadAlerts: true,
    dailySummary: true,
    weeklyReport: false,
  });
  const [notificationStatus, setNotificationStatus] = useState(null);

  // Initialize profile data from auth context
  useEffect(() => {
    if (user) {
      setProfileData({
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'John Doe',
        email: user.email || 'user@cognilytics.com',
        role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User',
      });
    }
  }, [user]);

  // Language state
  const [languageData, setLanguageData] = useState({
    language: 'English',
    timezone: 'Asia/Jakarta (GMT+7)',
  });
  const [languageStatus, setLanguageStatus] = useState(null);

  // Profile handlers
  const validateProfile = () => {
    const errors = {};
    
    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    } else if (profileData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(profileData.email)) {
      errors.email = 'Invalid email format';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    
    if (!validateProfile()) {
      setProfileStatus('error');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Profile updated:', profileData);
      showToast.success('Profile updated successfully!');
      setProfileStatus('success');
      
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error('Failed to update profile. Please try again.');
      setProfileStatus('error');
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
    if (profileErrors[field]) {
      setProfileErrors({ ...profileErrors, [field]: null });
    }
    if (profileStatus) setProfileStatus(null);
  };

  // Password handlers
  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      setPasswordStatus('error');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Password updated');
      showToast.success('Password updated successfully!');
      setPasswordStatus('success');
      
      // Reset form
      setTimeout(() => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error updating password:', error);
      showToast.error('Failed to update password. Please try again.');
      setPasswordStatus('error');
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });
    if (passwordErrors[field]) {
      setPasswordErrors({ ...passwordErrors, [field]: null });
    }
    if (passwordStatus) setPasswordStatus(null);
  };

  // Notification handlers
  const handleNotificationToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    if (notificationStatus) setNotificationStatus(null);
  };

  const handleNotificationSave = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Notification preferences saved:', notifications);
      showToast.success('Notification preferences saved!');
      setNotificationStatus('success');
      
      setTimeout(() => setNotificationStatus(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast.error('Failed to save preferences. Please try again.');
      setNotificationStatus('error');
    }
  };

  // Language handlers
  const handleLanguageSave = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Language settings saved:', languageData);
      showToast.success('Language settings saved!');
      setLanguageStatus('success');
      
      setTimeout(() => setLanguageStatus(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error('Failed to save language settings. Please try again.');
      setLanguageStatus('error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-primary-600" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </Card.Title>
          <Card.Description>Update your personal information</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          {profileStatus === 'success' && (
            <div className="mb-4 bg-success-light border-l-4 border-success-DEFAULT p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success-DEFAULT">Success!</h4>
                <p className="text-sm text-success-DEFAULT mt-1">Profile updated successfully</p>
              </div>
            </div>
          )}
          
          {profileStatus === 'error' && (
            <div className="mb-4 bg-danger-light border-l-4 border-danger-DEFAULT p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-danger-DEFAULT">Error</h4>
                <p className="text-sm text-danger-DEFAULT mt-1">Please check the form for errors</p>
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSave}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-danger-DEFAULT">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    profileErrors.name ? 'border-danger-DEFAULT' : 'border-gray-300'
                  }`}
                />
                {profileErrors.name && (
                  <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {profileErrors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-danger-DEFAULT">*</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    profileErrors.email ? 'border-danger-DEFAULT' : 'border-gray-300'
                  }`}
                />
                {profileErrors.email && (
                  <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {profileErrors.email}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={profileData.role}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button type="submit" variant="primary">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>

      {/* Password Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Change Password
          </Card.Title>
          <Card.Description>Update your password regularly for security</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          {passwordStatus === 'success' && (
            <div className="mb-4 bg-success-light border-l-4 border-success-DEFAULT p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success-DEFAULT">Success!</h4>
                <p className="text-sm text-success-DEFAULT mt-1">Password updated successfully</p>
              </div>
            </div>
          )}
          
          {passwordStatus === 'error' && (
            <div className="mb-4 bg-danger-light border-l-4 border-danger-DEFAULT p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-danger-DEFAULT">Error</h4>
                <p className="text-sm text-danger-DEFAULT mt-1">Please check the form for errors</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password <span className="text-danger-DEFAULT">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    passwordErrors.currentPassword ? 'border-danger-DEFAULT' : 'border-gray-300'
                  }`}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-danger-DEFAULT">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    passwordErrors.newPassword ? 'border-danger-DEFAULT' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password <span className="text-danger-DEFAULT">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    passwordErrors.confirmPassword ? 'border-danger-DEFAULT' : 'border-gray-300'
                  }`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <Button type="submit" variant="primary">
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </Card.Title>
          <Card.Description>Manage your notification preferences</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          {notificationStatus === 'success' && (
            <div className="mb-4 bg-success-light border-l-4 border-success-DEFAULT p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success-DEFAULT">Success!</h4>
                <p className="text-sm text-success-DEFAULT mt-1">Notification preferences saved</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Student-specific notifications */}
            {profileData.role === 'Student' && (
              <>
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Cognitive Load Alerts</p>
                    <p className="text-sm text-gray-600 mt-1">Get notified when your CL reaches high levels</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.overloadAlerts}
                      onChange={() => handleNotificationToggle('overloadAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Progress Updates</p>
                    <p className="text-sm text-gray-600 mt-1">Receive updates about your learning progress</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.dailySummary}
                      onChange={() => handleNotificationToggle('dailySummary')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Achievement Badges</p>
                    <p className="text-sm text-gray-600 mt-1">Get notified when you earn new badges</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={() => handleNotificationToggle('weeklyReport')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </>
            )}

            {/* Teacher-specific notifications */}
            {profileData.role === 'Teacher' && (
              <>
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Student Overload Alerts</p>
                    <p className="text-sm text-gray-600 mt-1">Get notified when students reach overload state</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.overloadAlerts}
                      onChange={() => handleNotificationToggle('overloadAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Daily Summary</p>
                    <p className="text-sm text-gray-600 mt-1">Receive daily class performance summary</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.dailySummary}
                      onChange={() => handleNotificationToggle('dailySummary')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Weekly Report</p>
                    <p className="text-sm text-gray-600 mt-1">Get weekly cognitive load analytics report</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={() => handleNotificationToggle('weeklyReport')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </>
            )}

            {/* Admin-specific notifications */}
            {profileData.role === 'Admin' && (
              <>
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">System Alerts</p>
                    <p className="text-sm text-gray-600 mt-1">Get notified about critical system issues</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.overloadAlerts}
                      onChange={() => handleNotificationToggle('overloadAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">User Activity Reports</p>
                    <p className="text-sm text-gray-600 mt-1">Receive daily user activity summaries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.dailySummary}
                      onChange={() => handleNotificationToggle('dailySummary')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Weekly Analytics</p>
                    <p className="text-sm text-gray-600 mt-1">Get comprehensive weekly system analytics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={() => handleNotificationToggle('weeklyReport')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6">
            <Button variant="primary" onClick={handleNotificationSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Language Settings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Language & Region
          </Card.Title>
          <Card.Description>Set your preferred language and timezone</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          {languageStatus === 'success' && (
            <div className="mb-4 bg-success-light border-l-4 border-success-DEFAULT p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success-DEFAULT">Success!</h4>
                <p className="text-sm text-success-DEFAULT mt-1">Language settings saved</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={languageData.language}
                onChange={(e) => {
                  setLanguageData({ ...languageData, language: e.target.value });
                  if (languageStatus) setLanguageStatus(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option>English</option>
                <option>Bahasa Indonesia</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={languageData.timezone}
                onChange={(e) => {
                  setLanguageData({ ...languageData, timezone: e.target.value });
                  if (languageStatus) setLanguageStatus(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option>Asia/Jakarta (GMT+7)</option>
                <option>Asia/Singapore (GMT+8)</option>
                <option>Asia/Tokyo (GMT+9)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <Button variant="primary" onClick={handleLanguageSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
