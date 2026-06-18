'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { useAuthStore } from '../../../store/authStore';
import { formatPrice, timeAgo } from '../../../lib/api';
import api from '../../../lib/api';
import { Clock, Users, TrendingUp, ShieldCheck, AlertCircle, ChevronLeft, Gavel } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';

function CountdownTimer({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 300000); // under 5 min
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <span className={urgent ? 'text-kixora-red animate-pulse' : 'text-kixora-white'}>
      {timeLeft}
    </span>
  );
}

function BidRow({ bid, isHighest, currentUserId }) {
  const isMe = bid.bidderId === currentUserId || bid.bidder?.id === currentUserId;
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
      isHighest ? 'bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25' : 'bg-kixora-surface2'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          isHighest ? 'bg-kixora-amber text-kixora-black' : 'bg-kixora-surface text-kixora-gray'
        }`}>
          {bid.bidder?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm text-kixora-gray">
          @{bid.bidder?.username || 'Anonymous'}
          {isMe && <span className="ml-1 text-xs text-kixora-amber">(you)</span>}
        </span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-bold ${isHighest ? 'text-kixora-amber' : 'text-kixora-white'}`}>
          {formatPrice(bid.amount)}
        </span>
        <p className="text-[10px] text-kixora-gray">{timeAgo(bid.createdAt)}</p>
      </div>
    </div>
  );
}

