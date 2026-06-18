'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { initials } from '../../lib/api';
import api from '../../lib/api';
import { User, Lock, Bell, Shield, CreditCard, LogOut, Camera, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const SECTIONS = [
  { key: 'profile',  label: 'Profile',       icon: User },
  { key: 'password', label: 'Password',      icon: Lock },
  { key: 'notifs',   label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security',      icon: Shield },
  { key: 'billing',  label: 'Billing',       icon: CreditCard },
];

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg ${
      type === 'error' ? 'bg-kixora-red text-white' : 'bg-kixora-green text-white'
    }`}>
      {msg}
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  // Profile form
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    instagram: user?.instagram || '',
  });

  // Password form
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    offerAlerts: true,
    messages: true,
    drops: true,
    community: false,
    marketing: false,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const profileMutation = useMutation({
    mutationFn: (data) => api.patch('/users/profile', data),
    onSuccess: () => showToast('Profile updated!'),
    onError: () => showToast('Failed to update profile', 'error'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.patch('/users/password', data),
    onSuccess: () => { showToast('Password changed!'); setPasswords({ current: '', new: '', confirm: '' }); },
    onError: () => showToast('Failed to change password', 'error'),
  });

  const handlePasswordSubmit = () => {
    if (passwords.new !== passwords.confirm) return showToast('Passwords do not match', 'error');
    if (passwords.new.length < 8) return showToast('Password must be at least 8 characters', 'error');
    passwordMutation.mutate({ currentPassword: passwords.current, newPassword: passwords.new });
  };

  const PasswordInput = ({ field, placeholder }) => (
    <div className="relative">
      <input
        type={showPass[field] ? 'text' : 'password'}
        placeholder={placeholder}
        className="input-dark pr-10"
        value={passwords[field]}
        onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
      />
      <button onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-kixora-gray hover:text-kixora-white">
        {showPass[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">SETTINGS</h2>
          <p className="text-kixora-gray mb-6">Sign in to manage your account settings.</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />
      <Toast msg={toast.msg} type={toast.type} />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="section-label">Account</p>
          <h1 className="section-title">SETTINGS</h1>
        </div>

        <div className="flex gap-8">
          {/* Sidebar nav */}
          <aside className="w-52 flex-shrink-0">
            {/* Avatar */}
            <div className="card-dark p-5 mb-4 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-kixora-amber bg-opacity-20 border-2 border-kixora-amber border-opacity-30 flex items-center justify-center text-xl font-bold text-kixora-amber overflow-hidden">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : initials(user.displayName || user.username)}
                </div>
                <button className="absolute bottom-0 right-0 w-6 h-6 bg-kixora-amber text-kixora-black rounded-full flex items-center justify-center">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-semibold text-kixora-white">{user.displayName || user.username}</p>
              <p className="text-xs text-kixora-gray">@{user.username}</p>
            </div>

            {/* Nav */}
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeSection === s.key
                      ? 'bg-kixora-amber text-kixora-black'
                      : 'text-kixora-gray hover:text-kixora-white hover:bg-kixora-surface'
                  }`}>
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-kixora-red hover:bg-kixora-red hover:bg-opacity-10 transition-all mt-4">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Profile */}
            {activeSection === 'profile' && (
              <div className="card-dark p-6">
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-6">PROFILE INFO</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Display Name</label>
                      <input className="input-dark" value={profile.displayName}
                        onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Username</label>
                      <input className="input-dark" value={profile.username}
                        onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Bio</label>
                    <textarea className="input-dark resize-none" rows={3} placeholder="Tell the community about yourself..."
                      value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Location</label>
                      <input className="input-dark" placeholder="Bangkok, TH" value={profile.location}
                        onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Instagram</label>
                      <input className="input-dark" placeholder="@handle" value={profile.instagram}
                        onChange={e => setProfile(p => ({ ...p, instagram: e.target.value }))} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Email</label>
                    <input className="input-dark opacity-60 cursor-not-allowed" value={user.email} readOnly />
                    <p className="text-xs text-kixora-gray mt-1">Contact support to change your email.</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => profileMutation.mutate(profile)} disabled={profileMutation.isPending}
                      className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            {activeSection === 'password' && (
              <div className="card-dark p-6">
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-6">CHANGE PASSWORD</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Current Password</label>
                    <PasswordInput field="current" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">New Password</label>
                    <PasswordInput field="new" placeholder="At least 8 characters" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2 block">Confirm New Password</label>
                    <PasswordInput field="confirm" placeholder="Repeat new password" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handlePasswordSubmit} disabled={passwordMutation.isPending}
                      className="btn-primary flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifs' && (
              <div className="card-dark p-6">
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-6">NOTIFICATIONS</h2>
                <div className="space-y-4">
                  {[
                    { key: 'orderUpdates', label: 'Order Updates', desc: 'Shipping, delivery, and auth confirmations' },
                    { key: 'offerAlerts', label: 'Offer Alerts', desc: 'New offers and counter-offers on your listings' },
                    { key: 'messages', label: 'Messages', desc: 'New messages from buyers and sellers' },
                    { key: 'drops', label: 'Drop Reminders', desc: 'Notifications for upcoming drops you follow' },
                    { key: 'community', label: 'Community Activity', desc: 'Replies and likes on your posts' },
                    { key: 'marketing', label: 'KIXORA Updates', desc: 'News, features, and promotions from us' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-kixora-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-kixora-white">{item.label}</p>
                        <p className="text-xs text-kixora-gray">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                        className={`relative w-11 h-6 rounded-full transition-all ${notifPrefs[item.key] ? 'bg-kixora-amber' : 'bg-kixora-border'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifPrefs[item.key] ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <button className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="card-dark p-6">
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-6">SECURITY</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', badge: '2FA OFF', badgeColor: 'text-kixora-red' },
                    { label: 'Active Sessions', desc: 'Manage devices currently logged into your account', badge: '1 active', badgeColor: 'text-kixora-green' },
                    { label: 'Login History', desc: 'View recent login activity', badge: 'View →', badgeColor: 'text-kixora-amber' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-kixora-surface2 border border-kixora-border rounded-xl hover:border-kixora-amber hover:border-opacity-30 transition-all cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-kixora-white">{item.label}</p>
                        <p className="text-xs text-kixora-gray">{item.desc}</p>
                      </div>
                      <span className={`text-xs font-bold ${item.badgeColor}`}>{item.badge}</span>
                    </div>
                  ))}
                  <div className="mt-6 p-4 border border-kixora-red border-opacity-30 bg-kixora-red bg-opacity-5 rounded-xl">
                    <p className="text-sm font-semibold text-kixora-red mb-1">Danger Zone</p>
                    <p className="text-xs text-kixora-gray mb-3">Permanently delete your account and all associated data.</p>
                    <button className="text-xs text-kixora-red border border-kixora-red border-opacity-40 px-4 py-2 rounded-xl hover:bg-kixora-red hover:bg-opacity-10 transition-all font-bold">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing */}
            {activeSection === 'billing' && (
              <div className="card-dark p-6">
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-6">BILLING</h2>
                <div className="text-center py-12 border border-dashed border-kixora-border rounded-xl">
                  <CreditCard className="w-12 h-12 text-kixora-gray mx-auto mb-3" />
                  <p className="text-kixora-white font-semibold mb-2">No payment method saved</p>
                  <p className="text-kixora-gray text-sm mb-5">Add a payment method to buy and sell on KIXORA</p>
                  <button className="btn-primary flex items-center gap-2 mx-auto">
                    <CreditCard className="w-4 h-4" /> Add Payment Method
                  </button>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-3">Payout Account</p>
                  <div className="p-4 bg-kixora-surface2 border border-kixora-border rounded-xl text-center">
                    <p className="text-sm text-kixora-gray">Connect a bank account to receive seller payouts</p>
                    <button className="btn-secondary text-sm mt-3">Connect Bank Account</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
