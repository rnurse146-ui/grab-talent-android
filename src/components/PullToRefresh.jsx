import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

/**
 * A native-style pull-to-refresh scroll container.
 * - Acts as the scrollable area (overflow-y-auto) for its children.
 * - On touch, pulling down at scrollTop===0 reveals an indicator; releasing
 *   past the threshold triggers a refresh.
 * - Refetches React Query keys (if provided) and/or calls onRefresh.
 */
export default function PullToRefresh({
  onRefresh,
  queryKeys,
  children,
  className,
  threshold = 70,
  maxPull = 120,
}) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const setPullBoth = (v) => { pullRef.current = v; setPull(v); };

  const doRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    setPullBoth(48);
    try {
      if (queryKeys && queryKeys.length) {
        await Promise.all(
          queryKeys.map((key) => queryClient.refetchQueries({ queryKey: key }))
        );
      }
      if (onRefresh) await onRefresh();
    } catch (e) {
      // ignore — keep existing data
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      setPullBoth(0);
    }
  }, [onRefresh, queryKeys, queryClient]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (el.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      } else {
        pullingRef.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        e.preventDefault();
        setPullBoth(Math.min(dy * 0.5, maxPull));
      } else if (pullRef.current > 0) {
        setPullBoth(0);
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (pullRef.current >= threshold) {
        doRefresh();
      } else {
        setPullBoth(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [threshold, maxPull, doRefresh]);

  const progress = Math.min(pull / threshold, 1);

  return (
    <div ref={containerRef} className={cn('relative overflow-y-auto overscroll-y-none', className)}>
      <div
        className="flex items-end justify-center overflow-hidden pointer-events-none"
        style={{ height: pull }}
      >
        <div className="mb-2">
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          ) : (
            <ChevronDown
              className={cn(
                'w-5 h-5 text-zinc-400 transition-transform duration-150',
                progress >= 1 ? 'rotate-180' : ''
              )}
            />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}