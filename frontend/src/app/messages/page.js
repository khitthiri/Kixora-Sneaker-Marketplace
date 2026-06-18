'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/layout/Navbar';
import { useAuthStore } from '../../store/authStore';
import { timeAgo, initials } from '../../lib/api';
import api from '../../lib/api';
import { Send, Search, Lock, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';

function Avatar({ user, size = 'md', online }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-kixora-amber bg-opacity-20 border border-kixora-amber border-opacity-30 flex items-center justify-center font-bold text-kixora-amber overflow-hidden`}>
        {user?.avatar
          ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          : initials(user?.displayName || user?.username || 'U')}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-kixora-green border-2 border-kixora-black rounded-full" />
      )}
    </div>
  );
}

function ConversationItem({ conv, active, onClick }) {
  const { user } = useAuthStore();
  const other = conv.participants?.find(p => p.id !== user?.id) || conv.otherUser;
  const unread = conv.unreadCount || 0;

  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-kixora-surface2 ${active ? 'bg-kixora-surface2 border-l-2 border-kixora-amber' : 'border-l-2 border-transparent'}`}>
      <Avatar user={other} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-sm font-semibold text-kixora-white truncate">
            {other?.displayName || other?.username || 'User'}
          </span>
          <span className="text-[10px] text-kixora-gray flex-shrink-0 ml-2">
            {timeAgo(conv.lastMessage?.createdAt || conv.updatedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-kixora-gray truncate max-w-[160px]">
            {conv.lastMessage?.content || 'No messages yet'}
          </p>
          {unread > 0 && (
            <span className="w-5 h-5 bg-kixora-amber text-kixora-black text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
        {conv.listing && (
          <p className="text-[10px] text-kixora-amber mt-0.5 truncate">re: {conv.listing.title || 'Listing'}</p>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMe }) {
  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-kixora-amber text-kixora-black rounded-br-md'
            : 'bg-kixora-surface2 border border-kixora-border text-kixora-white rounded-bl-md'
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-kixora-gray mt-1 px-1">{timeAgo(msg.createdAt)}</span>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const qc = useQueryClient();

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations');
      return data.data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: msgsData } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${activeConvId}`);
      return data.data;
    },
    enabled: !!activeConvId,
  });

  useEffect(() => {
    if (msgsData?.messages) setLocalMessages(msgsData.messages);
  }, [msgsData]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages]);

  // Socket.io for real-time
  useEffect(() => {
    if (!user || !activeConvId) return;
    const token = localStorage.getItem('accessToken');
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
    });
    socketRef.current = socket;
    socket.emit('join_conversation', activeConvId);
    socket.on('new_message', (msg) => {
      setLocalMessages(prev => [...prev, msg]);
    });
    return () => { socket.emit('leave_conversation', activeConvId); socket.disconnect(); };
  }, [user, activeConvId]);

  const sendMutation = useMutation({
    mutationFn: (content) => api.post(`/messages/${activeConvId}/send`, { content }),
    onSuccess: (res) => {
      const msg = res.data.data.message;
      setLocalMessages(prev => [...prev, msg]);
      setInput('');
      qc.invalidateQueries(['conversations']);
    },
  });

  const handleSend = () => {
    if (!input.trim() || !activeConvId) return;
    sendMutation.mutate(input.trim());
  };

  const conversations = convsData?.conversations || [];
  const filtered = conversations.filter(c => {
    const other = c.participants?.find(p => p.id !== user?.id) || c.otherUser;
    return (other?.username || '').toLowerCase().includes(search.toLowerCase());
  });

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.participants?.find(p => p.id !== user?.id) || activeConv?.otherUser;

  if (!user) {
    return (
      <main className="min-h-screen bg-kixora-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-12 h-12 text-kixora-amber mb-4" />
          <h2 className="font-display text-4xl text-kixora-white mb-3 tracking-wide">MESSAGES</h2>
          <p className="text-kixora-gray mb-6">Sign in to chat with buyers and sellers.</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kixora-black flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6 gap-4 min-h-0" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-kixora-surface border border-kixora-border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-kixora-border">
            <h2 className="font-display text-xl text-kixora-white tracking-wide mb-3">MESSAGES</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kixora-gray" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="input-dark pl-9 text-sm py-2"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-8 h-8 text-kixora-gray mx-auto mb-2" />
                <p className="text-sm text-kixora-gray">No conversations yet</p>
              </div>
            ) : (
              filtered.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  active={conv.id === activeConvId}
                  onClick={() => setActiveConvId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-kixora-surface border border-kixora-border rounded-2xl flex flex-col overflow-hidden">
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-kixora-amber bg-opacity-10 border border-kixora-amber border-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-kixora-amber" />
              </div>
              <p className="text-kixora-white font-semibold mb-2">Select a conversation</p>
              <p className="text-kixora-gray text-sm">Choose a conversation from the left to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-kixora-border flex items-center gap-3">
                <Avatar user={otherUser} size="md" online />
                <div>
                  <p className="font-semibold text-kixora-white text-sm">{otherUser?.displayName || otherUser?.username}</p>
                  {activeConv?.listing && (
                    <p className="text-xs text-kixora-amber">re: {activeConv.listing.title}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {localMessages.map((msg, i) => (
                  <MessageBubble key={msg.id || i} msg={msg} isMe={msg.senderId === user.id || msg.sender?.id === user.id} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-kixora-border flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="input-dark flex-1 py-2.5"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  className="btn-primary py-2.5 px-4 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
