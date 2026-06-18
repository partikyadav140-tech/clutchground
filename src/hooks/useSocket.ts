/**
 * React hook for WebSocket connection and real-time events.
 * Replaces all polling patterns.
 */
import { useEffect, useCallback, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket-client";
import { useAuth } from "@/lib/auth-client";

export function useSocket() {
  const { user } = useAuth();
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    return () => {
      // Don't disconnect on component unmount — keep alive globally
    };
  }, [user]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const socket = getSocket();
    if (!socket) return () => {};
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, ...args);
    }
  }, []);

  return { on, emit, connected: getSocket()?.connected ?? false };
}

/**
 * Hook to join/leave Socket.io rooms automatically.
 */
export function useRoom(roomType: "team" | "ticket", roomId: number | null) {
  const { emit, on } = useSocket();

  useEffect(() => {
    if (!roomId) return;
    const joinEvent = `join-${roomType}`;
    const leaveEvent = `leave-${roomType}`;
    emit(joinEvent, roomId);
    return () => {
      emit(leaveEvent, roomId);
    };
  }, [roomType, roomId, emit]);
}