export default function AuctionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState([]);
  const [currentBid, setCurrentBid] = useState(null);
  const [bidderCount, setBidderCount] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const socketRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const { data } = await api.get(`/auctions/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (data) {
      setBids(data.bids || []);
      setCurrentBid(data.auction?.currentBid || data.auction?.startingBid);
      setBidderCount(data.auction?.bidderCount || data.bids?.length || 0);
      const minBid = (data.auction?.currentBid || data.auction?.startingBid || 0) + (data.auction?.bidIncrement || 25);
      setBidAmount(minBid.toString());
    }
  }, [data]);

  // Socket.io for live auction updates
  useEffect(() => {
    if (!id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
    });
    socketRef.current = socket;
    socket.emit('join_auction', id);

    socket.on('new_bid', (bid) => {
      setBids(prev => [bid, ...prev]);
      setCurrentBid(bid.amount);
      setBidderCount(prev => prev + 1);
    });

    socket.on('auction_ended', () => {
      router.refresh();
    });

    return () => {
      socket.emit('leave_auction', id);
      socket.disconnect();
    };
  }, [id]);

  const bidMutation = useMutation({
    mutationFn: () => api.post(`/auctions/${id}/bid`, { amount: Number(bidAmount) }),
    onSuccess: (res) => {
      setBidError('');
      setBidSuccess('Bid placed successfully!');
      setTimeout(() => setBidSuccess(''), 3000);
    },
    onError: (err) => {
      setBidError(err.response?.data?.message || 'Failed to place bid');
    },
  });

  const handleBid = () => {
    setBidError('');
    if (!user) { router.push('/auth/login'); return; }
    const amount = Number(bidAmount);
    const minBid = (currentBid || 0) + (auction?.bidIncrement || 25);
    if (amount < minBid) {
      setBidError(`Minimum bid is ${formatPrice(minBid)}`);
      return;
    }
    bidMutation.mutate();
  };

  const auction = data?.auction;
  const product = auction?.listing?.product || auction?.product || {};
  const images = auction?.listing?.images || product?.images || [];
  const isEnded = auction?.status === 'ENDED' || auction?.status === 'COMPLETED';
  const isLive = auction?.status === 'LIVE' || auction?.status === 'ACTIVE';
  const minNextBid = (currentBid || 0) + (auction?.bidIncrement || 25);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="aspect-square skeleton rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 skeleton rounded w-3/4" />
              <div className="h-6 skeleton rounded w-1/2" />
              <div className="h-24 skeleton rounded" />
              <div className="h-12 skeleton rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-6xl mb-4">⚡</p>
          <h2 className="font-display text-4xl text-kixora-white mb-3">AUCTION NOT FOUND</h2>
          <Link href="/marketplace" className="btn-primary mt-4">Browse Marketplace</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-kixora-gray hover:text-kixora-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="aspect-square bg-kixora-surface border border-kixora-border rounded-2xl overflow-hidden relative mb-3">
              {images.length > 0
                ? <img src={images[activeImg]} alt={product.name} className="w-full h-full object-contain p-8" />
                : <div className="w-full h-full flex items-center justify-center text-8xl">👟</div>}
              {isLive && (
                <div className="absolute top-4 left-4 badge-live px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE AUCTION
                </div>
              )}
              {isEnded && (
                <div className="absolute top-4 left-4 bg-kixora-gray bg-opacity-80 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  ENDED
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-kixora-amber' : 'border-kixora-border hover:border-kixora-gray'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auction info */}
          <div>
            {/* Product info */}
            <div className="mb-5">
              <p className="text-xs text-kixora-amber font-bold uppercase tracking-widest mb-2">
                {product.brand?.name || auction.brand || 'KIXORA'}
              </p>
              <h1 className="font-display text-4xl text-kixora-white tracking-wide leading-tight mb-2">
                {product.name || auction.title}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-kixora-gray">
                <span>Size US {auction.listing?.size || auction.size}</span>
                <span>{auction.listing?.condition?.replace('_', ' ') || 'Deadstock'}</span>
                {auction.listing?.seller && (
                  <Link href={`/profile/${auction.listing.seller.username}`}
                    className="text-kixora-amber hover:underline">
                    @{auction.listing.seller.username}
                  </Link>
                )}
              </div>
            </div>

            {/* Live bid info */}
            <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-5 mb-5">
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-kixora-border">
                <div>
                  <p className="text-xs text-kixora-gray uppercase tracking-wider mb-1">Current Bid</p>
                  <p className="font-display text-3xl text-kixora-amber">{formatPrice(currentBid)}</p>
                </div>
                <div>
                  <p className="text-xs text-kixora-gray uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time Left
                  </p>
                  <p className="font-display text-2xl">
                    {isEnded ? (
                      <span className="text-kixora-gray">Ended</span>
                    ) : (
                      <CountdownTimer endsAt={auction.endsAt || auction.endTime} />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-kixora-gray uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Bidders
                  </p>
                  <p className="font-display text-2xl text-kixora-white">{bidderCount}</p>
                </div>
              </div>

              {/* Bid input */}
              {!isEnded ? (
                <div>
                  <p className="text-xs text-kixora-gray mb-2">Minimum next bid: <span className="text-kixora-amber font-bold">{formatPrice(minNextBid)}</span></p>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-kixora-gray font-bold">$</span>
                      <input
                        type="number"
                        className="input-dark pl-7"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        min={minNextBid}
                        step={auction.bidIncrement || 25}
                      />
                    </div>
                    <button onClick={handleBid} disabled={bidMutation.isPending || !user}
                      className="btn-primary flex items-center gap-2 px-6">
                      <Gavel className="w-4 h-4" />
                      {bidMutation.isPending ? 'Placing...' : 'Place Bid'}
                    </button>
                  </div>
                  {/* Quick bid buttons */}
                  <div className="flex gap-2">
                    {[minNextBid, minNextBid + 50, minNextBid + 100, minNextBid + 200].map(amt => (
                      <button key={amt} onClick={() => setBidAmount(amt.toString())}
                        className="flex-1 text-xs py-1.5 border border-kixora-border text-kixora-gray hover:text-kixora-amber hover:border-kixora-amber rounded-lg transition-all">
                        {formatPrice(amt)}
                      </button>
                    ))}
                  </div>
                  {bidError && (
                    <div className="flex items-center gap-2 text-kixora-red text-sm mt-3">
                      <AlertCircle className="w-4 h-4" />
                      {bidError}
                    </div>
                  )}
                  {bidSuccess && (
                    <div className="flex items-center gap-2 text-kixora-green text-sm mt-3">
                      <ShieldCheck className="w-4 h-4" />
                      {bidSuccess}
                    </div>
                  )}
                  {!user && (
                    <p className="text-xs text-kixora-gray mt-2 text-center">
                      <Link href="/auth/login" className="text-kixora-amber hover:underline">Sign in</Link> to place a bid
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-kixora-gray font-semibold">This auction has ended</p>
                  {bids[0] && (
                    <p className="text-kixora-amber text-sm mt-1">
                      Won by @{bids[0].bidder?.username} for {formatPrice(bids[0].amount)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Auth badge */}
            <div className="flex items-center gap-2 bg-kixora-green bg-opacity-10 border border-kixora-green border-opacity-25 rounded-xl px-4 py-3 mb-5">
              <ShieldCheck className="w-5 h-5 text-kixora-green" />
              <div>
                <p className="text-sm font-semibold text-kixora-green">Authentication Guaranteed</p>
                <p className="text-xs text-kixora-gray">Winner's pair will be authenticated by KIXORA before shipping</p>
              </div>
            </div>

            {/* Bid history */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-kixora-amber" />
                <h3 className="text-xs font-bold text-kixora-white uppercase tracking-wider">Bid History ({bids.length})</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {bids.length === 0 ? (
                  <p className="text-sm text-kixora-gray text-center py-6">No bids yet. Be the first!</p>
                ) : bids.map((bid, i) => (
                  <BidRow key={bid.id || i} bid={bid} isHighest={i === 0} currentUserId={user?.id} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
