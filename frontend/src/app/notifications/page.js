'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../lib/api';
import api from '../../lib/api';
import {
  Bell, ShoppingBag, Package, DollarSign, MessageCircle,
  Heart, Award, AlertCircle, CheckCheck, Lock
} from 'lucide-react';
import Link from 'next/link';

const TYPE_CONFIG = {
  ORDER_PLACED:    { icon: ShoppingBag, color: 'text-kixora-amber',  bg: 'bg-kixora-amber bg-opacity-10' },
  ORDER_SHIPPED:   { icon: Package,     color: 'text-blue-400',       bg: 'bg-blue-400 bg-opacity-10' },
  ORDER_DELIVERED: { icon: Package,     color: 'text-kixora-green',   bg: 'bg-kixora-green bg-opacity-10' },
  OFFER_RECEIVED:  { icon: DollarSign,  color: 'text-purple-400',     bg: 'bg-purple-400 bg-opacity-10' },
  OFFER_ACCEPTED:  { icon: DollarSign,  color: 'text-kixora-green',   bg: 'bg-kixora-green bg-opacity-10' },
  OFFER_REJECTED:  { icon: DollarSign,  color: 'text-kixora-red',     bg: 'bg-kixora-red bg-opacity-10' },
  MESSAGE:         { icon: MessageCircle, color: 'text-kixora-amber', bg: 'bg-kixora-amber bg-opacity-10' },
  LIKE:            { icon: Heart,       color: 'text-kixora-red',     bg: 'bg-kixora-red bg-opacity-10' },
  AUCTION_OUTBID:  { icon: AlertCircle, color: 'text-yellow-400',     bg: 'bg-yellow-400 bg-opacity-10' },
  AUCTION_WON:     { icon: Award,       color: 'text-kixora-amber',   bg: 'bg-kixora-amber bg-opacity-10' },
  AUTH_PASSED:     { icon: Award,       color: 'text-kixora-green',   bg: 'bg-kixora-green bg-opacity-10' },
  AUTH_FAILED:     { icon: AlertCircle, color: 'text-kixora-red',     bg: 'bg-kixora-red bg-opacity-10' },
  SYSTEM:          { icon: Bell,        color: 'text-kixora-gray',    bg: 'bg-kixora-gray bg-opacity-10' },
};

function NotifItem({ notif, onRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => !notif.read && onRead(notif.id)}
      className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer border ${
        notif.read
          ? 'border-transparent hover:border-kixora-border hover:bg-kixora-surface'
          : 'border-kixora-border bg-kixora-surface hover:border-kixora-amber hover:border-opacity-30'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed mb-1 ${notif.read ? 'text-kixora-gray' : 'text-kixora-white'}`}>
          {notif.message || notif.content}
        </p>
        <p className="text-xs text-kixora-gray">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-kixora-amber flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const readMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">NOTIFICATIONS</h2>
          <p className="text-kixora-gray mb-6">Sign in to view your notifications.</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label">Activity</p>
            <h1 className="section-title">NOTIFICATIONS</h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => readAllMutation.mutate()}
              className="flex items-center gap-2 text-sm text-kixora-gray hover:text-kixora-white transition-colors">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Unread count */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 mb-5 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25 rounded-xl px-4 py-3">
            <Bell className="w-4 h-4 text-kixora-amber" />
            <p className="text-sm text-kixora-amber font-medium">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4">
                <div className="w-10 h-10 skeleton rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                  <div className="h-3 skeleton rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24 border border-kixora-border rounded-2xl">
            <Bell className="w-12 h-12 text-kixora-gray mx-auto mb-4" />
            <p className="text-kixora-white font-semibold text-lg mb-2">All caught up</p>
            <p className="text-kixora-gray text-sm">No notifications yet. Start buying or selling to get updates.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Unread first */}
            {notifications.filter(n => !n.read).map(n => (
              <NotifItem key={n.id} notif={n} onRead={(id) => readMutation.mutate(id)} />
            ))}
            {notifications.filter(n => !n.read).length > 0 && notifications.filter(n => n.read).length > 0 && (
              <div className="border-t border-kixora-border my-4 pt-4">
                <p className="text-xs text-kixora-gray uppercase tracking-wider mb-3">Earlier</p>
              </div>
            )}
            {notifications.filter(n => n.read).map(n => (
              <NotifItem key={n.id} notif={n} onRead={() => {}} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
