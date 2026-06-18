'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/authStore';
import { timeAgo, initials } from '../../lib/api';
import api from '../../lib/api';
import { Heart, MessageCircle, Share2, Image, Send, TrendingUp, Users, Award } from 'lucide-react';

const CATEGORIES = ['All', 'General', 'Legit Check', 'Collection', 'Market Talk', 'Trade'];

function Avatar({ user, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-kixora-amber bg-opacity-20 border border-kixora-amber border-opacity-30 flex items-center justify-center font-bold text-kixora-amber flex-shrink-0`}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
        : initials(user?.displayName || user?.username || 'U')}
    </div>
  );
}

function PostCard({ post, onLike }) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || post._count?.likes || 0);

  const handleLike = () => {
    if (!user) return;
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
    onLike?.(post.id);
  };

  return (
    <div className="card-dark p-5 hover:border-kixora-amber hover:border-opacity-20 transition-all">
      {/* Author */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar user={post.author || post.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-kixora-white">
              {post.author?.displayName || post.author?.username || post.user?.username || 'Anonymous'}
            </span>
            {post.author?.isVerifiedSeller && (
              <span className="auth-badge text-[9px]">VERIFIED</span>
            )}
            {post.category && (
              <span className="text-xs bg-kixora-surface2 border border-kixora-border text-kixora-gray px-2 py-0.5 rounded-full">
                {post.category}
              </span>
            )}
          </div>
          <p className="text-xs text-kixora-gray">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      {post.title && <h3 className="font-semibold text-kixora-white mb-2">{post.title}</h3>}
      <p className="text-sm text-kixora-gray leading-relaxed mb-4">{post.content}</p>

      {/* Image */}
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-4 aspect-video bg-kixora-surface2">
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs text-kixora-amber bg-kixora-amber bg-opacity-10 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-kixora-border">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-kixora-red' : 'text-kixora-gray hover:text-kixora-white'}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          {likeCount}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-kixora-gray hover:text-kixora-white transition-colors">
          <MessageCircle className="w-4 h-4" />
          {post._count?.comments || post.comments || 0}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-kixora-gray hover:text-kixora-white transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CreatePost({ onPost }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onPost({ content, category });
      setContent('');
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-dark p-5 mb-6">
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="flex-1">
          <textarea
            placeholder="Share your heat... drops, cops, legit checks?"
            className="input-dark resize-none text-sm"
            rows={expanded ? 4 : 2}
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
          />
          {expanded && (
            <div className="flex items-center gap-3 mt-3">
              <select className="input-dark text-sm py-2 w-36"
                value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" /> Photo
              </button>
              <button onClick={handleSubmit} disabled={!content.trim() || loading}
                className="btn-primary text-sm py-2 px-5 ml-auto flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['community', activeCategory],
    queryFn: async () => {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      const { data } = await api.get('/community', { params });
      return data.data;
    },
  });

  const postMutation = useMutation({
    mutationFn: (body) => api.post('/community', body),
    onSuccess: () => qc.invalidateQueries(['community']),
  });

  const likeMutation = useMutation({
    mutationFn: (id) => api.post(`/community/${id}/like`),
  });

  const posts = data?.posts || [];

  return (
    <main className="min-h-screen bg-kixora-black">
      <Navbar />

      {/* Hero */}
      <section className="bg-kixora-surface border-b border-kixora-border py-12">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <p className="section-label">Community</p>
          <h1 className="section-title mb-3">THE FEED</h1>
          <p className="text-kixora-gray max-w-xl">Connect with collectors. Share cops, drops, and knowledge.</p>
        </div>
      </section>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Main feed */}
          <div className="flex-1 min-w-0">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border whitespace-nowrap transition-all flex-shrink-0 ${
                    activeCategory === c
                      ? 'bg-kixora-amber border-kixora-amber text-kixora-black'
                      : 'border-kixora-border text-kixora-gray hover:text-kixora-white hover:border-kixora-gray'
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            <CreatePost onPost={(body) => postMutation.mutateAsync(body)} />

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card-dark p-5">
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 skeleton rounded w-32" />
                        <div className="h-3 skeleton rounded w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 skeleton rounded w-full" />
                      <div className="h-3 skeleton rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 border border-kixora-border rounded-2xl">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-kixora-white font-semibold mb-2">Nothing here yet</p>
                <p className="text-kixora-gray text-sm">Be the first to post in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onLike={(id) => likeMutation.mutate(id)} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            {/* Trending */}
            <div className="card-dark p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-kixora-amber" />
                <span className="text-xs font-bold text-kixora-white uppercase tracking-wider">Trending Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['AJ1', 'Yeezy', 'Dunk', 'LegitCheck', 'Grail', 'NewBalance', 'CollectorLife'].map(tag => (
                  <button key={tag} className="text-xs text-kixora-amber bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 px-2.5 py-1 rounded-full hover:bg-opacity-20 transition-all">
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Top collectors */}
            <div className="card-dark p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-kixora-amber" />
                <span className="text-xs font-bold text-kixora-white uppercase tracking-wider">Top Collectors</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'KixHunter_BKK', pairs: 234, rank: 1 },
                  { name: 'SneakerVault_SG', pairs: 198, rank: 2 },
                  { name: 'RareKicks_TH', pairs: 156, rank: 3 },
                  { name: 'HeatCheck_KL', pairs: 134, rank: 4 },
                ].map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-kixora-gray w-4">#{c.rank}</span>
                    <div className="w-7 h-7 rounded-full bg-kixora-amber bg-opacity-20 flex items-center justify-center text-xs font-bold text-kixora-amber">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-kixora-white truncate">{c.name}</p>
                      <p className="text-[10px] text-kixora-gray">{c.pairs} pairs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community stats */}
            <div className="card-dark p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-kixora-amber" />
                <span className="text-xs font-bold text-kixora-white uppercase tracking-wider">Community</span>
              </div>
              <div className="space-y-3">
                {[['Active Members', '12,847'], ['Posts Today', '384'], ['Legit Checks', '2,109']].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-kixora-gray">{label}</span>
                    <span className="text-xs font-bold text-kixora-white">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
