'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ListingCard } from '../../components/marketplace/ListingCard';
import api from '../../lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

const BRANDS = ['Jordan', 'Nike', 'Adidas', 'New Balance', 'Vans', 'Converse', 'Salehe Bembury'];
const CONDITIONS = [
  { value: 'DEADSTOCK', label: 'Deadstock (DS)' },
  { value: 'VERY_NEAR_DS', label: 'VNDS' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
];
const SIZES = ['6', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'];
const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-kixora-border pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <span className="text-xs font-bold text-kixora-white uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-kixora-gray" /> : <ChevronDown className="w-4 h-4 text-kixora-gray" />}
      </button>
      {open && children}
    </div>
  );
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    condition: searchParams.get('condition') || '',
    size: searchParams.get('size') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    authenticated: searchParams.get('authenticated') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'newest' && k !== 'page') params.set(k, v); });
    if (filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', filters.page);
    const query = params.toString();
    router.replace(`/marketplace${query ? '?' + query : ''}`, { scroll: false });
  }, [filters]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const clearFilters = () => {
    setFilters({ search: '', brand: '', condition: '', size: '', minPrice: '', maxPrice: '', sort: 'newest', authenticated: '', page: 1 });
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.brand) params.brand = filters.brand.toLowerCase().replace(' ', '-');
      if (filters.condition) params.condition = filters.condition;
      if (filters.size) params.size = filters.size;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort) params.sort = filters.sort;
      if (filters.authenticated) params.authenticated = filters.authenticated;
      params.page = filters.page;
      params.limit = 24;
      const { data } = await api.get('/listings', { params });
      return data.data;
    },
    keepPreviousData: true,
  });

  const listings = data?.listings || [];
  const pagination = data?.pagination || {};

  const activeFilterCount = [filters.brand, filters.condition, filters.size, filters.minPrice, filters.maxPrice, filters.authenticated].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-0">
      {/* Sort */}
      <FilterSection title="Sort By">
        <select className="input-dark text-sm" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </FilterSection>

      {/* Brand */}
      <FilterSection title="Brand">
        <div className="space-y-2">
          <button onClick={() => setFilter('brand', '')}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-all w-full text-left ${!filters.brand ? 'border-kixora-amber text-kixora-amber' : 'border-kixora-border text-kixora-gray hover:text-kixora-white'}`}>
            All Brands
          </button>
          {BRANDS.map(b => (
            <button key={b} onClick={() => setFilter('brand', filters.brand === b ? '' : b)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all w-full text-left ${filters.brand === b ? 'border-kixora-amber text-kixora-amber bg-kixora-amber bg-opacity-5' : 'border-kixora-border text-kixora-gray hover:text-kixora-white hover:border-kixora-gray'}`}>
              {b}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Condition">
        <div className="space-y-2">
          {CONDITIONS.map(c => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="accent-kixora-amber w-4 h-4"
                checked={filters.condition === c.value}
                onChange={e => setFilter('condition', e.target.checked ? c.value : '')} />
              <span className={`text-sm transition-colors ${filters.condition === c.value ? 'text-kixora-white font-medium' : 'text-kixora-gray group-hover:text-kixora-white'}`}>{c.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size (US)">
        <div className="grid grid-cols-4 gap-1.5">
          {SIZES.map(s => (
            <button key={s} onClick={() => setFilter('size', filters.size === s ? '' : s)}
              className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${filters.size === s ? 'bg-kixora-amber border-kixora-amber text-kixora-black' : 'border-kixora-border text-kixora-gray hover:border-kixora-amber hover:border-opacity-50 hover:text-kixora-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range">
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min" className="input-dark text-sm" value={filters.minPrice}
            onChange={e => setFilter('minPrice', e.target.value)} />
          <span className="text-kixora-gray">–</span>
          <input type="number" placeholder="Max" className="input-dark text-sm" value={filters.maxPrice}
            onChange={e => setFilter('maxPrice', e.target.value)} />
        </div>
      </FilterSection>

      {/* Toggles */}
      <FilterSection title="Other" defaultOpen={false}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-kixora-gray">Authenticated Only</span>
          <input type="checkbox" className="accent-kixora-amber w-4 h-4"
            checked={filters.authenticated === 'true'}
            onChange={e => setFilter('authenticated', e.target.checked ? 'true' : '')} />
        </label>
      </FilterSection>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="w-full text-sm text-kixora-gray border border-kixora-border rounded-xl py-2.5 hover:text-kixora-white hover:border-kixora-gray transition-all">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-label">Shop</p>
            <h1 className="section-title">MARKETPLACE</h1>
            {filters.search && (
              <p className="text-kixora-gray text-sm mt-1">
                Results for "<span className="text-kixora-white">{filters.search}</span>"
                <button onClick={() => setFilter('search', '')} className="ml-2 text-kixora-amber hover:underline">Clear</button>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={`lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${filtersOpen ? 'border-kixora-amber text-kixora-amber' : 'border-kixora-border text-kixora-gray hover:text-kixora-white'}`}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && <span className="bg-kixora-amber text-kixora-black w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.brand && (
              <span className="flex items-center gap-1.5 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25 text-kixora-amber text-xs font-semibold px-3 py-1.5 rounded-full">
                {filters.brand}
                <button onClick={() => setFilter('brand', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.condition && (
              <span className="flex items-center gap-1.5 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25 text-kixora-amber text-xs font-semibold px-3 py-1.5 rounded-full">
                {CONDITIONS.find(c => c.value === filters.condition)?.label}
                <button onClick={() => setFilter('condition', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.size && (
              <span className="flex items-center gap-1.5 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25 text-kixora-amber text-xs font-semibold px-3 py-1.5 rounded-full">
                US {filters.size}
                <button onClick={() => setFilter('size', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.authenticated && (
              <span className="flex items-center gap-1.5 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-25 text-kixora-amber text-xs font-semibold px-3 py-1.5 rounded-full">
                Authenticated Only
                <button onClick={() => setFilter('authenticated', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
            <FilterPanel />
          </aside>

          {/* Mobile filters drawer */}
          {filtersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setFiltersOpen(false)} />
              <div className="relative w-72 bg-kixora-surface border-r border-kixora-border h-full overflow-y-auto p-5 ml-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-kixora-white">Filters</h3>
                  <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5 text-kixora-gray" /></button>
                </div>
                <FilterPanel />
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results count + loading */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-kixora-gray">
                {isLoading ? 'Loading...' : `${pagination.total || listings.length} results`}
                {isFetching && !isLoading && <span className="ml-2 text-kixora-amber">Updating...</span>}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <div className="aspect-square skeleton" />
                    <div className="p-4 space-y-2 bg-kixora-surface border border-kixora-border border-t-0 rounded-b-2xl">
                      <div className="h-3 skeleton rounded w-1/3" />
                      <div className="h-4 skeleton rounded w-3/4" />
                      <div className="h-6 skeleton rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-24 border border-kixora-border rounded-2xl">
                <p className="text-5xl mb-4">👟</p>
                <p className="text-kixora-white font-semibold text-lg mb-2">No listings found</p>
                <p className="text-kixora-gray text-sm mb-5">Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="btn-secondary text-sm py-2 px-6">Clear All Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button onClick={() => setFilter('page', filters.page - 1)} disabled={filters.page <= 1}
                      className="btn-ghost text-sm py-2 px-4 disabled:opacity-30">← Prev</button>
                    <span className="text-sm text-kixora-gray px-4">Page {filters.page} of {pagination.pages}</span>
                    <button onClick={() => setFilter('page', filters.page + 1)} disabled={filters.page >= pagination.pages}
                      className="btn-ghost text-sm py-2 px-4 disabled:opacity-30">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
