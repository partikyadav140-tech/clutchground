import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-client";
import { getMyTeam, getTeamRequests, getTeamChatUnreadCount } from "../api";
import { showBrowserNotification } from "@/lib/notification-utils";
import { playNotificationTone, vibrateNotification } from "@/lib/notification-utils";

export function MyTeamFab() {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = React.useState<any>(null);
  const [teamRequests, setTeamRequests] = React.useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = React.useState<number>(0);
  const prevUnreadRef = React.useRef<number>(0);

  // Load team data
  React.useEffect(() => {
    if (!user) return;
    (getMyTeam as any)({ data: user.id })
      .then((t: any) => {
        setMyTeam(t);
        if (t && t.leader_id === user.id) {
          (getTeamRequests as any)({ data: user.id })
            .then((reqs: any[]) => setTeamRequests(reqs))
            .catch(console.error);
        }
      })
      .catch(console.error);
  }, [user]);

  // Poll unread team chat count + show toast on new messages
  React.useEffect(() => {
    if (!user || !myTeam) {
      setUnreadChatCount(0);
      return;
    }

    const fetchUnreadCount = () => {
      const lastReadId = Number(
        localStorage.getItem(`clutchground_team_last_read_${myTeam.id}`) || 0,
      );
      (getTeamChatUnreadCount as any)({
        data: {
          teamId: myTeam.id,
          lastReadMessageId: lastReadId,
        },
      })
        .then((count: number) => {
          setUnreadChatCount((prev) => {
            // Detect new unread messages (count increased)
            if (count > prev && prevUnreadRef.current > 0) {
              showBrowserNotification("💬 Team Chat", {
                body: `You have ${count - prev} new message${count - prev > 1 ? "s" : ""} in ${myTeam.name}`,
                url: "/chat",
                tag: `cg-team-chat-${myTeam.id}`,
              });
              playNotificationTone(false);
              vibrateNotification(false);
            }
            prevUnreadRef.current = count;
            return count;
          });
        })
        .catch(console.error);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000);
    return () => clearInterval(interval);
  }, [user, myTeam]);

  if (!user || !myTeam) return null;

  const totalBadge = (teamRequests?.length || 0) + unreadChatCount;

  return (
    <Link
      to="/my-team"
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
          {myTeam.logo ? (
            <img src={myTeam.logo} className="w-full h-full object-cover" alt="team logo" />
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground leading-none flex items-center gap-1.5">
            My Team
            {unreadChatCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
          </span>
          <span className="text-label leading-tight mt-0.5 max-w-[80px] truncate">
            {myTeam.name}
          </span>
        </div>
        {totalBadge > 0 && (
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
