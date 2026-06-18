'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, Menu, X, ShoppingBag, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => { const { data } = await api.get('/notifications'); return data.data.unreadCount; },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/drops', label: 'Drops' },
    { href: '/auctions', label: 'Auctions' },
    { href: '/community', label: 'Community' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-kixora-black border-b border-kixora-border backdrop-blur-sm bg-opacity-95">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-display text-2xl tracking-widest text-kixora-amber flex-shrink-0">
            KIX<span className="text-kixora-white">ORA</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-kixora-gray hover:text-kixora-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)} className="p-2 text-kixora-gray hover:text-kixora-white transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="relative p-2 text-kixora-gray hover:text-kixora-white transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifData > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-kixora-amber text-kixora-black text-[9px] font-bold rounded-full flex items-center justify-center">
                      {notifData > 9 ? '9+' : notifData}
                    </span>
                  )}
                </Link>

                {/* Sell button */}
                <Link href="/seller" className="hidden sm:flex btn-primary text-sm py-2 px-4">
                  Sell
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-9 h-9 rounded-full bg-kixora-amber bg-opacity-20 border border-kixora-amber border-opacity-30 flex items-center justify-center text-sm font-bold text-kixora-amber">
                    {user.profile?.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-12 w-52 bg-kixora-surface border border-kixora-border rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                        <div className="px-4 py-2 border-b border-kixora-border mb-1">
                          <p className="text-sm font-semibold text-kixora-white truncate">{user.profile?.displayName || user.username}</p>
                          <p className="text-xs text-kixora-gray truncate">@{user.username}</p>
                        </div>
                        {[
                          { href: `/profile/${user.username}`, icon: <User className="w-4 h-4" />, label: 'My Profile' },
                          { href: '/orders', icon: <ShoppingBag className="w-4 h-4" />, label: 'My Orders' },
                          { href: '/vault', icon: null, label: 'My Vault' },
                          { href: '/seller', icon: null, label: 'Seller Dashboard' },
                          { href: '/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-kixora-gray hover:text-kixora-white hover:bg-kixora-surface2 transition-colors">
                            {item.icon}
                            {item.label}
                          </Link>
                        ))}
                        <div className="border-t border-kixora-border mt-1 pt-1">
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-kixora-red hover:bg-kixora-surface2 transition-colors w-full text-left">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-kixora-gray hover:text-kixora-white transition-colors hidden sm:block">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-kixora-gray hover:text-kixora-white">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-kixora-border bg-kixora-surface py-4 px-4 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-kixora-gray hover:text-kixora-white transition-colors">
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 flex gap-2">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-ghost text-sm py-2 px-4 flex-1 text-center">Sign In</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2 px-4 flex-1 text-center">Join Free</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-start justify-center pt-20 px-4" onClick={() => setSearchOpen(false)}>
          <div className="bg-kixora-surface border border-kixora-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-4 border-b border-kixora-border">
              <Search className="w-5 h-5 text-kixora-gray flex-shrink-0" />
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="flex-1 bg-transparent text-kixora-white text-base outline-none placeholder-kixora-gray"
                placeholder="Search sneakers, brands, sizes..." />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-kixora-gray hover:text-kixora-white">
                <X className="w-5 h-5" />
              </button>
            </form>
            <div className="p-4">
              <p className="text-xs text-kixora-gray uppercase tracking-wider mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Air Jordan 1 Chicago', 'Yeezy 350 Zebra', 'Nike Dunk Low Panda', 'Adidas Samba OG', 'New Balance 990'].map(term => (
                  <button key={term} onClick={() => { setSearchQ(term); router.push(`/marketplace?search=${encodeURIComponent(term)}`); setSearchOpen(false); }}
                    className="px-3 py-1.5 bg-kixora-surface2 border border-kixora-border text-sm text-kixora-gray hover:text-kixora-white hover:border-kixora-amber hover:border-opacity-50 rounded-lg transition-all">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
