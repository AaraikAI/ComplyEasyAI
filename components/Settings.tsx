
import React, { useState, useEffect } from 'react';
import { User, Integration, Role } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Save, User as UserIcon, Users, CreditCard, Layers, Power, Plus, X, Trash2, CheckCircle, RefreshCw, Upload, Lock, Loader2, Shield } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface SettingsProps {
  onNavigateToIntegrations?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigateToIntegrations }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'organization' | 'team' | 'integrations' | 'billing'>('profile');
  
  // --- Team State ---
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'viewer' as Role });

  // --- Billing State ---
  const [currentPlan, setCurrentPlan] = useState('Pro');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [selectedPrice, setSelectedPrice] = useState('Contact Us');

  // --- Profile State ---
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Integrations State ---
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);

  // --- 2FA State ---
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  // --- Password Change State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // --- Organization State ---
  const [organizationName, setOrganizationName] = useState('');
  const [organizationPlan, setOrganizationPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Basic');
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [planChangeStatus, setPlanChangeStatus] = useState<string | null>(null);

  // --- Payment Success State ---
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Check for payment success in URL
  useEffect(() => {
    // Check if there's a tab to navigate to from chatbot
    const checkTab = () => {
      const settingsTab = sessionStorage.getItem('settingsActiveTab');
      if (settingsTab && ['profile', 'security', 'organization', 'team', 'integrations', 'billing'].includes(settingsTab)) {
        setActiveTab(settingsTab as any);
        sessionStorage.removeItem('settingsActiveTab'); // Clear after use
      }
    };
    
    // Check immediately
    checkTab();
    
    // Also check after a short delay to handle navigation timing
    const timeoutId = setTimeout(checkTab, 100);
    
    // Listen for custom event from chatbot
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail?.tab;
      if (tab && ['profile', 'security', 'organization', 'team', 'integrations', 'billing'].includes(tab)) {
        setActiveTab(tab as any);
        sessionStorage.removeItem('settingsActiveTab');
      }
    };
    
    // Listen for storage events (in case navigation happens in same tab)
    const handleStorageChange = () => {
      checkTab();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsTabChange', handleTabChange as EventListener);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsTabChange', handleTabChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setShowPaymentSuccess(true);
      setActiveTab('billing');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Hide success message after 5 seconds
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    }
  }, []);

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setIsLoadingUsers(true);
        const teamMembers = await api.team.list();
        setUsers(teamMembers);
      } catch (error) {
        console.error('Failed to load team members:', error);
        // Fallback to current user if API fails
        if (currentUser) {
          setUsers([currentUser]);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (activeTab === 'team') {
      loadTeamMembers();
    }
  }, [activeTab, currentUser]);

  // Load integrations
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setIsLoadingIntegrations(true);
        const connectedIntegrations = await api.integrations.list();
        // Ensure it's always an array
        const integrationsArray = Array.isArray(connectedIntegrations) ? connectedIntegrations : [];
        setIntegrations(integrationsArray);
      } catch (error) {
        console.error('Failed to load integrations:', error);
        setIntegrations([]);
      } finally {
        setIsLoadingIntegrations(false);
      }
    };

    if (activeTab === 'integrations') {
      loadIntegrations();
    }
  }, [activeTab]);

  // Load 2FA status
  useEffect(() => {
    const load2FAStatus = async () => {
      try {
        const status = await api.twoFactor.getStatus();
        setTwoFactorEnabled(status.enabled);
        setTwoFactorVerified(status.verified);
      } catch (error) {
        console.error('Failed to load 2FA status:', error);
      }
    };

    if (activeTab === 'security') {
      load2FAStatus();
    }
  }, [activeTab]);

  // Load organization details
  useEffect(() => {
    const loadOrganization = async () => {
      if (currentUser?.role !== 'admin') return;
      try {
        const org = await api.organization.get();
        setOrganizationName(org.name || '');
        setOrganizationPlan(org.plan || 'Basic');
        setCurrentPlan(org.plan || 'Basic'); // Also update current plan for billing tab
      } catch (error) {
        console.error('Failed to load organization:', error);
      }
    };

    if (activeTab === 'organization') {
      loadOrganization();
    }
  }, [activeTab, currentUser]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      // API call to invite new team member
      await api.team.invite(newMember.name, newMember.email, newMember.role);
      
      // Reload team members
      const teamMembers = await api.team.list();
      setUsers(teamMembers);
      
      setShowInviteModal(false);
      setNewMember({ name: '', email: '', role: 'viewer' });
      alert('Invitation sent successfully!');
    } catch (error: any) {
      console.error('Failed to invite team member:', error);
      const errorMessage = error.message || 'Failed to invite team member. Please try again.';
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        alert('This email is already in use. Please use a different email.');
      } else {
        alert(errorMessage);
      }
    }
  };

  const openUpgrade = (plan: string) => {
    const priceMap: Record<string, string> = {
      'Basic': 'Contact Us',
      'Pro': 'Contact Us',
      'Enterprise': 'Contact Us'
    };
    setSelectedPlan(plan);
    setSelectedPrice(priceMap[plan] || '$0');
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    // This will be called by PaymentModal when user clicks "Continue to Secure Checkout"
    // The actual redirect happens in PaymentModal
    // After successful payment, user returns to /settings?success=true
    try {
      setPlanChangeStatus('Creating checkout session...');
      const response: any = await api.billing.createCheckout(selectedPlan as 'Basic' | 'Pro' | 'Enterprise');
      if (response.url) {
        setPlanChangeStatus(`Redirecting to checkout for ${selectedPlan} plan...`);
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      const errorMessage = error.message || 'Failed to create checkout session. Please check your Stripe configuration.';
      setPlanChangeStatus(`Error: ${errorMessage}`);
      alert(errorMessage);
    }
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!profileName || profileName.trim().length === 0) {
      alert('Name is required');
      return;
    }

    if (profileName.length > 100) {
      alert('Name is too long. Maximum 100 characters.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileEmail || !emailRegex.test(profileEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsSavingProfile(true);
    try {
      // Check for duplicate email (if changed)
      if (profileEmail !== currentUser?.email) {
        // In production, this would be checked on backend
        // For now, we'll let the backend handle it
      }

      // Update user profile via API
      const updatedUser = await api.user.updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
      });

      // Update local user data
      if (updatedUser) {
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }

      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.message || 'Failed to update profile';
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        alert('This email is already in use. Please use a different email.');
      } else {
        alert(`Failed to update profile: ${errorMessage}`);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-6 px-4">Settings</h2>
        <nav className="space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'organization', label: 'Organization', icon: Layers, adminOnly: true },
            { id: 'team', label: 'Team Members', icon: Users },
            { id: 'integrations', label: 'Integrations', icon: Layers },
            { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
          ].filter(item => !item.adminOnly || currentUser?.role === 'admin').map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === item.id ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-white h-[80vh] md:h-auto">
        
        {/* Payment Success Message */}
        {showPaymentSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-3" size={20} />
              <div>
                <p className="font-medium text-green-800">Payment Successful!</p>
                <p className="text-sm text-green-700">Your subscription has been activated. A confirmation email has been sent.</p>
              </div>
            </div>
            <button onClick={() => setShowPaymentSuccess(false)} className="text-green-600 hover:text-green-800">
              <X size={18} />
            </button>
          </div>
        )}

        {/* --- Billing Tab --- */}
        {activeTab === 'billing' && (
          <div className="animate-fadeIn space-y-6">
             <h3 className="text-xl font-bold text-gray-900">Plan & Billing</h3>
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-white mb-8 relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-brand-400 text-sm font-medium mb-1 uppercase tracking-wider">Current Subscription</p>
                        <h2 className="text-4xl font-bold mb-2">{currentPlan} Plan</h2>
                        <p className="text-slate-400 text-lg">
                          {currentPlan === 'Basic' ? 'Contact Us' : currentPlan === 'Pro' ? 'Contact Us' : 'Contact Us'} / month
                        </p>
                      </div>
                      <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-sm">
                        <CheckCircle size={12} className="mr-1"/> Active
                      </span>
                   </div>
                </div>
                {/* Decor */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
             </div>
             
             <h4 className="font-bold text-gray-900 mb-4 text-lg">Available Plans</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { name: 'Basic', price: 'Contact Us', features: ['5 Frameworks', 'Email Support'] }, 
                 { name: 'Pro', price: 'Contact Us', features: ['50+ Integrations', 'Predictive AI', 'Priority Support'] }, 
                 { name: 'Enterprise', price: 'Contact Us', features: ['Unlimited', 'Dedicated Agent', 'SLA'] }
               ].map(plan => (
                 <div key={plan.name} className={`border rounded-xl p-5 flex flex-col transition-all hover:shadow-md ${currentPlan === plan.name ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-lg">{plan.name}</h4>
                       {currentPlan === plan.name && <CheckCircle className="text-brand-600" size={20}/>}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-4">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    <ul className="mb-6 space-y-2 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div> {f}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => openUpgrade(plan.name)}
                      disabled={currentPlan === plan.name}
                      className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${currentPlan === plan.name ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'}`}
                    >
                      {currentPlan === plan.name ? 'Current Plan' : 'Upgrade'}
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}
        
        {/* --- Profile Tab --- */}
        {activeTab === 'profile' && (
          <div className="animate-fadeIn space-y-6 max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900">My Profile</h3>
            
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-3xl font-bold border-4 border-white shadow-md">
                {profileName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                 <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                   <Upload size={16} /> <span>Change Avatar</span>
                   <input
                     type="file"
                     accept="image/jpeg,image/jpg,image/png,image/gif"
                     className="hidden"
                     onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         if (file.size > 1024 * 1024) {
                           alert('File size must be less than 1MB');
                           return;
                         }
                         try {
                           const result = await api.auth.uploadAvatar(file);
                           // Update local state to show new avatar
                           if (result.user) {
                             // Reload user data
                             window.location.reload(); // Simple refresh to update avatar
                           }
                         } catch (error: any) {
                           console.error('Avatar upload error:', error);
                           alert(error.message || 'Failed to upload avatar');
                         }
                       }
                     }}
                   />
                 </label>
                 <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max 1MB.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input 
                    type="text" 
                    value="Administrator"
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
               <button 
                 onClick={handleSaveProfile}
                 className="flex items-center space-x-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
               >
                 {isSavingProfile ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                 <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
               </button>
            </div>
          </div>
        )}

        {/* --- Security Tab (2FA) --- */}
        {activeTab === 'security' && (
          <div className="animate-fadeIn space-y-6 max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 flex items-center">
                    <Shield className="mr-2 text-brand-600" size={20} />
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {twoFactorEnabled ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                      <CheckCircle size={14} className="mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              {!twoFactorEnabled && !show2FASetup && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Two-factor authentication (2FA) adds an extra layer of security by requiring a verification code from your authenticator app in addition to your password.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        setIsLoading2FA(true);
                        const response = await api.twoFactor.setup();
                        // API returns { data: { qrCode, backupCodes, secret } } or { qrCode, backupCodes }
                        const qrCodeUrl = response.data?.qrCode || response.qrCode || response.data?.qrCodeUrl;
                        const codes = response.data?.backupCodes || response.backupCodes || [];
                        if (!qrCodeUrl) {
                          throw new Error('QR code not received from server');
                        }
                        setQrCode(qrCodeUrl);
                        setBackupCodes(codes);
                        setShow2FASetup(true);
                      } catch (error: any) {
                        console.error('Failed to setup 2FA:', error);
                        alert(`Failed to setup 2FA: ${error.message || 'Unknown error'}`);
                      } finally {
                        setIsLoading2FA(false);
                      }
                    }}
                    disabled={isLoading2FA}
                    className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center disabled:opacity-50"
                  >
                    {isLoading2FA ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2" size={18} />
                        Enable Two-Factor Authentication
                      </>
                    )}
                  </button>
                </div>
              )}

              {show2FASetup && !twoFactorEnabled && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">Setup Instructions:</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)</li>
                      <li>Enter the 6-digit code from your app to verify and enable 2FA</li>
                      <li>Save your backup codes in a secure location</li>
                    </ol>
                  </div>

                  {qrCode && (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                      
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter verification code from your app:
                        </label>
                        <input
                          type="text"
                          value={verificationToken}
                          onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-center text-2xl tracking-widest"
                        />
                      </div>

                      <div className="flex space-x-2 w-full">
                        <button
                          onClick={async () => {
                            if (verificationToken.length !== 6) {
                              alert('Please enter a 6-digit code');
                              return;
                            }
                            try {
                              setIsLoading2FA(true);
                              await api.twoFactor.verifyAndEnable(verificationToken);
                              setTwoFactorEnabled(true);
                              setTwoFactorVerified(true);
                              setShow2FASetup(false);
                              setVerificationToken('');
                              alert('Two-factor authentication enabled successfully!');
                            } catch (error: any) {
                              console.error('Failed to enable 2FA:', error);
                              alert(`Failed to enable 2FA: ${error.message || 'Invalid code. Please try again.'}`);
                            } finally {
                              setIsLoading2FA(false);
                            }
                          }}
                          disabled={isLoading2FA || verificationToken.length !== 6}
                          className="flex-1 bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                          {isLoading2FA ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                        <button
                          onClick={() => {
                            setShow2FASetup(false);
                            setQrCode(null);
                            setVerificationToken('');
                            setBackupCodes([]);
                          }}
                          className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>

                      {backupCodes.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                          <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Save these backup codes:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code, idx) => (
                              <code key={idx} className="text-xs bg-white px-2 py-1 rounded border border-yellow-300 font-mono">
                                {code}
                              </code>
                            ))}
                          </div>
                          <p className="text-xs text-yellow-700 mt-2">
                            Store these codes securely. You can use them to access your account if you lose your authenticator device.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {twoFactorEnabled && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✓ Two-factor authentication is enabled. Your account is protected with an additional security layer.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
                          return;
                        }
                        try {
                          setIsLoading2FA(true);
                          await api.twoFactor.disable();
                          setTwoFactorEnabled(false);
                          setTwoFactorVerified(false);
                          alert('Two-factor authentication has been disabled.');
                        } catch (error: any) {
                          console.error('Failed to disable 2FA:', error);
                          alert(`Failed to disable 2FA: ${error.message || 'Unknown error'}`);
                        } finally {
                          setIsLoading2FA(false);
                        }
                      }}
                      disabled={isLoading2FA}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading2FA ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setIsLoading2FA(true);
                          const result = await api.twoFactor.regenerateCodes();
                          setBackupCodes(result.backupCodes || result.data?.backupCodes || []);
                          alert('New backup codes generated. Please save them securely.');
                        } catch (error: any) {
                          console.error('Failed to regenerate codes:', error);
                          alert(`Failed to regenerate codes: ${error.message || 'Unknown error'}`);
                        } finally {
                          setIsLoading2FA(false);
                        }
                      }}
                      disabled={isLoading2FA}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {isLoading2FA ? 'Generating...' : 'Regenerate Backup Codes'}
                    </button>
                  </div>
                </div>
              )}

              {/* Password Change Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6">
                <h4 className="font-bold text-gray-900 flex items-center mb-4">
                  <Lock className="mr-2 text-brand-600" size={20} />
                  Change Password
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{passwordError}</p>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        setPasswordError('All fields are required');
                        return;
                      }

                      if (newPassword.length < 8) {
                        setPasswordError('New password must be at least 8 characters');
                        return;
                      }

                      if (newPassword !== confirmPassword) {
                        setPasswordError('New passwords do not match');
                        return;
                      }

                      setIsChangingPassword(true);
                      setPasswordError(null);

                      try {
                        await api.user.changePassword(currentPassword, newPassword);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        alert('Password changed successfully!');
                      } catch (error: any) {
                        const errorMessage = error.message || 'Failed to change password';
                        if (errorMessage.includes('incorrect') || errorMessage.includes('current')) {
                          setPasswordError('Current password is incorrect');
                        } else {
                          setPasswordError(errorMessage);
                        }
                      } finally {
                        setIsChangingPassword(false);
                      }
                    }}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="animate-spin inline mr-2" size={18} />
                        Changing Password...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Organization Tab --- */}
        {activeTab === 'organization' && currentUser?.role === 'admin' && (
          <div className="animate-fadeIn space-y-6 max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900">Organization Settings</h3>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Plan</label>
                  <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                    {currentPlan}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upgrade Plan</label>
                  <select
                    value={organizationPlan}
                    onChange={(e) => setOrganizationPlan(e.target.value as 'Basic' | 'Pro' | 'Enterprise')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                  {organizationPlan !== currentPlan && (
                    <p className="text-xs text-gray-500 mt-1">
                      {organizationPlan === 'Enterprise' ? 'Upgrading to Enterprise plan' : 
                       organizationPlan === 'Pro' && currentPlan === 'Basic' ? 'Upgrading to Pro plan' :
                       'Changing plan'}
                    </p>
                  )}
                </div>
                {planChangeStatus && (
                  <div className={`p-3 rounded-lg ${planChangeStatus.includes('success') || planChangeStatus.includes('Redirecting') ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm ${planChangeStatus.includes('success') || planChangeStatus.includes('Redirecting') ? 'text-green-800' : 'text-yellow-800'}`}>
                      {planChangeStatus}
                    </p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      // Only update name if plan hasn't changed
                      if (organizationPlan === currentPlan) {
                        setIsSavingOrganization(true);
                        setPlanChangeStatus(null);
                        try {
                          await api.organization.update({
                            name: organizationName,
                          });
                          setPlanChangeStatus('Organization name updated successfully!');
                          setTimeout(() => setPlanChangeStatus(null), 5000);
                        } catch (error: any) {
                          setPlanChangeStatus(`Failed to update: ${error.message || 'Unknown error'}`);
                        } finally {
                          setIsSavingOrganization(false);
                        }
                      } else {
                        // Plan changed - route to checkout
                        setPlanChangeStatus('Redirecting to secure checkout...');
                        setSelectedPlan(organizationPlan);
                        setSelectedPrice('Contact Us');
                        setShowPaymentModal(true);
                      }
                    }}
                    disabled={isSavingOrganization}
                    className="flex-1 bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSavingOrganization ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Saving...
                      </>
                    ) : organizationPlan !== currentPlan ? (
                      <>
                        <CreditCard size={18} className="mr-2" />
                        Upgrade to {organizationPlan}
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organization' && currentUser?.role !== 'admin' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <p className="text-yellow-800">You do not have permission to access organization settings. Admin access required.</p>
            </div>
          </div>
        )}

        {/* --- Team Tab --- */}
        {activeTab === 'team' && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Team Members</h3>
                <p className="text-sm text-gray-500">Manage access and roles for your organization.</p>
              </div>
              <button onClick={() => setShowInviteModal(true)} className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 shadow-sm transition-colors">
                <Plus size={16} /> <span>Invite Member</span>
              </button>
            </div>
            
            {isLoadingUsers ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
                <RefreshCw className="animate-spin text-brand-600 mr-3" size={24} />
                <span className="text-gray-600">Loading team members...</span>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No team members found.</p>
                  </div>
                ) : (
                  users.map((u, idx) => (
                    <div key={u.id} className={`p-4 flex justify-between items-center ${idx !== users.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                          {u.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {currentUser?.role === 'admin' ? (
                          (() => {
                            // Count admins
                            const adminCount = users.filter(user => user.role === 'admin').length;
                            const isOnlyAdmin = u.role === 'admin' && adminCount === 1;
                            
                            return (
                              <select
                                value={u.role}
                                onChange={async (e) => {
                                  const newRole = e.target.value as Role;
                                  
                                  // Prevent changing role if only admin
                                  if (isOnlyAdmin && newRole !== 'admin') {
                                    alert('Cannot change role: This is the only admin user. Please assign another admin before changing this role.');
                                    return;
                                  }
                                  
                                  try {
                                    await api.team.updateRole(u.id, newRole);
                                    const updated = await api.team.list();
                                    setUsers(updated);
                                    alert(`Role updated to ${newRole} successfully!`);
                                  } catch (error: any) {
                                    console.error('Failed to update role:', error);
                                    const errorMsg = error.message || 'Unknown error';
                                    if (errorMsg.includes('only admin') || errorMsg.includes('last admin')) {
                                      alert('Cannot change role: This is the only admin user. Please assign another admin before changing this role.');
                                    } else {
                                      alert(`Failed to update role: ${errorMsg}`);
                                    }
                                  }
                                }}
                                disabled={isOnlyAdmin}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none ${isOnlyAdmin ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                title={isOnlyAdmin ? 'Cannot change role: This is the only admin user' : ''}
                              >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            );
                          })()
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {u.role}
                          </span>
                        )}
                        {currentUser?.role === 'admin' && u.id !== currentUser?.id && (
                          <button 
                            onClick={async () => {
                              if (confirm(`Remove ${u.name} from the team?`)) {
                                try {
                                await api.team.remove(u.id);
                                const updated = await api.team.list();
                                setUsers(updated);
                                alert('Team member removed successfully');
                                  alert('Team member removed successfully');
                                } catch (error: any) {
                                  console.error('Failed to remove team member:', error);
                                  alert(`Failed to remove team member: ${error.message || 'Unknown error'}`);
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors" 
                            title="Remove User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Integrations Tab --- */}
        {activeTab === 'integrations' && (
           <div className="animate-fadeIn space-y-6">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="font-bold text-xl text-gray-900">Active Integrations</h3>
                   <p className="text-sm text-gray-500">Connect your stack to automate compliance collection.</p>
                 </div>
                 <button 
                   onClick={() => onNavigateToIntegrations?.()}
                   className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 shadow-sm font-medium transition-colors"
                 >
                    View Catalog
                 </button>
              </div>

              {isLoadingIntegrations ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-brand-600 mr-3" size={24} />
                  <span className="text-gray-600">Loading integrations...</span>
                </div>
              ) : integrations.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-gray-500 mb-4">No integrations connected yet.</p>
                  <button
                    onClick={() => onNavigateToIntegrations?.()}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {integrations.map(int => (
                    <div key={int.id} className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-white hover:border-brand-200 transition-colors shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 border border-gray-100">
                          {/* Basic Icon Logic */}
                          {int.name === 'AWS' && <div className="font-bold text-orange-500">AWS</div>}
                          {int.name === 'GitHub' && <div className="font-bold text-slate-800">GH</div>}
                          {int.name === 'Google Workspace' && <div className="font-bold text-blue-500">GW</div>}
                          {int.name === 'Slack' && <div className="font-bold text-purple-500">SL</div>}
                          {int.name === 'Jira' && <div className="font-bold text-blue-600">JR</div>}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{int.name}</h4>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-500">{int.category}</span>
                            <span className="text-gray-300">•</span>
                            <span className={`flex items-center ${int.connected ? 'text-green-600' : 'text-gray-400'}`}>
                              {int.connected ? <CheckCircle size={12} className="mr-1"/> : <Power size={12} className="mr-1"/>}
                              {int.connected ? `Synced ${int.lastSync}` : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={int.connected} 
                          onChange={async () => {
                            try {
                              // Map integration name to provider ID
                              const providerMap: Record<string, string> = {
                                'AWS': 'aws',
                                'Microsoft Azure': 'azure',
                                'Google Cloud Platform': 'gcp',
                                'Google Workspace': 'google',
                                'GitHub': 'github',
                                'GitLab': 'gitlab',
                                'Bitbucket': 'bitbucket',
                                'Slack': 'slack',
                                'Jira': 'jira',
                                'Confluence': 'confluence',
                                'Trello': 'trello',
                                'Asana': 'asana',
                                'Monday.com': 'monday',
                                'Microsoft Teams': 'microsoft-teams',
                                'Discord': 'discord',
                                'Okta': 'okta',
                                'Auth0': 'auth0',
                                'OneLogin': 'onelogin',
                                'BambooHR': 'bamboohr',
                                'Workday': 'workday',
                                'ADP': 'adp',
                                'Splunk': 'splunk',
                                'Datadog': 'datadog',
                                'New Relic': 'newrelic',
                                'Sentry': 'sentry',
                                'PagerDuty': 'pagerduty',
                                'Qualys': 'qualys',
                                'Tenable': 'tenable',
                                'CrowdStrike': 'crowdstrike',
                                'Palo Alto': 'paloalto',
                                'MongoDB Atlas': 'mongodb',
                                'PostgreSQL': 'postgresql',
                                'MySQL': 'mysql',
                                'Redis': 'redis',
                                'Elasticsearch': 'elasticsearch',
                                'Salesforce': 'salesforce',
                                'HubSpot': 'hubspot',
                                'Zendesk': 'zendesk',
                                'Stripe': 'stripe',
                                'PayPal': 'paypal',
                                'Twilio': 'twilio',
                                'SendGrid': 'sendgrid',
                                'Heroku': 'heroku',
                                'DigitalOcean': 'digitalocean',
                                'Jenkins': 'jenkins',
                                'CircleCI': 'circleci',
                                'Travis CI': 'travis',
                                'Docker Hub': 'docker',
                                'Kubernetes': 'kubernetes',
                              };
                              
                              // Get provider from map or use integration ID
                              const provider = providerMap[int.name] || int.id.toLowerCase().replace(/\s+/g, '-');
                              
                              if (int.connected) {
                                await api.integrations.disconnect(provider);
                                // Reload integrations after disconnect
                                const updated = await api.integrations.list();
                                setIntegrations(Array.isArray(updated) ? updated : []);
                              } else {
                                // For connecting, use the IntegrationModal instead
                                alert('Please use the "View Catalog" button to connect new integrations.');
                              }
                            } catch (error: any) {
                              console.error('Failed to toggle integration:', error);
                              alert(`Failed to toggle integration: ${error.message || 'Unknown error'}`);
                            }
                          }} 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
           </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal 
          plan={selectedPlan} 
          price={selectedPrice} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      
      {showInviteModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-xl animate-scaleIn">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Invite Member</h3>
                <button onClick={() => setShowInviteModal(false)}><X className="text-gray-400 hover:text-gray-600" size={20}/></button>
             </div>
             <form onSubmit={handleInvite} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                  <input required placeholder="John Doe" value={newMember.name} onChange={e=>setNewMember({...newMember, name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"/>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input required type="email" placeholder="john@company.com" value={newMember.email} onChange={e=>setNewMember({...newMember, email: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"/>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select value={newMember.role} onChange={e=>setNewMember({...newMember, role: e.target.value as Role})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                     <option value="admin">Admin</option>
                     <option value="editor">Editor</option>
                     <option value="viewer">Viewer</option>
                  </select>
               </div>
               <button className="w-full bg-brand-600 text-white p-3 rounded-lg font-bold hover:bg-brand-700 transition-colors">Send Invitation</button>
             </form>
           </div>
         </div>
      )}
    </div>
  );
};
