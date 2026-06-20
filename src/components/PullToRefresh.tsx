import { useState, useRef, useCallback } from "react";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
};

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      startY.current = e.touches[0].clientY;
      pullingRef.current = false;
    },
    [refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0 && diff < 150) {
        pullingRef.current = true;
        setPullDistance(diff * 0.4);
      }
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current || refreshing) return;
    const distance = pullDistance;
    setPullDistance(0);
    pullingRef.current = false;

    if (distance > 60) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch {}
      setRefreshing(false);
    }
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 10 || refreshing) && (
        <div className="flex justify-center py-2">
          <div
            className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full transition-transform ${refreshing ? "animate-spin" : ""}`}
            style={{
              transform: refreshing ? undefined : `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
            }}
          />
        </div>
      )}
      <div
        style={{
          transform: refreshing ? undefined : `translateY(${pullDistance}px)`,
          transition: pullingRef.current ? "none" : "transform 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
