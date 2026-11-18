'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  getDocs,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  refresh: () => void;      // Manually invalidate cache and re-fetch
}

export interface UseCollectionOptions {
  realtime?: boolean;
  cacheTtl?: number; // Cache duration in milliseconds (default: 10 minutes for quota saving)
  suppressGlobalError?: boolean;
}

/* Internal implementation of Query */
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
    filters?: any[];
    orders?: any[];
    limit?: number;
  };
}

interface CacheEntry {
  data: any[];
  timestamp: number;
  promise?: Promise<any[]>;
}

// Global in-memory cache for query results
const globalCollectionCache = new Map<string, CacheEntry>();
// Default TTL dinaikkan ke 10 menit (600.000 ms) agar perpindahan halaman & refresh tidak menyedot kuota Read
const DEFAULT_TTL_MS = 10 * 60 * 1000;
const SESSION_COL_CACHE_PREFIX = 'fs_col_cache_v1:';

function reviveTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveTimestamps);
  if (
    typeof obj.seconds === 'number' &&
    typeof obj.nanoseconds === 'number' &&
    typeof obj.toDate !== 'function'
  ) {
    return {
      ...obj,
      toDate: () => new Date(obj.seconds * 1000),
      toMillis: () => obj.seconds * 1000,
    };
  }
  const copy: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    copy[k] = reviveTimestamps(v);
  }
  return copy;
}

// Generates a stable unique cache key for collection references and queries
function getQueryCacheKey(queryObj: any): string {
  if (!queryObj) return '';

  if (queryObj.type === 'collection' && 'path' in queryObj) {
    return `col:${(queryObj as CollectionReference).path}`;
  }

  if (queryObj._query) {
    const path = queryObj._query.path?.toString() || '';
    const filters = JSON.stringify(queryObj._query.filters || []);
    const orders = JSON.stringify(queryObj._query.orders || []);
    const limitVal = queryObj._query.limit || '';
    return `query:${path}:${filters}:${orders}:${limitVal}`;
  }

  return String(queryObj);
}

function readSessionColCache(cacheKey: string, ttl: number): CacheEntry | null {
  if (typeof window === 'undefined' || !cacheKey) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_COL_CACHE_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.timestamp < ttl && Array.isArray(parsed.data)) {
      return {
        data: reviveTimestamps(parsed.data),
        timestamp: parsed.timestamp,
      };
    }
    sessionStorage.removeItem(SESSION_COL_CACHE_PREFIX + cacheKey);
  } catch {
    // Ignore storage errors
  }
  return null;
}

function writeSessionColCache(cacheKey: string, data: any[], timestamp: number) {
  if (typeof window === 'undefined' || !cacheKey) return;
  try {
    // Jangan simpan ke sessionStorage jika payload terlalu besar (>150 item) agar tidak memenuhi kuota browser
    if (data.length <= 150) {
      sessionStorage.setItem(
        SESSION_COL_CACHE_PREFIX + cacheKey,
        JSON.stringify({ data, timestamp })
      );
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateCollectionCache(pathKeyword?: string) {
  if (!pathKeyword) {
    globalCollectionCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith(SESSION_COL_CACHE_PREFIX)) sessionStorage.removeItem(k);
        });
      } catch {}
    }
    return;
  }
  for (const key of Array.from(globalCollectionCache.keys())) {
    if (key.includes(pathKeyword)) {
      globalCollectionCache.delete(key);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith(SESSION_COL_CACHE_PREFIX) && k.includes(pathKeyword)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {}
  }
}

/**
 * React hook to retrieve a Firestore collection or query.
 * Fetches once with 2-tier caching (Memory + SessionStorage) by default to conserve read quota.
 * Opt-in to real-time sync with `{ realtime: true }`.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery using useMemoFirebase.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean}) | null | undefined,
  options?: UseCollectionOptions
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const isRealtime = !!options?.realtime;
  const cacheTtl = options?.cacheTtl ?? DEFAULT_TTL_MS;

  const refresh = () => {
    if (memoizedTargetRefOrQuery) {
      const ck = getQueryCacheKey(memoizedTargetRefOrQuery);
      globalCollectionCache.delete(ck);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(SESSION_COL_CACHE_PREFIX + ck);
        } catch {}
      }
    }
    setRefreshTick((t) => t + 1);
  };

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cacheKey = getQueryCacheKey(memoizedTargetRefOrQuery);

    if (isRealtime) {
      // Real-time synchronization mode (onSnapshot)
      setIsLoading(true);
      setError(null);

      const unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: ResultItemType[] = [];
          for (const doc of snapshot.docs) {
            results.push({ ...(doc.data() as T), id: doc.id });
          }
          setData(results);
          setError(null);
          setIsLoading(false);
          const ts = Date.now();
          globalCollectionCache.set(cacheKey, { data: results, timestamp: ts });
          writeSessionColCache(cacheKey, results, ts);
        },
        (err: FirestoreError) => {
          console.error("Firestore onSnapshot error:", err);
          if (err.code === 'permission-denied') {
            const path: string =
              memoizedTargetRefOrQuery.type === 'collection'
                ? (memoizedTargetRefOrQuery as CollectionReference).path
                : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path,
            });

            setError(contextualError);
            if (!options?.suppressGlobalError) {
              errorEmitter.emit('permission-error', contextualError);
            }
          } else {
            setError(err);
          }
          setData(null);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // One-time cached fetch mode
      const now = Date.now();
      let cached = globalCollectionCache.get(cacheKey);

      if (!cached || now - cached.timestamp >= cacheTtl) {
        const sessionCached = readSessionColCache(cacheKey, cacheTtl);
        if (sessionCached) {
          globalCollectionCache.set(cacheKey, sessionCached);
          cached = sessionCached;
        }
      }

      // Check if we have a fresh cache entry
      if (cached && now - cached.timestamp < cacheTtl) {
        if (cached.promise) {
          setIsLoading(true);
          setError(null);
          cached.promise
            .then((res) => {
              setData(res as ResultItemType[]);
              setIsLoading(false);
            })
            .catch((err) => {
              setError(err);
              setIsLoading(false);
            });
        } else {
          setData(cached.data as ResultItemType[]);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      // Deduplicate simultaneous requests for the same query
      const fetchPromise = getDocs(memoizedTargetRefOrQuery)
        .then((snapshot) => {
          const results: ResultItemType[] = [];
          for (const doc of snapshot.docs) {
            results.push({ ...(doc.data() as T), id: doc.id });
          }
          const ts = Date.now();
          globalCollectionCache.set(cacheKey, {
            data: results,
            timestamp: ts,
          });
          writeSessionColCache(cacheKey, results, ts);
          return results;
        })
        .catch((err) => {
          globalCollectionCache.delete(cacheKey);
          throw err;
        });

      // Temporarily store the fetch promise in cache to share it with concurrent hook calls
      globalCollectionCache.set(cacheKey, {
        data: [],
        timestamp: now,
        promise: fetchPromise,
      });

      fetchPromise
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Firestore getDocs error:", err);
          if (err.code === 'permission-denied') {
            const path: string =
              memoizedTargetRefOrQuery.type === 'collection'
                ? (memoizedTargetRefOrQuery as CollectionReference).path
                : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path,
            });

            setError(contextualError);
            if (!options?.suppressGlobalError) {
              errorEmitter.emit('permission-error', contextualError);
            }
          } else {
            setError(err);
          }
          setData(null);
          setIsLoading(false);
        });
    }
  }, [memoizedTargetRefOrQuery, isRealtime, cacheTtl, refreshTick]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error, refresh };
}
