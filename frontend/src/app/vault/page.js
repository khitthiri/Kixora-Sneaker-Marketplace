'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../lib/api';
import api from '../../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Package, TrendingUp, TrendingDown, DollarSign, LayoutGrid,
  List, Plus, X, ExternalLink, Trash2, Lock
} from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon, label, value, sub, positive }) {
  return (
    <div className="card-dark p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {sub !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'text-kixora-green' : 'text-kixora-red'}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-kixora-white mb-0.5">{value}</p>
      <p className="text-xs text-kixora-gray uppercase tracking-wider">{label}</p>
    </div>
  );
}

function AddItemModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', brand: '', size: '', purchasePrice: '', currentValue: '', condition: 'DEADSTOCK', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.purchasePrice) return;
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const field = (key, placeholder, type = 'text') => (
    <input type={type} placeholder={placeholder} className="input-dark"
      value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose} />
      <div className="relative bg-kixora-surface border border-kixora-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl text-kixora-white tracking-wide">ADD TO VAULT</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-kixora-gray" /></button>
        </div>
        <div className="space-y-3">
          {field('name', 'Sneaker name *')}
          {field('brand', 'Brand')}
          <div className="grid grid-cols-2 gap-3">
            {field('size', 'US Size')}
            <select className="input-dark" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
              {['DEADSTOCK', 'VERY_NEAR_DS', 'EXCELLENT', 'GOOD', 'FAIR'].map(c => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('purchasePrice', 'Purchase price *', 'number')}
            {field('currentValue', 'Current value', 'number')}
          </div>
          {field('imageUrl', 'Image URL (optional)')}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Adding...' : 'Add to Vault'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VaultItem({ item, view, onRemove }) {
  const profit = item.currentValue - item.purchasePrice;
  const pct = item.purchasePrice > 0 ? ((profit / item.purchasePrice) * 100).toFixed(1) : 0;
  const isUp = profit >= 0;

  if (view === 'list') {
    return (
      <div className="card-dark flex items-center gap-4 p-4 hover:border-kixora-amber hover:border-opacity-30">
        <div className="w-16 h-16 bg-kixora-surface2 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            : <span className="text-2xl">👟</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-0.5">{item.brand || 'Unknown'}</p>
          <p className="text-kixora-white font-semibold text-sm truncate">{item.name}</p>
          <p className="text-xs text-kixora-gray">US {item.size} · {item.condition?.replace('_', ' ')}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-kixora-white font-bold">{formatPrice(item.currentValue || item.purchasePrice)}</p>
          <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${isUp ? 'text-kixora-green' : 'text-kixora-red'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{formatPrice(profit)} ({pct}%)
          </p>
        </div>
        <button onClick={() => onRemove(item.id)} className="ml-2 text-kixora-gray hover:text-kixora-red transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="card-dark overflow-hidden group hover:border-kixora-amber hover:border-opacity-40 hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-square bg-kixora-surface2 relative flex items-center justify-center">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          : <span className="text-6xl">👟</span>}
        <button onClick={() => onRemove(item.id)}
          className="absolute top-2 right-2 w-7 h-7 bg-kixora-surface border border-kixora-border rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-kixora-red hover:text-kixora-red text-kixora-gray">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <span className={`absolute bottom-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${isUp ? 'bg-kixora-green bg-opacity-20 text-kixora-green' : 'bg-kixora-red bg-opacity-20 text-kixora-red'}`}>
          {isUp ? '+' : ''}{pct}%
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-1">{item.brand || 'Unknown'}</p>
        <p className="text-kixora-white font-semibold text-sm mb-1 truncate">{item.name}</p>
        <p className="text-xs text-kixora-gray mb-3">US {item.size} · {item.condition?.replace('_', ' ')}</p>
        <div className="flex items-baseline justify-between">
          <span className="text-kixora-white font-bold">{formatPrice(item.currentValue || item.purchasePrice)}</span>
          <span className="text-xs text-kixora-gray">Paid {formatPrice(item.purchasePrice)}</span>
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const { user } = useAuthStore();
  const [view, setView] = useState('grid');
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vault'],
    queryFn: async () => {
      const { data } = await api.get('/vault');
      return data.data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: (form) => api.post('/vault', form),
    onSuccess: () => qc.invalidateQueries(['vault']),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.delete(`/vault/${id}`),
    onSuccess: () => qc.invalidateQueries(['vault']),
  });

  const items = data?.items || [];
  const totalPaid = items.reduce((s, i) => s + Number(i.purchasePrice || 0), 0);
  const totalValue = items.reduce((s, i) => s + Number(i.currentValue || i.purchasePrice || 0), 0);
  const totalProfit = totalValue - totalPaid;
  const gainPct = totalPaid > 0 ? ((totalProfit / totalPaid) * 100).toFixed(1) : '0.0';

  // Mock chart data based on collection value
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i],
    value: Math.round(totalValue * (0.7 + i * 0.05)),
  }));

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">YOUR VAULT</h2>
          <p className="text-kixora-gray mb-6 max-w-sm">Track your collection, monitor valuations, and showcase your kicks.</p>
          <Link href="/auth/login" className="btn-primary">Sign In to Access Vault</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={(form) => addMutation.mutateAsync(form)} />}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-label">My Collection</p>
            <h1 className="section-title">THE VAULT</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Sneaker
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package className="w-5 h-5 text-kixora-amber" />} label="Total Pairs" value={items.length} />
          <StatCard icon={<DollarSign className="w-5 h-5 text-kixora-amber" />} label="Amount Paid" value={formatPrice(totalPaid)} />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-kixora-amber" />} label="Current Value" value={formatPrice(totalValue)} />
          <StatCard
            icon={<BarChart2Icon className="w-5 h-5 text-kixora-amber" />}
            label="Total Gain/Loss"
            value={`${totalProfit >= 0 ? '+' : ''}${formatPrice(totalProfit)}`}
            sub={`${gainPct}%`}
            positive={totalProfit >= 0}
          />
        </div>

        {/* Chart */}
        {items.length > 0 && (
          <div className="card-dark p-5 mb-8">
            <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-4">Portfolio Value Over Time</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2B" />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1E1E1B', border: '1px solid #2E2E2B', borderRadius: 12 }}
                    labelStyle={{ color: '#F5F4F0' }}
                    itemStyle={{ color: '#F5A623' }}
                    formatter={v => [formatPrice(v), 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2} fill="url(#vaultGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Collection */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-kixora-gray">{items.length} {items.length === 1 ? 'pair' : 'pairs'} in vault</p>
          <div className="flex items-center gap-1 bg-kixora-surface border border-kixora-border rounded-xl p-1">
            <button onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-2 bg-kixora-surface border border-kixora-border border-t-0 rounded-b-2xl">
                  <div className="h-3 skeleton rounded w-1/3" /><div className="h-4 skeleton rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 border border-kixora-border rounded-2xl border-dashed">
            <p className="text-5xl mb-4">🥿</p>
            <p className="text-kixora-white font-semibold text-lg mb-2">Your vault is empty</p>
            <p className="text-kixora-gray text-sm mb-5">Start tracking your collection by adding your first pair</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">Add Your First Pair</button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(item => (
              <VaultItem key={item.id} item={item} view="grid" onRemove={(id) => removeMutation.mutate(id)} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <VaultItem key={item.id} item={item} view="list" onRemove={(id) => removeMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

// Small inline icon component
function BarChart2Icon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
