'use client';

import { useCallback, useEffect, useState } from 'react';

const DAILY_LIMIT = 10;
const STORAGE_KEY = 'swethank_chat_quota';

interface QuotaStore {
  date: string;
  count: number;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function readStore(): QuotaStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuotaStore;
      if (parsed.date === todayISO()) return parsed;
    }
  } catch {}
  return { date: todayISO(), count: 0 };
}

export function useMessageQuota() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readStore().count);
  }, []);

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayISO(), count: next }));
      } catch {}
      return next;
    });
  }, []);

  // Called with the X-RateLimit-Remaining header value from the API response.
  // Overwrites the local counter with the authoritative Redis value so that
  // clearing localStorage (or opening in a new browser) self-corrects after
  // the first successful message — without any extra API calls.
  const syncFromServer = useCallback((serverRemaining: number) => {
    const serverCount = DAILY_LIMIT - serverRemaining;
    setCount(serverCount);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayISO(), count: serverCount }));
    } catch {}
  }, []);

  const remaining = Math.max(0, DAILY_LIMIT - count);

  return { remaining, total: DAILY_LIMIT, increment, syncFromServer };
}
