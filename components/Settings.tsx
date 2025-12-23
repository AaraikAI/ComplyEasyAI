
import React, { useState, useEffect } from 'react';
import { User, Integration, Role } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Save, User as UserIcon, Users, CreditCard, Layers, Power, Plus, X, Trash2, CheckCircle, RefreshCw, Upload } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface SettingsProps {
  onNavigateToIntegrations?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigateToIntegrations }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'integrations' | 'billing'>('profile');
  
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API call to invite new team member
      await api.team.invite(newMember.name, newMember.email, newMember.role);
      
      // Reload team members
      const teamMembers = await api.team.list();
      setUsers(teamMembers);
      
      setShowInviteModal(false);
      setNewMember({ name: '', email: '', role: 'viewer' });
    } catch (error: any) {
      console.error('Failed to invite team member:', error);
      alert(error.message || 'Failed to invite team member. Please try again.');
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

  const handlePaymentSuccess = () => {
    setCurrentPlan(selectedPlan);
    api.billing.createCheckout(selectedPlan as 'Basic' | 'Pro' | 'Enterprise');
  };

  const handleSaveProfile = () => {
    setIsSavingProfile(true);
    setTimeout(() => setIsSavingProfile(false), 1000);
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-6 px-4">Settings</h2>
        <nav className="space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'team', label: 'Team Members', icon: Users },
            { id: 'integrations', label: 'Integrations', icon: Layers },
            { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
          ].map(item => (
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
                 <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                   <Upload size={16} /> <span>Change Avatar</span>
                 </button>
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
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {u.role}
                        </span>
                        <button 
                          onClick={async () => {
                            if (confirm(`Remove ${u.name} from the team?`)) {
                              try {
                                await api.team.remove(u.id);
                                const updated = await api.team.list();
                                setUsers(updated);
                              } catch (error) {
                                console.error('Failed to remove team member:', error);
                                alert('Failed to remove team member');
                              }
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors" 
                          title="Remove User"
                        >
                          <Trash2 size={16} />
                        </button>
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
                              const providerMap: Record<string, string> = {
                                'AWS': 'aws',
                                'Google Workspace': 'google',
                                'GitHub': 'github',
                                'Slack': 'slack',
                                'Jira': 'jira',
                              };
                              const provider = providerMap[int.name] || int.id.toLowerCase();
                              
                              if (int.connected) {
                                await api.integrations.disconnect(provider);
                              } else {
                                const response: any = await api.integrations.authorize(provider);
                                if (response.authUrl) {
                                  window.open(response.authUrl, '_blank');
                                }
                              }
                              
                              // Reload integrations
                              const updated = await api.integrations.list();
                              setIntegrations(updated);
                            } catch (error) {
                              console.error('Failed to toggle integration:', error);
                              alert('Failed to toggle integration. Please try again.');
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
