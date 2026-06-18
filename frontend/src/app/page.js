'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ListingCard } from '../components/marketplace/ListingCard';
import { DropCard } from '../components/marketplace/DropCard';
import { ShieldCheck, Lock, BarChart2, Package } from 'lucide-react';
import api from '../lib/api';

function HeroSection() {
  return (
    <section className="relative grid lg:grid-cols-2 min-h-[560px] bg-kixora-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 px-6 sm:px-12 py-16 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25 rounded-full px-4 py-1.5 mb-6 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-kixora-amber animate-pulse" />
          <span className="text-xs font-bold text-kixora-amber uppercase tracking-widest">48 Live Auctions Right Now</span>
        </div>

        <h1 className="font-display text-[72px] sm:text-[96px] leading-none tracking-wide text-kixora-white mb-5">
          COLLECT.<br /><span className="text-kixora-amber">VERIFY.</span><br />TRADE.
        </h1>

        <p className="text-kixora-gray text-base leading-relaxed max-w-md mb-8">
          The world's most trusted sneaker marketplace. Every pair authenticated. Every deal protected.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <Link href="/marketplace" className="btn-primary text-base px-8 py-3.5">Browse Marketplace</Link>
          <Link href="/auth/register" className="btn-secondary text-base px-8 py-3.5">Start Selling</Link>
        </div>

        <div className="flex gap-8">
          {[['48K+', 'Active Listings'], ['$2.1M', 'Weekly Volume'], ['99.8%', 'Auth Rate']].map(([val, label]) => (
            <div key={label}>
              <p className="font-display text-3xl text-kixora-white">{val}</p>
              <p className="text-xs text-kixora-gray uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative bg-kixora-surface flex items-center justify-center p-8">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,166,35,0.07) 0%, transparent 70%)' }} />
        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-kixora-surface2 border border-kixora-border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-[-18px] bg-kixora-amber text-kixora-black text-[9px] font-black px-7 py-1 rotate-45 tracking-wider">VERIFIED</div>
            <div className="text-7xl text-center mb-4">👟</div>
            <div className="flex items-baseline gap-2 justify-center mb-1">
              <span className="font-display text-5xl text-kixora-amber">$2,450</span>
              <span className="text-xs text-kixora-gray">Current bid</span>
            </div>
            <p className="text-center text-sm font-semibold text-kixora-white mb-1">Air Jordan 1 Retro High OG "Chicago"</p>
            <p className="text-center text-xs text-kixora-gray mb-4">Nike · US 10 · Deadstock</p>
            <div className="flex items-center gap-2 justify-center bg-kixora-green bg-opacity-10 border border-kixora-green border-opacity-20 rounded-full px-4 py-1.5 w-fit mx-auto mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-kixora-green animate-pulse" />
              <span className="text-xs font-semibold text-kixora-green">Auction ends in 2h 14m</span>
            </div>
            {[['@kix_hunter_bkk', '$2,450', '2m ago'], ['@sneakerVault_sg', '$2,380', '8m ago'], ['@rare_kicks_th', '$2,200', '24m ago']].map(([u, bid, time]) => (
              <div key={u} className="flex items-center justify-between bg-kixora-surface rounded-lg px-3 py-2 mb-1.5">
                <span className="text-xs text-kixora-gray">{u}</span>
                <span className="text-xs font-semibold text-kixora-white">{bid}</span>
                <span className="text-xs text-kixora-gray">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: <ShieldCheck className="w-6 h-6 text-kixora-amber" />, title: 'Expert Authentication', desc: 'Every pair verified by certified authenticators using a 50-point inspection. No fakes, ever.' },
    { icon: <Lock className="w-6 h-6 text-kixora-amber" />, title: 'Escrow Protection', desc: 'Funds held securely until you confirm delivery. Full refund if auth fails.' },
    { icon: <BarChart2 className="w-6 h-6 text-kixora-amber" />, title: 'Real-Time Market Data', desc: 'Live price tracking, resale trends, and portfolio analytics.' },
    { icon: <Package className="w-6 h-6 text-kixora-amber" />, title: 'Collection Vault', desc: 'Track every pair you own, monitor valuations, showcase your collection.' },
  ];
  return (
    <section className="bg-kixora-surface border-y border-kixora-border py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <p className="section-label">Why KIXORA</p>
          <h2 className="section-title">BUILT DIFFERENT</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <div key={f.title} className="bg-kixora-black border border-kixora-border rounded-2xl p-6 hover:border-kixora-amber hover:border-opacity-40 transition-all">
              <div className="w-12 h-12 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 rounded-xl flex items-center justify-center mb-5">{f.icon}</div>
              <h3 className="font-semibold text-kixora-white mb-2">{f.title}</h3>
              <p className="text-sm text-kixora-gray leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: listingsData } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: async () => { const { data } = await api.get('/listings/featured'); return data.data.listings; },
  });

  const { data: dropsData } = useQuery({
    queryKey: ['drops-preview'],
    queryFn: async () => { const { data } = await api.get('/drops'); return data.data.drops?.slice(0, 4); },
  });

  const listings = listingsData || [];
  const drops = dropsData || [];

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />
      <HeroSection />
      <FeaturesSection />

      {/* Upcoming Drops */}
      {drops.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="section-label">Coming Soon</p>
              <h2 className="section-title">UPCOMING DROPS</h2>
            </div>
            <Link href="/drops" className="text-sm text-kixora-gray hover:text-kixora-amber transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {drops.map(drop => <DropCard key={drop.id} drop={drop} />)}
          </div>
        </section>
      )}

      {/* Featured Listings */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="section-label">Marketplace</p>
            <h2 className="section-title">SHOP THE DROP</h2>
          </div>
          <Link href="/marketplace" className="text-sm text-kixora-gray hover:text-kixora-amber transition-colors">See all →</Link>
        </div>
        {listings.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-2 bg-kixora-surface border border-kixora-border rounded-b-2xl">
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-6 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
