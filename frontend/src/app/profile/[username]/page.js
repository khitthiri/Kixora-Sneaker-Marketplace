'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { ListingCard } from '../../../components/marketplace/ListingCard';
import { formatPrice, initials, timeAgo } from '../../../lib/api';
import api from '../../../lib/api';
import { MapPin, Star, Package, ShieldCheck, Calendar, ExternalLink } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}/profile`);
      return data.data;
    },
  });

  const profile = data?.user;
  const listings = data?.listings || [];
  const stats = data?.stats || {};

  if (isLoading) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          {/* Profile header skeleton */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full skeleton" />
            <div className="flex-1 space-y-3">
              <div className="h-6 skeleton rounded w-48" />
              <div className="h-4 skeleton rounded w-32" />
              <div className="h-4 skeleton rounded w-64" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="card-dark h-24 skeleton" />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 bg-kixora-surface border border-kixora-border border-t-0 rounded-b-2xl space-y-2">
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-6xl mb-4">🔍</p>
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">USER NOT FOUND</h2>
          <p className="text-kixora-gray">@{username} doesn't exist on KIXORA.</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      {/* Profile header */}
      <section className="bg-kixora-surface border-b border-kixora-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-kixora-amber bg-opacity-20 border-2 border-kixora-amber border-opacity-40 flex items-center justify-center text-3xl font-bold text-kixora-amber overflow-hidden flex-shrink-0">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                : initials(profile.displayName || profile.username)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-display text-3xl text-kixora-white tracking-wide">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isVerifiedSeller && (
                  <span className="auth-badge flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                )}
                {profile.role === 'ADMIN' && (
                  <span className="badge-amber">ADMIN</span>
                )}
              </div>
              <p className="text-kixora-gray text-sm mb-2">@{profile.username}</p>
              {profile.bio && (
                <p className="text-kixora-gray text-sm mb-3 max-w-xl">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-kixora-gray">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {timeAgo(profile.createdAt)}
                </span>
                {stats.rating && (
                  <span className="flex items-center gap-1 text-kixora-amber">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {Number(stats.rating).toFixed(1)} ({stats.ratingCount || 0} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-primary text-sm py-2.5">Make Offer</button>
              <button className="btn-ghost text-sm py-2.5">Follow</button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-kixora-surface border-b border-kixora-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-4 divide-x divide-kixora-border">
            {[
              { label: 'Listings', value: stats.activeListings || listings.length },
              { label: 'Total Sales', value: stats.totalSales || 0 },
              { label: 'Volume', value: formatPrice(stats.totalVolume || 0) },
              { label: 'Response Rate', value: `${stats.responseRate || 98}%` },
            ].map(s => (
              <div key={s.label} className="py-5 px-4 text-center">
                <p className="text-xl font-bold text-kixora-white">{s.value}</p>
                <p className="text-xs text-kixora-gray uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-kixora-white tracking-wide">ACTIVE LISTINGS</h2>
          <span className="text-sm text-kixora-gray">{listings.length} items</span>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 border border-kixora-border rounded-2xl">
            <Package className="w-12 h-12 text-kixora-gray mx-auto mb-3" />
            <p className="text-kixora-white font-semibold mb-1">No active listings</p>
            <p className="text-kixora-gray text-sm">@{profile.username} hasn't listed any sneakers yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
