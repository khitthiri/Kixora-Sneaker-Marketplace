import Link from 'next/link';

const LINKS = {
  Marketplace: ['Browse All', 'Upcoming Drops', 'Live Auctions', 'Sell Your Pair'],
  Community: ['Feed', 'Groups', 'Leaderboards', 'Authenticators'],
  Support: ['Help Center', 'Authentication', 'Shipping Info', 'Contact Us'],
};

export function Footer() {
  return (
    <footer className="bg-kixora-black border-t border-kixora-border mt-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-3xl tracking-widest text-kixora-amber">KIX<span className="text-kixora-white">ORA</span></span>
            <p className="text-sm text-kixora-gray mt-4 leading-relaxed max-w-xs">
              The world's most trusted sneaker marketplace. Built for collectors, sellers, and buyers who demand authenticity.
            </p>
          </div>
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-bold text-kixora-white uppercase tracking-widest mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l}><Link href="/marketplace" className="text-sm text-kixora-gray hover:text-kixora-amber transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-kixora-border">
          <p className="text-xs text-kixora-gray">© {new Date().getFullYear()} KIXORA · Collect. Verify. Trade.</p>
        </div>
      </div>
    </footer>
  );
}
