const Redis = require('ioredis');

let redis;

try {
  redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  redis.on('error', (err) => console.warn('Redis error (non-fatal):', err.message));
} catch (err) {
  console.warn('Redis not available, using memory fallback');
  // Simple in-memory fallback for development
  const store = new Map();
  redis = {
    get: async (k) => store.get(k) || null,
    set: async (k, v) => { store.set(k, v); return 'OK'; },
    setex: async (k, ttl, v) => { store.set(k, v); setTimeout(() => store.delete(k), ttl * 1000); return 'OK'; },
    del: async (k) => { store.delete(k); return 1; },
    on: () => {},
  };
}

module.exports = { redis };
