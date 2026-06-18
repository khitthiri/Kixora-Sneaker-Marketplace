'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { formatPrice, timeAgo } from '../../lib/api';
import api from '../../lib/api';
import {
  Users, Package, DollarSign, ShieldCheck, AlertTriangle,
  CheckCircle, XCircle, Eye, Search, Filter, Lock
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ icon, label, value, sub, trend }) {
  return (
    <div className="card-dark p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-kixora-green' : 'text-kixora-red'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-kixora-white mb-0.5">{value}</p>
      <p className="text-xs text-kixora-gray uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs text-kixora-amber mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params: { search } });
      return data.data;
    },
    enabled: !!user && user.role === 'ADMIN' && activeTab === 'users',
  });

  const { data: listingsData } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/listings', { params: { status: 'PENDING_REVIEW' } });
      return data.data;
    },
    enabled: !!user && user.role === 'ADMIN' && activeTab === 'listings',
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get('/admin/orders');
      return data.data;
    },
    enabled: !!user && user.role === 'ADMIN' && activeTab === 'orders',
  });

  const banUserMutation = useMutation({
    mutationFn: ({ id, ban }) => api.patch(`/admin/users/${id}/${ban ? 'ban' : 'unban'}`),
    onSuccess: () => qc.invalidateQueries(['admin-users']),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }) => api.patch(`/admin/listings/${id}/${approved ? 'approve' : 'reject'}`),
    onSuccess: () => qc.invalidateQueries(['admin-listings']),
  });

  const stats = statsData?.stats || {};
  const users = usersData?.users || [];
  const listings = listingsData?.listings || [];
  const orders = ordersData?.orders || [];

  const chartData = stats.revenueChart || Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    revenue: Math.floor(Math.random() * 20000) + 5000,
    orders: Math.floor(Math.random() * 50) + 10,
  }));

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: `Users (${stats.totalUsers || 0})` },
    { key: 'listings', label: 'Listings Review' },
    { key: 'orders', label: 'Orders' },
  ];

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">ADMIN PANEL</h2>
          <p className="text-kixora-gray mb-6">You need admin access to view this page.</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
        <Footer />
      </main>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <ShieldCheck className="w-12 h-12 text-kixora-red mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">ACCESS DENIED</h2>
          <p className="text-kixora-gray mb-6">Admin access required.</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label">Control Panel</p>
            <h1 className="section-title">ADMIN</h1>
          </div>
          <div className="flex items-center gap-2 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-30 rounded-xl px-4 py-2">
            <ShieldCheck className="w-4 h-4 text-kixora-amber" />
            <span className="text-xs font-bold text-kixora-amber">Admin Access</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users className="w-5 h-5 text-kixora-amber" />} label="Total Users" value={stats.totalUsers?.toLocaleString() || '0'} trend={12} />
          <StatCard icon={<Package className="w-5 h-5 text-kixora-amber" />} label="Active Listings" value={stats.activeListings?.toLocaleString() || '0'} trend={8} />
          <StatCard icon={<DollarSign className="w-5 h-5 text-kixora-amber" />} label="Revenue (30d)" value={formatPrice(stats.revenue30d || 0)} trend={15} />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-kixora-amber" />} label="Pending Review" value={stats.pendingListings || 0} sub="Needs attention" />
        </div>

        {/* Revenue chart */}
        {activeTab === 'overview' && (
          <div className="card-dark p-5 mb-8">
            <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-4">Weekly Revenue</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2B" />
                  <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1E1E1B', border: '1px solid #2E2E2B', borderRadius: 12 }}
                    labelStyle={{ color: '#F5F4F0' }}
                    itemStyle={{ color: '#F5A623' }}
                    formatter={v => [formatPrice(v), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-kixora-surface border border-kixora-border rounded-xl p-1 w-fit mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kixora-gray" />
              <input type="text" placeholder="Search users..." className="input-dark pl-9"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="space-y-3">
              {usersLoading ? (
                [...Array(5)].map((_, i) => <div key={i} className="card-dark h-16 skeleton" />)
              ) : users.map(u => (
                <div key={u.id} className="card-dark flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-kixora-amber bg-opacity-20 flex items-center justify-center text-sm font-bold text-kixora-amber">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kixora-white">@{u.username}</p>
                    <p className="text-xs text-kixora-gray">{u.email} · Joined {timeAgo(u.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      u.role === 'ADMIN' ? 'bg-kixora-amber bg-opacity-20 text-kixora-amber' : 'bg-kixora-surface2 text-kixora-gray'
                    }`}>{u.role}</span>
                    <button onClick={() => banUserMutation.mutate({ id: u.id, ban: !u.isBanned })}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all ${
                        u.isBanned
                          ? 'border-kixora-green text-kixora-green hover:bg-kixora-green hover:bg-opacity-10'
                          : 'border-kixora-red text-kixora-red hover:bg-kixora-red hover:bg-opacity-10'
                      }`}>
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings review tab */}
        {activeTab === 'listings' && (
          <div className="space-y-3">
            {listings.length === 0 ? (
              <div className="text-center py-16 border border-kixora-border rounded-2xl">
                <CheckCircle className="w-12 h-12 text-kixora-green mx-auto mb-3" />
                <p className="text-kixora-white font-semibold">All caught up!</p>
                <p className="text-kixora-gray text-sm">No listings pending review</p>
              </div>
            ) : listings.map(l => (
              <div key={l.id} className="card-dark flex items-center gap-4 p-4">
                <div className="w-14 h-14 bg-kixora-surface2 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">👟</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kixora-white truncate">{l.title || l.product?.name}</p>
                  <p className="text-xs text-kixora-gray">@{l.seller?.username} · {formatPrice(l.price)} · {timeAgo(l.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/product/${l.id}`} className="btn-ghost text-xs py-2 px-3 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <button onClick={() => approveMutation.mutate({ id: l.id, approved: true })}
                    className="px-3 py-2 bg-kixora-green bg-opacity-20 border border-kixora-green border-opacity-40 text-kixora-green text-xs font-bold rounded-xl hover:bg-opacity-30 transition-all flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => approveMutation.mutate({ id: l.id, approved: false })}
                    className="px-3 py-2 bg-kixora-red bg-opacity-10 border border-kixora-red border-opacity-30 text-kixora-red text-xs font-bold rounded-xl hover:bg-opacity-20 transition-all flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="card-dark flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kixora-white">#{o.id?.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-kixora-gray">
                    {o.buyer?.username} → {o.seller?.username} · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-kixora-white">{formatPrice(o.total)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    o.status === 'COMPLETED' ? 'bg-kixora-green bg-opacity-15 text-kixora-green' :
                    o.status === 'CANCELLED' ? 'bg-kixora-red bg-opacity-15 text-kixora-red' :
                    'bg-kixora-amber bg-opacity-15 text-kixora-amber'
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
