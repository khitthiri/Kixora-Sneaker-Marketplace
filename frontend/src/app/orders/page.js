'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { formatPrice, timeAgo } from '../../lib/api';
import api from '../../lib/api';
import { Package, ShoppingBag, Clock, CheckCircle, XCircle, Truck, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     color: 'text-yellow-400',      bg: 'bg-yellow-400 bg-opacity-10',   icon: Clock },
  CONFIRMED:   { label: 'Confirmed',   color: 'text-kixora-amber',    bg: 'bg-kixora-amber bg-opacity-10', icon: CheckCircle },
  PAID:        { label: 'Paid',        color: 'text-kixora-amber',    bg: 'bg-kixora-amber bg-opacity-10', icon: CheckCircle },
  AUTHENTICATING: { label: 'Auth Check', color: 'text-purple-400',   bg: 'bg-purple-400 bg-opacity-10',   icon: Package },
  SHIPPED:     { label: 'Shipped',     color: 'text-blue-400',        bg: 'bg-blue-400 bg-opacity-10',     icon: Truck },
  DELIVERED:   { label: 'Delivered',   color: 'text-kixora-green',    bg: 'bg-kixora-green bg-opacity-10', icon: CheckCircle },
  COMPLETED:   { label: 'Completed',   color: 'text-kixora-green',    bg: 'bg-kixora-green bg-opacity-10', icon: CheckCircle },
  CANCELLED:   { label: 'Cancelled',   color: 'text-kixora-red',      bg: 'bg-kixora-red bg-opacity-10',   icon: XCircle },
  REFUNDED:    { label: 'Refunded',    color: 'text-kixora-red',      bg: 'bg-kixora-red bg-opacity-10',   icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order, isSale }) {
  const listing = order.listing || order.item;
  const product = listing?.product || {};
  const otherUser = isSale ? order.buyer : order.seller;

  return (
    <div className="card-dark p-5 hover:border-kixora-amber hover:border-opacity-20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Image */}
        <div className="w-full sm:w-20 h-20 bg-kixora-surface2 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {listing?.images?.[0] || product?.images?.[0]
            ? <img src={listing.images?.[0] || product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
            : <span className="text-3xl">👟</span>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-xs text-kixora-amber font-bold uppercase tracking-wider mb-0.5">
                {product.brand?.name || listing?.brand || 'KIXORA'}
              </p>
              <p className="text-kixora-white font-semibold text-sm truncate">
                {product.name || listing?.title || 'Order #' + order.id?.slice(0, 8)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-kixora-gray mt-2">
            <span>Size US {listing?.size || '—'}</span>
            <span>Order #{order.id?.slice(0, 8).toUpperCase()}</span>
            <span>{timeAgo(order.createdAt)}</span>
            {otherUser && (
              <span>{isSale ? 'Buyer' : 'Seller'}: @{otherUser.username}</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <p className="text-xl font-bold text-kixora-white">{formatPrice(order.total || order.amount || order.price)}</p>
          {order.trackingNumber && (
            <a href="#" className="text-xs text-kixora-amber hover:underline flex items-center gap-1">
              Track <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Progress bar for active orders */}
      {['PAID', 'AUTHENTICATING', 'SHIPPED'].includes(order.status) && (
        <div className="mt-4 pt-4 border-t border-kixora-border">
          <div className="flex items-center gap-0">
            {['Paid', 'Auth Check', 'Shipped', 'Delivered'].map((step, idx) => {
              const stepMap = { 0: ['PAID', 'AUTHENTICATING', 'SHIPPED', 'DELIVERED'], 1: ['AUTHENTICATING', 'SHIPPED', 'DELIVERED'], 2: ['SHIPPED', 'DELIVERED'], 3: ['DELIVERED'] };
              const isActive = stepMap[idx]?.includes(order.status) || order.status === 'COMPLETED';
              const isCurrent = (idx === 0 && order.status === 'PAID') || (idx === 1 && order.status === 'AUTHENTICATING') || (idx === 2 && order.status === 'SHIPPED') || (idx === 3 && order.status === 'DELIVERED');
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border-2 transition-all ${isActive ? 'bg-kixora-amber border-kixora-amber text-kixora-black' : 'border-kixora-border text-kixora-gray'} ${isCurrent ? 'ring-2 ring-kixora-amber ring-offset-2 ring-offset-kixora-surface' : ''}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] ml-1 mr-2 hidden sm:block ${isActive ? 'text-kixora-white' : 'text-kixora-gray'}`}>{step}</span>
                  {idx < 3 && <div className={`flex-1 h-0.5 mr-1 ${isActive ? 'bg-kixora-amber' : 'bg-kixora-border'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('buying');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', tab],
    queryFn: async () => {
      const endpoint = tab === 'buying' ? '/orders/buying' : '/orders/selling';
      const { data } = await api.get(endpoint);
      return data.data;
    },
    enabled: !!user,
  });

  const orders = data?.orders || [];
  const active = orders.filter(o => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status));
  const history = orders.filter(o => ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status));

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">MY ORDERS</h2>
          <p className="text-kixora-gray mb-6">Sign in to view your orders and transaction history.</p>
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
        <div className="mb-8">
          <p className="section-label">Transactions</p>
          <h1 className="section-title">MY ORDERS</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-kixora-surface border border-kixora-border rounded-xl p-1 w-fit mb-8">
          {[
            { key: 'buying', label: 'Buying', icon: ShoppingBag },
            { key: 'selling', label: 'Selling', icon: Package },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-dark p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 skeleton rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 skeleton rounded w-1/4" />
                    <div className="h-4 skeleton rounded w-1/2" />
                    <div className="h-3 skeleton rounded w-1/3" />
                  </div>
                  <div className="w-24 space-y-2">
                    <div className="h-6 skeleton rounded" />
                    <div className="h-4 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 border border-kixora-border rounded-2xl">
            <p className="text-5xl mb-4">{tab === 'buying' ? '🛍️' : '📦'}</p>
            <p className="text-kixora-white font-semibold text-lg mb-2">No {tab} orders yet</p>
            <p className="text-kixora-gray text-sm mb-5">
              {tab === 'buying' ? 'Browse the marketplace to find your next pair' : 'List your sneakers to start selling'}
            </p>
            <Link href={tab === 'buying' ? '/marketplace' : '/seller'} className="btn-primary">
              {tab === 'buying' ? 'Shop Now' : 'Start Selling'}
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold text-kixora-amber uppercase tracking-wider mb-4">Active Orders ({active.length})</h2>
                <div className="space-y-4">
                  {active.map(o => <OrderCard key={o.id} order={o} isSale={tab === 'selling'} />)}
                </div>
              </section>
            )}
            {history.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-4">History ({history.length})</h2>
                <div className="space-y-4 opacity-70">
                  {history.map(o => <OrderCard key={o.id} order={o} isSale={tab === 'selling'} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
