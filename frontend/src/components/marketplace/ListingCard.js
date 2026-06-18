import Link from 'next/link';
import { formatPrice, getConditionLabel } from '../../lib/api';
import { ShieldCheck } from 'lucide-react';

export function ListingCard({ listing }) {
  const image = listing.images?.[0]?.url || listing.imageUrls?.[0];
  const brand = listing.product?.brand?.name || listing.brand?.name;
  const condLabel = getConditionLabel(listing.condition);

  return (
    <Link href={`/product/${listing.id}`} className="card-product block group">
      <div className="aspect-square bg-kixora-surface2 flex items-center justify-center relative overflow-hidden">
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">👟</span>
        )}
        {listing.isAuthenticated && (
          <div className="absolute bottom-2 left-2 auth-badge flex items-center gap-1 text-[9px]">
            <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
          </div>
        )}
      </div>
      <div className="p-4 bg-kixora-surface">
        {brand && <p className="text-[10px] font-bold text-kixora-amber uppercase tracking-wider mb-1">{brand}</p>}
        <p className="text-sm font-semibold text-kixora-white mb-3 leading-snug line-clamp-2">{listing.title}</p>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl text-kixora-white">{formatPrice(listing.price)}</span>
          <span className="text-xs bg-kixora-surface2 border border-kixora-border text-kixora-gray px-2 py-0.5 rounded font-medium">{condLabel}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-kixora-border">
          <span className="text-xs text-kixora-gray">@{listing.seller?.username || 'seller'}</span>
          <span className="text-xs text-kixora-amber font-semibold">
            {listing._count?.offers > 0 ? `${listing._count.offers} offers` : listing.listingType === 'AUCTION' ? 'Auction' : 'Buy now'}
          </span>
        </div>
      </div>
    </Link>
  );
}
