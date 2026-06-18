import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-client";
import { getMyTeam, getTeamRequests } from "../api";
import { showBrowserNotification } from "@/lib/notification-utils";
import { playNotificationTone, vibrateNotification } from "@/lib/notification-utils";
import { useSocket, useRoom } from "@/hooks/useSocket";

export function MyTeamFab() {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = React.useState<any>(null);
  const [teamRequests, setTeamRequests] = React.useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = React.useState<number>(0);
  const [loaded, setLoaded] = React.useState(false);
  const prevUnreadRef = React.useRef<number>(0);
  const { on: socketOn } = useSocket();

  // Auto-join/leave team room
  useRoom("team", myTeam?.id || null);

  // Load team data
  React.useEffect(() => {
    if (!user) { setLoaded(true); return; }
    (getMyTeam as any)({ data: user.id })
      .then((t: any) => {
        setMyTeam(t);
        if (t && t.leader_id === user.id) {
          (getTeamRequests as any)({ data: user.id })
            .then((reqs: any[]) => setTeamRequests(reqs))
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, [user]);

  // ── WebSocket: listen for team unread count updates (replaces polling) ──
  React.useEffect(() => {
    if (!user || !myTeam || !socketOn) return;

    return socketOn("team-unread-count", (data: { teamId: number; count: number }) => {
      if (data.teamId !== myTeam.id) return;
      setUnreadChatCount((prev) => {
        if (data.count > prev && prevUnreadRef.current > 0) {
          showBrowserNotification("💬 Team Chat", {
            body: `You have ${data.count - prev} new message${data.count - prev > 1 ? "s" : ""} in ${myTeam.name}`,
            url: "/chat",
            tag: `cg-team-chat-${myTeam.id}`,
          });
          playNotificationTone(false);
          vibrateNotification(false);
        }
        prevUnreadRef.current = data.count;
        return data.count;
      });
    });
  }, [user, myTeam, socketOn]);

  if (!user || !loaded) return null;

  const hasTeam = !!myTeam;
  const totalBadge = (teamRequests?.length || 0) + unreadChatCount;

  return (
    <Link
      to={hasTeam ? "/my-team" : "/teams"}
      className="fixed right-3 z-40 no-underline"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 86px)" }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 260, delay: 0.5 }}
        className="relative flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-card press-effect active:scale-95 transition-transform cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/15 text-primary border border-primary/20 overflow-hidden">
          {hasTeam && myTeam.logo ? (
            <img src={myTeam.logo} className="w-full h-full object-cover" alt="team logo" />
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground leading-none flex items-center gap-1.5">
            {hasTeam ? "My Team" : "Join Team"}
            {hasTeam && unreadChatCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
          </span>
          <span className="text-label leading-tight mt-0.5 max-w-[80px] truncate">
            {hasTeam ? myTeam.name : "Create or join"}
          </span>
        </div>
        {hasTeam && totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center">
            <span
              className="absolute w-4 h-4 rounded-full animate-ping opacity-40"
              style={{ background: "var(--primary)" }}
            />
            <span
              className="relative w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
              style={{ background: "var(--primary)", minWidth: "16px" }}
            >
              {totalBadge}
            </span>
          </span>
        )}
      </motion.div>
    </Link>
  );
}
