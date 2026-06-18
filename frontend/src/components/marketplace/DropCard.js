import Link from 'next/link';
import { formatPrice } from '../../lib/api';

export function DropCard({ drop }) {
  const isLive = drop.status === 'LIVE';
  return (
    <Link href={`/drops/${drop.id}`} className="card-dark block group cursor-pointer rounded-2xl overflow-hidden hover:border-kixora-amber hover:border-opacity-40">
      <div className="aspect-square bg-kixora-surface2 flex items-center justify-center relative">
        {isLive ? (
          <span className="badge-live absolute top-3 left-3 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="badge-amber absolute top-3 left-3 z-10">Soon</span>
        )}
        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">👟</span>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-bold text-kixora-amber uppercase tracking-wider mb-1">{drop.product?.brand?.name}</p>
        <p className="text-sm font-semibold text-kixora-white mb-2 leading-snug line-clamp-2">{drop.title}</p>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl text-kixora-white">{formatPrice(drop.retailPrice)}</span>
          {drop.isRaffle && <span className="badge-amber text-[9px]">Raffle</span>}
        </div>
      </div>
    </Link>
  );
}
