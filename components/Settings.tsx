import React, { useState } from 'react';
import { User, Integration, Role } from '../types';
import { MOCK_USERS, MOCK_INTEGRATIONS } from '../constants';
import { Save, User as UserIcon, Users, CreditCard, Layers, Power, Plus, X, Trash2, Check, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'integrations' | 'billing'>('profile');
  
  // Team State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'viewer' as Role });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Integrations State
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  // Billing State
  const [currentPlan, setCurrentPlan] = useState('Pro');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Team Logic
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      avatar: newMember.name.substring(0, 2).toUpperCase(),
    };
    setUsers([...users, newUser]);
    setShowInviteModal(false);
    setNewMember({ name: '', email: '', role: 'viewer' });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    }
  };

  const deleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  // Integration Logic
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  const addIntegration = (name: string, category: 'Cloud'|'HR'|'Dev'|'Security') => {
    const newInt: Integration = {
      id: Date.now().toString(),
      name,
      category,
      connected: true,
      lastSync: 'Just now',
      icon: 'box'
    };
    setIntegrations([...integrations, newInt]);
    setShowIntegrationModal(false);
  };

  const catalog = [
    { name: 'Azure', category: 'Cloud' },
    { name: 'Okta', category: 'Security' },
    { name: 'BambooHR', category: 'HR' },
    { name: 'GitLab', category: 'Dev' },
    { name: 'Datadog', category: 'Dev' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col md:flex-row overflow-hidden relative">
      {/* Settings Sidebar */}
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === item.id 
                ? 'bg-brand-100 text-brand-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-xl animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-2xl font-bold text-brand-700">SC</div>
                <div>
                  <button className="text-sm text-brand-600 font-medium hover:underline">Change Avatar</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" defaultValue="Sarah" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" defaultValue="Connor" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" defaultValue="sarah@complyeasy.ai" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input type="text" disabled defaultValue="Admin / CISO" className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-500" />
              </div>

              <div className="pt-4">
                <button className="flex items-center bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                  <Save size={18} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
           <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Team Management</h3>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center"
              >
                <Plus size={18} className="mr-1" /> Invite Member
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-xs font-bold">{user.avatar}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'editor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Active</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => setEditingUser(user)} className="text-brand-600 hover:text-brand-900 mr-4">Edit</button>
                        <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Integrations</h3>
                <p className="text-gray-500 text-sm">Connect your tools to automate evidence collection.</p>
              </div>
              <button 
                onClick={() => setShowIntegrationModal(true)}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center"
              >
                <Plus size={18} className="mr-1" /> Add Integration
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {integrations.map((int) => (
                <div key={int.id} className="border border-gray-200 rounded-lg p-5 flex items-start justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mr-4">
                      <Layers className="text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{int.name}</h4>
                      <p className="text-xs text-gray-500">{int.category} • {int.connected ? ` synced ${int.lastSync}` : 'Not connected'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleIntegration(int.id)}
                    className={`p-2 rounded-full transition-colors ${int.connected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Power size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="animate-fadeIn">
             <h3 className="text-xl font-bold text-gray-900 mb-6">Plan & Billing</h3>
             <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-white mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-brand-400 text-sm font-medium mb-1">CURRENT PLAN</p>
                        <h2 className="text-3xl font-bold">{currentPlan} Plan</h2>
                        <p className="text-slate-400 mt-2">$200 / month</p>
                      </div>
                      <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">Active</span>
                   </div>
                   <div className="mt-8 pt-8 border-t border-slate-700 flex space-x-4">
                      <button onClick={() => setShowUpgradeModal(true)} className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100">Upgrade Plan</button>
                      <button onClick={() => setShowPaymentModal(true)} className="text-slate-300 hover:text-white px-4 py-2 rounded-lg font-medium text-sm">Manage Payment Method</button>
                   </div>
                </div>
             </div>
             
             <h4 className="font-bold text-gray-900 mb-4">Invoice History</h4>
             <div className="border border-gray-200 rounded-lg overflow-hidden">
                {[
                  { date: 'May 1, 2024', amount: '$200.00', status: 'Paid' },
                  { date: 'Apr 1, 2024', amount: '$200.00', status: 'Paid' },
                  { date: 'Mar 1, 2024', amount: '$200.00', status: 'Paid' },
                ].map((inv, i) => (
                   <div key={i} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Invoice #{2024001 - i}</p>
                        <p className="text-xs text-gray-500">{inv.date}</p>
                      </div>
                      <div className="flex items-center">
                         <span className="text-sm font-medium mr-4">{inv.amount}</span>
                         <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{inv.status}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold">Invite Team Member</h3>
               <button onClick={() => setShowInviteModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
             </div>
             <form onSubmit={handleInvite} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                 <input required type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                 <input required type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                 <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value as Role})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                   <option value="admin">Admin</option>
                   <option value="editor">Editor</option>
                   <option value="viewer">Viewer</option>
                 </select>
               </div>
               <div className="pt-2">
                 <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">Send Invitation</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold">Edit User Role</h3>
               <button onClick={() => setEditingUser(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
             </div>
             <form onSubmit={handleEditUser} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                 <input disabled value={editingUser.name} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-500" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                 <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                   <option value="admin">Admin</option>
                   <option value="editor">Editor</option>
                   <option value="viewer">Viewer</option>
                 </select>
               </div>
               <div className="pt-2">
                 <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">Save Changes</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Add Integration Catalog Modal */}
      {showIntegrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-fadeIn">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold">Integration Catalog</h3>
               <button onClick={() => setShowIntegrationModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
             </div>
             <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 p-4 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all flex justify-between items-center group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 font-bold">{item.name[0]}</div>
                      <div>
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    {integrations.find(i => i.name === item.name) ? (
                      <span className="text-xs text-green-600 font-bold px-2 py-1 bg-green-100 rounded">Installed</span>
                    ) : (
                      <button onClick={() => addIntegration(item.name, item.category as any)} className="text-brand-600 font-bold text-sm hover:underline">Connect</button>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold">Upgrade Your Plan</h3>
               <button onClick={() => setShowUpgradeModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Basic', 'Pro', 'Enterprise'].map(plan => (
                   <div key={plan} className={`border rounded-xl p-4 flex flex-col ${currentPlan === plan ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-200'}`}>
                      <h4 className="font-bold text-lg">{plan}</h4>
                      <p className="text-gray-500 text-sm mb-4">Perfect for growing teams</p>
                      <button 
                        onClick={() => { setCurrentPlan(plan); setShowUpgradeModal(false); }}
                        className={`mt-auto py-2 rounded-lg text-sm font-bold ${currentPlan === plan ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {currentPlan === plan ? 'Current Plan' : 'Select'}
                      </button>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-bold">Manage Payment Method</h3>
               <button onClick={() => setShowPaymentModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                   <div className="flex items-center space-x-3">
                      <CreditCard className="text-gray-600" />
                      <div>
                        <p className="font-bold text-sm text-gray-800">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-500">Expires 12/28</p>
                      </div>
                   </div>
                   <span className="text-xs bg-gray-200 px-2 py-1 rounded">Default</span>
                </div>
                <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 font-bold hover:border-brand-400 hover:text-brand-600 transition-colors">
                  + Add New Card
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};