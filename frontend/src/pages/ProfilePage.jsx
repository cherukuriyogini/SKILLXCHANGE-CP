import { useState, useRef } from 'react';
import { User, Mail, Shield, Award, MapPin, Camera, Edit2, Loader2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useToast } from '../components/Toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skillsLearn: user?.skillsLearn?.join(', ') || ''
  });

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    setLoading(true);
    try {
      const res = await api.put(`/users/${user.id || user._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout for large images
      });
      
        if (res.data.success || res.status === 200) {
        const updatedUser = res.data.data || user;
        if (updatedUser._id) updatedUser.id = updatedUser._id;
        updateUser(updatedUser);
        addToast('Profile picture updated successfully!', 'success');
      }
    } catch (err) {
      console.error('[AvatarUploadError]:', err);
      // If the photo was updated but the request timed out/errored, we check if the user object changed
      addToast(err.response?.data?.message || 'Connection sluggish, but photo may have updated. Please refresh.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/users/${user.id || user._id}`, {
        name: editData.name,
        bio: editData.bio,
        skillsLearn: editData.skillsLearn.split(',').map(s => s.trim()).filter(Boolean)
      });
      
      if (res.data.success) {
        const updatedUser = res.data.data;
        updatedUser.id = updatedUser._id; // Normalize
        updateUser(updatedUser);
        setIsEditing(false);
        addToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Profile details update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 font-sans">
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-[2.5rem] shadow-sm" />
        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-xl overflow-hidden">
              <div className="w-full h-full bg-slate-100 rounded-[1.4rem] flex items-center justify-center text-slate-300 relative">
                {user?.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5008/api'}/..${user.avatar}`} className="w-full h-full object-cover" />
                ) : <User size={64} />}
                {loading && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleAvatarClick}
              disabled={loading}
              className="absolute bottom-2 right-2 p-2 bg-white rounded-xl shadow-lg text-[#2b59ff] hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Camera size={16} />
            </button>
          </div>
          <div className="mb-4">
            <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <Mail size={14} />
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-16 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Type</h3>
               <Shield size={16} className="text-[#2b59ff]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.map(role => (
                <span key={role} className="px-3 py-1 bg-blue-50 text-[#2b59ff] rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-[#2b59ff] font-bold text-xs"
                >
                  <Edit2 size={14} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-slate-400 font-bold text-xs flex items-center gap-1.5"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-[#2b59ff] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#2b59ff]"
                    />
                  ) : <p className="font-bold text-slate-800">{user?.name}</p>}
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <p className="font-bold text-slate-800 opacity-60">{user?.email}</p>
               </div>
               <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skills Interest (Comma separated)</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editData.skillsLearn}
                      onChange={(e) => setEditData({...editData, skillsLearn: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#2b59ff]"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {user?.skillsLearn?.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{skill}</span>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
