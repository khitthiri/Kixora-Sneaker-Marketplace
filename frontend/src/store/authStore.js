'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setToken: (token) => {
        if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
        set({ accessToken: token });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user });
        } catch {
          set({ user: null });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          get().setToken(data.data.accessToken);
          set({ user: data.data.user, isLoading: false });
          return data.data.user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (form) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', form);
          get().setToken(data.data.accessToken);
          set({ user: data.data.user, isLoading: false });
          return data.data.user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      initialize: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          set({ accessToken: token });
          await get().fetchMe();
        }
      },
    }),
    { name: 'kixora-auth', partialize: (s) => ({ accessToken: s.accessToken }) }
  )
);
