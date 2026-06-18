'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { DropCard } from '../../components/marketplace/DropCard';
import api from '../../lib/api';
import { formatPrice } from '../../lib/api';
import { Calendar, Clock, Bell, Filter } from 'lucide-react';

const FILTERS = ['All', 'Nike', 'Jordan', 'Adidas', 'New Balance', 'Vans'];

function CountdownTimer({ releaseDate }) {
  const now = new Date();
  const release = new Date(releaseDate);
  const diff = release - now;

  if (diff <= 0) return <span className="text-kixora-gray text-sm">Released</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (days > 30) {
    return (
      <span className="text-kixora-gray text-sm">
        {release.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {[['D', days], ['H', hours], ['M', mins]].map(([unit, val]) => (
        <div key={unit} className="flex flex-col items-center bg-kixora-surface2 border border-kixora-border rounded-lg px-2.5 py-1.5 min-w-[44px]">
          <span className="font-display text-lg text-kixora-amber leading-none">{String(val).padStart(2, '0')}</span>
          <span className="text-[9px] text-kixora-gray uppercase tracking-widest">{unit}</span>
        </div>
      ))}
    </div>
  );
}

function DropListItem({ drop }) {
  const release = new Date(drop.releaseDate || drop.scheduledAt);
  const isLive = drop.status === 'LIVE' || (drop.status === 'ACTIVE' && release <= new Date());

  return (
    <div className="card-dark flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:border-kixora-amber hover:border-opacity-40 transition-all">
      <div className="w-full sm:w-24 h-24 bg-kixora-surface2 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {drop.imageUrl
          ? <img src={drop.imageUrl} alt={drop.name} className="w-full h-full object-cover" />
          : <span className="text-4xl">👟</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isLive && (
            <span className="badge-live text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
            </span>
          )}
          <span className="text-xs text-kixora-amber font-bold uppercase tracking-wider">
            {drop.brand || drop.product?.brand?.name || 'Drop'}
          </span>
        </div>
        <h3 className="font-semibold text-kixora-white text-base mb-1 truncate">{drop.name || drop.title}</h3>
        <p className="text-sm text-kixora-gray line-clamp-1 mb-2">{drop.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-kixora-gray">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {release.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {release.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} BKK
          </span>
          {drop.retailPrice && (
            <span className="font-semibold text-kixora-white">{formatPrice(drop.retailPrice)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-3 flex-shrink-0">
        <CountdownTimer releaseDate={drop.releaseDate || drop.scheduledAt} />
        <button className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Notify Me
        </button>
      </div>
    </div>
  );
}

export default function DropsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [view, setView] = useState('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['drops', activeFilter],
    queryFn: async () => {
      const params = {};
      if (activeFilter !== 'All') params.brand = activeFilter.toLowerCase();
      const { data } = await api.get('/drops', { params });
      return data.data;
    },
  });

  const drops = data?.drops || [];
  const liveDrops = drops.filter(d => d.status === 'LIVE' || d.status === 'ACTIVE');
  const upcoming = drops.filter(d => d.status === 'UPCOMING' || d.status === 'SCHEDULED');
  const past = drops.filter(d => d.status === 'ENDED' || d.status === 'SOLD_OUT');

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      {/* Hero */}
      <section className="bg-kixora-surface border-b border-kixora-border py-12">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <p className="section-label">Calendar</p>
          <h1 className="section-title mb-3">DROP RADAR</h1>
          <p className="text-kixora-gray max-w-xl">
            Never miss a release. Track upcoming drops, set reminders, and be first in line.
          </p>
        </div>
      </section>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeFilter === f
                  ? 'bg-kixora-amber border-kixora-amber text-kixora-black'
                  : 'border-kixora-border text-kixora-gray hover:text-kixora-white hover:border-kixora-gray'
              }`}>
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 bg-kixora-surface border border-kixora-border rounded-xl p-1">
            <button onClick={() => setView('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'grid' ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'}`}>
              Grid
            </button>
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-kixora-amber text-kixora-black' : 'text-kixora-gray hover:text-kixora-white'}`}>
              List
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] skeleton" />
              </div>
            ))}
          </div>
        ) : drops.length === 0 ? (
          <div className="text-center py-20 border border-kixora-border rounded-2xl">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-kixora-white font-semibold mb-2">No drops found</p>
            <p className="text-kixora-gray text-sm">Check back soon for upcoming releases</p>
          </div>
        ) : (
          <>
            {/* Live Now */}
            {liveDrops.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="badge-live">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE NOW
                  </span>
                  <span className="text-sm text-kixora-gray">{liveDrops.length} active</span>
                </div>
                {view === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {liveDrops.map(d => <DropCard key={d.id} drop={d} />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveDrops.map(d => <DropListItem key={d.id} drop={d} />)}
                  </div>
                )}
              </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-4">UPCOMING DROPS</h2>
                {view === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {upcoming.map(d => <DropCard key={d.id} drop={d} />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(d => <DropListItem key={d.id} drop={d} />)}
                  </div>
                )}
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-4 opacity-50">PAST DROPS</h2>
                {view === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-50">
                    {past.map(d => <DropCard key={d.id} drop={d} />)}
                  </div>
                ) : (
                  <div className="space-y-3 opacity-50">
                    {past.map(d => <DropListItem key={d.id} drop={d} />)}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
