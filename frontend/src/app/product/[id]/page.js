'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { ListingCard } from '../../../components/marketplace/ListingCard';
import { useAuthStore } from '../../../store/authStore';
import api, { formatPrice, getConditionLabel, timeAgo } from '../../../lib/api';
import { toast } from '../../../components/ui/Toaster';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductPage({ params }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [imgIdx, setImgIdx] = useState(0);
  const [showBuy, setShowBuy] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMsg, setOfferMsg] = useState('');
  const [buying, setBuying] = useState(false);
  const [offering, setOffering] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', params.id],
    queryFn: async () => { const { data } = await api.get(`/listings/${params.id}`); return data.data; },
  });

  const listing = data?.listing;
  const similar = data?.similar || [];

  if (isLoading) return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-10">
        <div className="aspect-square skeleton rounded-2xl" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-10 skeleton rounded-xl" />)}
        </div>
      </div>
    </main>
  );

  if (!listing) return <main className="min-h-screen bg-kixora-black flex items-center justify-center"><p className="text-kixora-gray">Listing not found</p></main>;

  const images = listing.images?.map(i => i.url) || [];
  const brand = listing.product?.brand?.name;

  const handleBuyNow = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setBuying(true);
    try {
      await api.post('/orders', { listingId: listing.id, shippingAddress: { street: 'TBD', city: 'Bangkok', country: 'TH', postal: '10110' } });
      toast.success('Order placed!', 'Check your orders for tracking');
      router.push('/orders');
    } catch (err) {
      toast.error('Order failed', err.response?.data?.error?.message);
    } finally { setBuying(false); setShowBuy(false); }
  };

  const handleOffer = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!offerAmount) return;
    setOffering(true);
    try {
      await api.post('/offers', { listingId: listing.id, amount: parseFloat(offerAmount), message: offerMsg });
      toast.success('Offer sent!', 'The seller will respond within 48 hours');
      setShowOffer(false);
    } catch (err) {
      toast.error('Offer failed', err.response?.data?.error?.message);
    } finally { setOffering(false); }
  };

  const priceHistory = listing.product?.priceHistory?.slice(0, 20).reverse() || [];

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-kixora-gray hover:text-kixora-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-kixora-surface border border-kixora-border rounded-2xl flex items-center justify-center relative overflow-hidden group">
              {listing.isAuthenticated && (
                <div className="absolute top-4 left-4 z-10 auth-badge flex items-center gap-1 text-xs">
                  <ShieldCheck className="w-3 h-3" /> KIXORA VERIFIED
                </div>
              )}
              {images[imgIdx] ? (
                <img src={images[imgIdx]} alt={listing.title} className="w-full h-full object-contain p-8" />
              ) : <span className="text-9xl">👟</span>}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => Math.max(0, i-1))} disabled={imgIdx===0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-kixora-black bg-opacity-70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0">
                    <ChevronLeft className="w-4 h-4 text-kixora-white" />
                  </button>
                  <button onClick={() => setImgIdx(i => Math.min(images.length-1, i+1))} disabled={imgIdx===images.length-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-kixora-black bg-opacity-70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0">
                    <ChevronRight className="w-4 h-4 text-kixora-white" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-16 flex-shrink-0 border rounded-xl overflow-hidden transition-all ${i===imgIdx ? 'border-kixora-amber' : 'border-kixora-border hover:border-kixora-gray'}`}>
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {brand && <p className="text-xs font-bold text-kixora-amber uppercase tracking-widest mb-2">{brand}</p>}
            <h1 className="text-2xl font-bold text-kixora-white mb-4 leading-snug">{listing.title}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-5xl text-kixora-white">{formatPrice(listing.price)}</span>
              <span className="bg-kixora-surface2 border border-kixora-border text-kixora-gray text-sm px-3 py-1 rounded-lg">{getConditionLabel(listing.condition)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ['Size', `US ${listing.size}`],
                ['Type', listing.listingType === 'AUCTION' ? 'Auction' : 'Fixed Price'],
                ['Shipping', listing.freeShipping ? 'Free' : formatPrice(listing.shippingCost)],
                ['Listed', timeAgo(listing.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="bg-kixora-surface border border-kixora-border rounded-xl p-3">
                  <p className="text-xs text-kixora-gray uppercase tracking-wider mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-kixora-white">{v}</p>
                </div>
              ))}
            </div>

            {listing.description && (
              <div className="mb-6">
                <p className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-kixora-gray leading-relaxed">{listing.description}</p>
              </div>
            )}

            {listing.certificate && (
              <div className="bg-kixora-green bg-opacity-5 border border-kixora-green border-opacity-20 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-kixora-green" />
                  <div>
                    <p className="text-sm font-semibold text-kixora-white">Authentication Certificate</p>
                    <p className="text-xs text-kixora-green">50-point inspection passed · Score: {listing.certificate.overallScore}/100</p>
                  </div>
                </div>
              </div>
            )}

            {/* Seller */}
            <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-4 mb-6">
              <p className="text-xs font-bold text-kixora-gray uppercase tracking-wider mb-3">Seller</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-kixora-amber bg-opacity-20 border border-kixora-amber border-opacity-30 flex items-center justify-center text-sm font-bold text-kixora-amber">
                  {listing.seller?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-kixora-white">{listing.seller?.profile?.displayName || listing.seller?.username}</p>
                  <p className="text-xs text-kixora-gray">@{listing.seller?.username}</p>
                </div>
                {listing.seller?.sellerProfile && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-kixora-amber">
                      <Star className="w-3 h-3 fill-kixora-amber" />
                      {listing.seller.sellerProfile.averageRating?.toFixed(1)}
                    </div>
                    <p className="text-xs text-kixora-gray">{listing.seller.sellerProfile.completedSales} sales</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              {listing.listingType !== 'OFFER_ONLY' && (
                <button onClick={() => setShowBuy(true)} className="btn-primary flex-1 py-4">
                  Buy Now — {formatPrice(listing.price)}
                </button>
              )}
              {listing.listingType !== 'AUCTION' && (
                <button onClick={() => setShowOffer(true)} className="btn-secondary flex-1 py-4">
                  Make Offer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Price History */}
        {priceHistory.length > 1 && (
          <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-6 mb-8">
            <h2 className="font-semibold text-kixora-white mb-5">Price History</h2>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={priceHistory.map(d => ({ date: new Date(d.recordedAt).toLocaleDateString(), price: Number(d.price) }))}>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1E1E1B', border: '1px solid #2E2E2B', borderRadius: 8, color: '#F5F4F0' }} formatter={v => [`$${v}`, 'Price']} />
                <Area type="monotone" dataKey="price" stroke="#F5A623" strokeWidth={2} fill="url(#pg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div>
            <h2 className="font-display text-2xl text-kixora-white tracking-wide mb-5">SIMILAR LISTINGS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />

      {/* Buy modal */}
      {showBuy && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4" onClick={() => setShowBuy(false)}>
          <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-kixora-white">Confirm Purchase</h2>
              <button onClick={() => setShowBuy(false)}><X className="w-5 h-5 text-kixora-gray" /></button>
            </div>
            <div className="bg-kixora-surface2 rounded-xl p-4 mb-5">
              <p className="text-sm font-medium text-kixora-white">{listing.title}</p>
              <p className="text-xs text-kixora-gray mt-0.5">Size US {listing.size} · {getConditionLabel(listing.condition)}</p>
              <div className="flex justify-between mt-3 pt-3 border-t border-kixora-border text-sm">
                <span className="text-kixora-gray">Item</span><span className="text-kixora-white">{formatPrice(listing.price)}</span>
              </div>
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-kixora-gray">Shipping</span><span className="text-kixora-white">{listing.freeShipping ? 'Free' : formatPrice(listing.shippingCost)}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-kixora-border font-semibold">
                <span className="text-kixora-white">Total</span>
                <span className="text-kixora-amber text-lg">{formatPrice(Number(listing.price) + (listing.freeShipping ? 0 : Number(listing.shippingCost)))}</span>
              </div>
            </div>
            <p className="text-xs text-kixora-gray mb-4">Payment held in escrow until you confirm delivery. Auth guaranteed.</p>
            <button onClick={handleBuyNow} disabled={buying} className="btn-primary w-full py-3.5">
              {buying ? 'Processing...' : `Confirm Purchase`}
            </button>
          </div>
        </div>
      )}

      {/* Offer modal */}
      {showOffer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4" onClick={() => setShowOffer(false)}>
          <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-kixora-white">Make an Offer</h2>
              <button onClick={() => setShowOffer(false)}><X className="w-5 h-5 text-kixora-gray" /></button>
            </div>
            <div className="bg-kixora-surface2 rounded-xl p-4 mb-5">
              <p className="text-sm font-medium text-kixora-white">{listing.title}</p>
              <p className="text-xs text-kixora-gray mt-0.5">Listed at {formatPrice(listing.price)}</p>
              {listing.minimumOffer && <p className="text-xs text-kixora-amber mt-1">Min offer: {formatPrice(listing.minimumOffer)}</p>}
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-kixora-gray uppercase tracking-wider mb-1.5">Your Offer</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-kixora-surface2 border border-kixora-border rounded-xl text-kixora-gray text-sm">$</span>
                  <input type="number" className="input-dark flex-1" placeholder={listing.price} value={offerAmount} onChange={e => setOfferAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-kixora-gray uppercase tracking-wider mb-1.5">Message (optional)</label>
                <textarea rows={2} className="input-dark resize-none text-sm w-full" placeholder="Hi, I'm interested..."
                  value={offerMsg} onChange={e => setOfferMsg(e.target.value)} />
              </div>
            </div>
            <button onClick={handleOffer} disabled={offering || !offerAmount} className="btn-primary w-full py-3.5">
              {offering ? 'Sending...' : 'Send Offer'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
