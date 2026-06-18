'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import api, { formatPrice } from '../../lib/api';
import { Clock, Gavel, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

function Countdown({ endsAt }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt) - Date.now();
      if (diff <= 0) { setLabel('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const urgent = new Date(endsAt) - Date.now() < 300000;
  return <span className={urgent ? 'text-kixora-red font-bold' : 'text-kixora-white'}>{label}</span>;
}

function AuctionCard({ auction }) {
  const listing = auction.listing;
  const product = listing?.product;
  const image = listing?.images?.[0]?.url;
  const bidCount = auction._count?.bids || auction.bidCount || 0;
  const isLive = auction.status === 'LIVE';

  return (
    <Link href={`/auctions/${auction.id}`} className="card-product block group">
      <div className="aspect-square bg-kixora-surface2 flex items-center justify-center relative overflow-hidden">
        {image
          ? <img src={image} alt={product?.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-6xl group-hover:scale-110 transition-transform">👟</span>}
        {isLive && (
          <span className="badge-live absolute top-3 left-3 z-10 px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <div className="p-4 bg-kixora-surface">
        <p className="text-[10px] font-bold text-kixora-amber uppercase tracking-wider mb-1">{product?.brand?.name}</p>
        <p className="text-sm font-semibold text-kixora-white mb-3 leading-snug line-clamp-2">{product?.name || listing?.title}</p>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[10px] text-kixora-gray">Current Bid</p>
            <p className="font-display text-2xl text-kixora-amber">{formatPrice(auction.currentBid || auction.startingBid)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-kixora-gray">Ends in</p>
            {auction.endsAt ? <Countdown endsAt={auction.endsAt} /> : <span className="text-kixora-gray text-xs">TBD</span>}
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-kixora-border">
          <span className="text-xs text-kixora-gray flex items-center gap-1">
            <Users className="w-3 h-3" /> {bidCount} bids
          </span>
          <span className="text-xs text-kixora-gray">US {listing?.size}</span>
        </div>
      </div>
    </Link>
  );
}

export default function AuctionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: async () => {
      const { data } = await api.get('/auctions');
      return data.data;
    },
    refetchInterval: 30000,
  });

  const auctions = data?.auctions || [];
  const live = auctions.filter(a => a.status === 'LIVE');
  const upcoming = auctions.filter(a => a.status === 'UPCOMING');

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      {/* Hero */}
      <section className="bg-kixora-surface border-b border-kixora-border py-12">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="section-label">Real-Time Bidding</p>
              <h1 className="section-title mb-3">LIVE AUCTIONS</h1>
              <p className="text-kixora-gray max-w-xl">Bid on authenticated sneakers in real time. Every winner guaranteed genuine.</p>
            </div>
            <div className="flex items-center gap-3">
              {live.length > 0 && (
                <div className="flex items-center gap-2 bg-kixora-red bg-opacity-10 border border-kixora-red border-opacity-30 rounded-full px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-kixora-red animate-pulse" />
                  <span className="text-sm font-bold text-kixora-red">{live.length} Live Now</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Gavel className="w-5 h-5 text-kixora-amber" />, label: 'Live Auctions', value: live.length },
            { icon: <TrendingUp className="w-5 h-5 text-kixora-amber" />, label: 'Total Bids Today', value: '1,284' },
            { icon: <Clock className="w-5 h-5 text-kixora-amber" />, label: 'Upcoming', value: upcoming.length },
          ].map(s => (
            <div key={s.label} className="card-dark p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-kixora-white">{s.value}</p>
                <p className="text-xs text-kixora-gray">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 bg-kixora-surface border border-kixora-border border-t-0 rounded-b-2xl space-y-2">
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-8 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-24 border border-kixora-border rounded-2xl">
            <Gavel className="w-12 h-12 text-kixora-gray mx-auto mb-4" />
            <p className="text-kixora-white font-semibold text-lg mb-2">No auctions live right now</p>
            <p className="text-kixora-gray text-sm mb-5">Check back soon — new auctions go live daily</p>
            <Link href="/marketplace" className="btn-primary">Browse Marketplace</Link>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-display text-2xl text-kixora-white tracking-wide">LIVE NOW</h2>
                  <span className="badge-live px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {live.length} Active
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {live.map(a => <AuctionCard key={a.id} auction={a} />)}
                </div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-5">STARTING SOON</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {upcoming.map(a => <AuctionCard key={a.id} auction={a} />)}
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
