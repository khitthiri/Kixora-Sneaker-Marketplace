'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

let addToast;

export const toast = {
  success: (title, description) => addToast?.({ title, description, type: 'success' }),
  error: (title, description) => addToast?.({ title, description, type: 'error' }),
  info: (title, description) => addToast?.({ title, description, type: 'info' }),
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToast = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { ...t, id }]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    };
    return () => { addToast = null; };
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(x => x.id !== id)), []);

  const colors = { success: 'border-kixora-green', error: 'border-kixora-red', info: 'border-kixora-amber' };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div key={t.id} className={`bg-kixora-surface border ${colors[t.type] || 'border-kixora-border'} rounded-xl p-4 flex gap-3 shadow-lg animate-in slide-in-from-right`}>
          <div className="flex-1">
            <p className="font-semibold text-kixora-white text-sm">{t.title}</p>
            {t.description && <p className="text-kixora-gray text-xs mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => remove(t.id)} className="text-kixora-gray hover:text-kixora-white mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
