'use client';

import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  getDoc,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  refresh: () => void;      // Manually invalidate cache and re-fetch
}

export interface UseDocOptions {
  realtime?: boolean;
  cacheTtl?: number; // Cache duration in milliseconds (default: 15 minutes for quota saving)
  suppressGlobalError?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

// Global in-memory cache for document references
const globalDocCache = new Map<string, CacheEntry>();
// Default TTL dinaikkan ke 15 menit (900.000 ms) untuk menghemat kuota Read Firestore secara drastis
const DEFAULT_TTL_MS = 15 * 60 * 1000;
const SESSION_CACHE_PREFIX = 'fs_doc_cache_v1:';

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

function readSessionDocCache(docPath: string, ttl: number): CacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + docPath);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.timestamp < ttl) {
      return {
        data: reviveTimestamps(parsed.data),
        timestamp: parsed.timestamp,
      };
    }
    sessionStorage.removeItem(SESSION_CACHE_PREFIX + docPath);
  } catch {
    // Ignore storage errors
  }
  return null;
}

function writeSessionDocCache(docPath: string, data: any, timestamp: number) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      SESSION_CACHE_PREFIX + docPath,
      JSON.stringify({ data, timestamp })
    );
  } catch {
    // Ignore quota exceeded on sessionStorage
  }
}

export function invalidateDocCache(docPathPrefix?: string) {
  if (!docPathPrefix) {
    globalDocCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith(SESSION_CACHE_PREFIX)) sessionStorage.removeItem(k);
        });
      } catch {}
    }
    return;
  }
  for (const key of Array.from(globalDocCache.keys())) {
    if (key.startsWith(docPathPrefix)) {
      globalDocCache.delete(key);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith(SESSION_CACHE_PREFIX + docPathPrefix)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {}
  }
}

/**
 * React hook to retrieve a single Firestore document.
 * Fetches once with 2-tier caching (Memory + SessionStorage) by default to conserve read quota.
 * Opt-in to real-time sync with `{ realtime: true }`.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedDocRef using useMemoFirebase.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
  options?: UseDocOptions
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const isRealtime = !!options?.realtime;
  const cacheTtl = options?.cacheTtl ?? DEFAULT_TTL_MS;

  const refresh = () => {
    if (memoizedDocRef) {
      invalidateDocCache(memoizedDocRef.path);
    }
    setRefreshTick((t) => t + 1);
  };

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const docPath = memoizedDocRef.path;

    if (isRealtime) {
      setIsLoading(true);
      setError(null);

      const unsubscribe = onSnapshot(
        memoizedDocRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            const val = { ...(snapshot.data() as T), id: snapshot.id };
            setData(val);
            globalDocCache.set(docPath, { data: val, timestamp: Date.now() });
            writeSessionDocCache(docPath, val, Date.now());
          } else {
            setData(null);
          }
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: docPath,
          });

          setError(contextualError);
          setData(null);
          setIsLoading(false);
          if (!options?.suppressGlobalError) {
            errorEmitter.emit('permission-error', contextualError);
          }
        }
      );

      return () => unsubscribe();
    } else {
      const now = Date.now();
      let cached = globalDocCache.get(docPath);

      // Jika belum ada di RAM (misal habis refresh halaman), cek SessionStorage (0 Read Firestore!)
      if (!cached || now - cached.timestamp >= cacheTtl) {
        const sessionCached = readSessionDocCache(docPath, cacheTtl);
        if (sessionCached) {
          globalDocCache.set(docPath, sessionCached);
          cached = sessionCached;
        }
      }

      if (cached && now - cached.timestamp < cacheTtl) {
        if (cached.promise) {
          setIsLoading(true);
          setError(null);
          cached.promise
            .then((res) => {
              setData(res);
              setIsLoading(false);
            })
            .catch((err) => {
              setError(err);
              setIsLoading(false);
            });
        } else {
          setData(cached.data);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      // Deduplicate simultaneous requests for the same path
      const fetchPromise = getDoc(memoizedDocRef)
        .then((snapshot) => {
          let result: StateDataType = null;
          if (snapshot.exists()) {
            result = { ...(snapshot.data() as T), id: snapshot.id };
          }
          const ts = Date.now();
          globalDocCache.set(docPath, {
            data: result,
            timestamp: ts,
          });
          writeSessionDocCache(docPath, result, ts);
          return result;
        })
        .catch((err) => {
          globalDocCache.delete(docPath);
          throw err;
        });

      globalDocCache.set(docPath, {
        data: null,
        timestamp: now,
        promise: fetchPromise,
      });

      fetchPromise
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: docPath,
          });
          setError(contextualError);
          setData(null);
          setIsLoading(false);
          if (!options?.suppressGlobalError) {
            errorEmitter.emit('permission-error', contextualError);
          }
        });
    }
  }, [memoizedDocRef, isRealtime, cacheTtl, refreshTick]);

  return { data, isLoading, error, refresh };
}
