import { useState } from 'react';
import { Bell, Lock, Globe, Shield, Moon, Eye, Smartphone, Loader2, Key, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const toggleSetting = async (field) => {
    const currentVal = user?.settings?.[field] || false;
    try {
      const res = await api.put('/users/settings', { [field]: !currentVal });
      if (res.data.success) {
        setUser({ ...user, settings: { ...user.settings, [field]: !currentVal } });
        addToast(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update setting', 'error');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return addToast('Passwords do not match', 'error');
    }

    setLoading(true);
    try {
      const res = await api.put('/users/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        addToast('Password updated successfully', 'success');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Manage your account preferences and system configuration</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Shield size={14} /> Security & Access
            </h2>
            
            <div className="space-y-6">
              {[
                { icon: Lock, title: 'Change Password', desc: 'Update your login credentials', action: 'Update', onClick: () => setShowPasswordModal(true) },
                { 
                  icon: Smartphone, 
                  title: 'Two-Factor Authentication', 
                  desc: 'Add an extra layer of security', 
                  action: user?.settings?.twoFactorEnabled ? 'Disable' : 'Enable',
                  onClick: () => toggleSetting('twoFactorEnabled')
                },
                { icon: Globe, title: 'Global Privacy', desc: 'Control who sees your profile', action: 'Manage' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2b59ff] transition-colors">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={item.onClick}
                    className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Bell size={14} /> Notifications
            </h2>
            
            <div className="space-y-6">
              {[
                { title: 'Email Notifications', desc: 'Receive updates via email', field: 'emailNotifications' },
                { title: 'Browser Push Notifications', desc: 'Real-time alerts in your browser', field: 'pushNotifications' },
                { title: 'Marketing Emails', desc: 'News about updates and offers', field: 'marketingEmails' }
              ].map((item, idx) => {
                const isChecked = user?.settings?.[item.field] || false;
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                    </div>
                    <div 
                      onClick={() => toggleSetting(item.field)}
                      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${isChecked ? 'bg-[#2b59ff]' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isChecked ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-50 text-[#2b59ff] rounded-2xl flex items-center justify-center">
                <Key size={24} />
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Update Password</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Ensure your account is using a strong password</p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                <input 
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#2b59ff] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#2b59ff] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#2b59ff] transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#2b59ff] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Update Security Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
