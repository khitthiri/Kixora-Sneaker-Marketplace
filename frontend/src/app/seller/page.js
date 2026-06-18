'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { formatPrice, timeAgo } from '../../lib/api';
import api from '../../lib/api';
import {
  BarChart2, DollarSign, Package, TrendingUp, Eye, Edit2,
  Trash2, Plus, Star, Lock, CheckCircle, Clock, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CONDITION_LABELS = {
  DEADSTOCK: 'DS', VERY_NEAR_DS: 'VNDS', EXCELLENT: 'Excellent', GOOD: 'Good', FAIR: 'Fair'
};

const STATUS_CONFIG = {
  ACTIVE:   { label: 'Active',   color: 'text-kixora-green',  bg: 'bg-kixora-green bg-opacity-10',  icon: CheckCircle },
  SOLD:     { label: 'Sold',     color: 'text-kixora-amber',  bg: 'bg-kixora-amber bg-opacity-10',  icon: CheckCircle },
  PENDING:  { label: 'Pending',  color: 'text-yellow-400',    bg: 'bg-yellow-400 bg-opacity-10',    icon: Clock },
  INACTIVE: { label: 'Inactive', color: 'text-kixora-gray',   bg: 'bg-kixora-gray bg-opacity-10',   icon: XCircle },
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card-dark p-5">
      <div className="w-10 h-10 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 rounded-xl flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold text-kixora-white mb-0.5">{value}</p>
      <p className="text-xs text-kixora-gray uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs text-kixora-green mt-1">{sub}</p>}
    </div>
  );
}

function ListingRow({ listing, onDelete }) {
  const cfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.ACTIVE;
  const Icon = cfg.icon;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Remove this listing?')) return;
    setDeleting(true);
    try { await onDelete(listing.id); } finally { setDeleting(false); }
  };

  return (
    <div className="card-dark flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:border-kixora-amber hover:border-opacity-30 transition-all">
      <div className="w-full sm:w-16 h-16 bg-kixora-surface2 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {listing.images?.[0]
          ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
          : <span className="text-2xl">👟</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-0.5">
          {listing.product?.brand?.name || listing.brand || 'Brand'}
        </p>
        <p className="text-kixora-white font-semibold text-sm truncate">{listing.title || listing.product?.name}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-kixora-gray mt-1">
          <span>US {listing.size}</span>
          <span>{CONDITION_LABELS[listing.condition]}</span>
          <span>{timeAgo(listing.createdAt)}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views || 0} views</span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <p className="text-lg font-bold text-kixora-white">{formatPrice(listing.price)}</p>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/seller/edit/${listing.id}`}
            className="w-8 h-8 flex items-center justify-center text-kixora-gray hover:text-kixora-white border border-kixora-border hover:border-kixora-gray rounded-lg transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="w-8 h-8 flex items-center justify-center text-kixora-gray hover:text-kixora-red border border-kixora-border hover:border-kixora-red rounded-lg transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('listings');
  const qc = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const { data } = await api.get('/seller/stats');
      return data.data;
    },
    enabled: !!user,
  });

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: async () => {
      const { data } = await api.get('/seller/listings');
      return data.data;
    },
    enabled: !!user && activeTab === 'listings',
  });

  const { data: offersData } = useQuery({
    queryKey: ['seller-offers'],
    queryFn: async () => {
      const { data } = await api.get('/offers/received');
      return data.data;
    },
    enabled: !!user && activeTab === 'offers',
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => qc.invalidateQueries(['seller-listings']),
  });

  const offerMutation = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/offers/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries(['seller-offers']),
  });

  const listings = listingsData?.listings || [];
  const offers = offersData?.offers || [];
  const stats = statsData?.stats || {};

  const salesData = stats.monthlySales || Array.from({ length: 6 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
    sales: Math.floor(Math.random() * 5000) + 1000,
  }));

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">SELLER HUB</h2>
          <p className="text-kixora-gray mb-6">Sign in to manage your listings and track your sales.</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-label">Seller Hub</p>
            <h1 className="section-title">YOUR STORE</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/seller/create" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Listing
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package className="w-5 h-5 text-kixora-amber" />} label="Active Listings" value={stats.activeListings || listings.filter(l => l.status === 'ACTIVE').length} />
          <StatCard icon={<DollarSign className="w-5 h-5 text-kixora-amber" />} label="Total Revenue" value={formatPrice(stats.totalRevenue || 0)} sub={stats.revenueGrowth ? `+${stats.revenueGrowth}% this month` : null} />
          <StatCard icon={<BarChart2 className="w-5 h-5 text-kixora-amber" />} label="Total Sales" value={stats.totalSales || 0} />
          <StatCard icon={<Star className="w-5 h-5 text-kixora-amber" />} label="Seller Rating" value={stats.rating ? `${Number(stats.rating).toFixed(1)} ★` : '—'} />
        </div>

        {/* Sales chart */}
        <div className="card-dark p-5 mb-8">
          <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-4">Monthly Revenue</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2B" />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1E1E1B', border: '1px solid #2E2E2B', borderRadius: 12 }}
                  labelStyle={{ color: '#F5F4F0' }}
                  itemStyle={{ color: '#F5A623' }}
                  formatter={v => [formatPrice(v), 'Revenue']}
                />
                <Bar dataKey="sales" fill="#F5A623" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-kixora-surface border border-kixora-border rounded-xl p-1 w-fit mb-6">
          {[
            { key: 'listings', label: `Listings (${listings.length})` },
            { key: 'offers', label: `Offers (${offers.filter(o => o.status === 'PENDING').length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {activeTab === 'listings' && (
          isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="card-dark h-24 skeleton" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 border border-kixora-border border-dashed rounded-2xl">
              <Package className="w-12 h-12 text-kixora-gray mx-auto mb-4" />
              <p className="text-kixora-white font-semibold mb-2">No listings yet</p>
              <p className="text-kixora-gray text-sm mb-5">Create your first listing to start selling</p>
              <Link href="/seller/create" className="btn-primary">Create Listing</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map(l => (
                <ListingRow key={l.id} listing={l} onDelete={(id) => deleteMutation.mutateAsync(id)} />
              ))}
            </div>
          )
        )}

        {/* Offers tab */}
        {activeTab === 'offers' && (
          offers.length === 0 ? (
            <div className="text-center py-20 border border-kixora-border border-dashed rounded-2xl">
              <DollarSign className="w-12 h-12 text-kixora-gray mx-auto mb-4" />
              <p className="text-kixora-white font-semibold mb-2">No offers yet</p>
              <p className="text-kixora-gray text-sm">Offers from buyers will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map(offer => (
                <div key={offer.id} className="card-dark flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kixora-white mb-0.5">
                      {offer.listing?.title || 'Listing'}
                    </p>
                    <p className="text-xs text-kixora-gray">
                      From @{offer.buyer?.username} · {timeAgo(offer.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-kixora-white">{formatPrice(offer.amount || offer.price)}</p>
                      <p className="text-xs text-kixora-gray line-through">{formatPrice(offer.listing?.price)}</p>
                    </div>
                    {offer.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => offerMutation.mutate({ id: offer.id, action: 'accept' })}
                          className="px-4 py-2 bg-kixora-green bg-opacity-20 border border-kixora-green border-opacity-40 text-kixora-green text-xs font-bold rounded-xl hover:bg-opacity-30 transition-all">
                          Accept
                        </button>
                        <button onClick={() => offerMutation.mutate({ id: offer.id, action: 'reject' })}
                          className="px-4 py-2 bg-kixora-red bg-opacity-10 border border-kixora-red border-opacity-30 text-kixora-red text-xs font-bold rounded-xl hover:bg-opacity-20 transition-all">
                          Decline
                        </button>
                      </div>
                    )}
                    {offer.status !== 'PENDING' && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                        offer.status === 'ACCEPTED' ? 'text-kixora-green bg-kixora-green bg-opacity-10' : 'text-kixora-red bg-kixora-red bg-opacity-10'
                      }`}>
                        {offer.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <Footer />
    </main>
  );
}
