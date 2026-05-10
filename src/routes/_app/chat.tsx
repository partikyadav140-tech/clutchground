import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  MessageCircle, Users, Search, UserPlus, Check, X, ArrowLeft, Send, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getFriends, getFriendRequests, searchUsers, sendFriendRequest, resolveFriendRequest,
  getMyTeam, getChatMessages, sendMessage
} from "../../api";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat & Friends — CLUTCHGROUND" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Lists Data
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);

  // Search Data
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Active Chat State
  const [activeChat, setActiveChat] = useState<{ type: 'team' | 'friend', id: number, name: string, avatar?: string } | null>(null);
  
  // Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);

  // Layout State
  const [view, setView] = useState<'chats' | 'friends' | 'requests'>('chats');

  useEffect(() => {
    if (!loading && !user) return router.navigate({ to: "/login" });
    if (user) {
      loadInitialData();
    }
  }, [user, loading]);

  const loadInitialData = async () => {
    try {
      const [f, r, t] = await Promise.all([
        (getFriends as any)({ data: user?.id }),
        (getFriendRequests as any)({ data: user?.id }),
        (getMyTeam as any)({ data: user?.id })
      ]);
      setFriends(f);
      setRequests(r);
      setMyTeam(t);
    } catch(e) {}
  };

  // Chat Polling
  useEffect(() => {
    if (!activeChat || !user) return;
    
    setMessages([]); // clear old messages
    lastMessageIdRef.current = 0;

    const fetchMessages = async () => {
      try {
        const newMsgs = await (getChatMessages as any)({
          data: {
            userId: user.id,
            otherUserId: activeChat.type === 'friend' ? activeChat.id : undefined,
            teamId: activeChat.type === 'team' ? activeChat.id : undefined,
            lastMessageId: lastMessageIdRef.current
          }
        });

        if (newMsgs && newMsgs.length > 0) {
          setMessages(prev => {
            // avoid duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const filtered = newMsgs.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...filtered];
          });
          lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id;
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch(e) {}
    };

    fetchMessages(); // initial fetch
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeChat, user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await (searchUsers as any)({ data: { query: searchQuery, userId: user?.id } });
      setSearchResults(res);
    } catch(err) {
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (toUserId: number) => {
    try {
      await (sendFriendRequest as any)({ data: { fromUserId: user?.id, toUserId } });
      toast.success("Friend request sent!");
    } catch(err: any) {
      toast.error(err.message || "Failed to send request");
    }
  };

  const handleResolveRequest = async (requestId: number, status: 'accepted' | 'rejected') => {
    try {
      await (resolveFriendRequest as any)({ data: { requestId, status } });
      toast.success(status === 'accepted' ? "Friend added!" : "Request declined");
      await loadInitialData();
    } catch(err: any) {
      toast.error(err.message || "Failed to update request");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;
    setIsSending(true);
    try {
      await (sendMessage as any)({
        data: {
          senderId: user?.id,
          receiverId: activeChat.type === 'friend' ? activeChat.id : undefined,
          teamId: activeChat.type === 'team' ? activeChat.id : undefined,
          message: messageInput
        }
      });
      setMessageInput("");
      // Polling will catch the new message in ~3s, or we can optimistic update.
      // Doing optimistic update is tricky since we don't have the message ID. Let's just wait for poll or trigger a fast fetch.
    } catch(err) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (loading || !user) return null;

  // Render main screen or chat screen on mobile
  if (activeChat) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex flex-col pb-safe">
        <div className="bg-white border-b border-border p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)} className="rounded-full w-10 h-10 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden font-display font-black text-primary">
            {activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : activeChat.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-foreground">{activeChat.name}</h2>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {activeChat.type === 'team' ? 'Squad Chat' : 'Direct Message'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
          {messages.map((m) => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && activeChat.type === 'team' && (
                  <div className="text-[10px] font-bold text-muted-foreground ml-1 mb-1">{m.ign || m.username}</div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm font-semibold whitespace-pre-wrap ${
                  isMe ? 'bg-primary text-white rounded-br-sm shadow-primary/20 shadow-md' : 'bg-white border border-border text-foreground rounded-bl-sm shadow-sm'
                }`}>
                  {m.message}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-border p-3">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <textarea
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-secondary/50 border border-border focus:border-primary outline-none rounded-[1.5rem] px-4 py-3 text-sm font-semibold resize-none max-h-32 min-h-[48px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button type="submit" disabled={isSending || !messageInput.trim()} className="w-12 h-12 rounded-full bg-primary text-white shrink-0 shadow-sm p-0 flex items-center justify-center">
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-4 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <MessageCircle className="w-5 h-5" /> Communications
          </div>
          <h1 className="font-display text-2xl font-black text-foreground">Chat & Friends</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-secondary/50 p-1 rounded-xl mt-6 relative z-10">
          {[
            { id: 'chats', label: 'Chats', icon: MessageCircle },
            { id: 'friends', label: 'Add Friends', icon: UserPlus },
            { id: 'requests', label: `Requests (${requests.length})`, icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                view === tab.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6 max-w-2xl mx-auto space-y-4">
        {view === 'chats' && (
          <div className="space-y-3">
            {myTeam && (
              <div 
                onClick={() => setActiveChat({ type: 'team', id: myTeam.id, name: myTeam.name, avatar: myTeam.logo })}
                className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-[1.5rem] p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-2xl text-white shadow-md overflow-hidden shrink-0">
                  {myTeam.logo ? <img src={myTeam.logo} className="w-full h-full object-cover" /> : myTeam.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-foreground">{myTeam.name}</h3>
                  <div className="text-[10px] text-primary uppercase tracking-widest font-bold">Squad Chat</div>
                </div>
              </div>
            )}

            {friends.length === 0 ? (
              <div className="bg-white border border-border rounded-[1.5rem] p-8 text-center mt-4">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-bold text-muted-foreground">No friends yet.</p>
                <Button variant="link" onClick={() => setView('friends')} className="text-primary mt-2">Find players</Button>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-[1.5rem] overflow-hidden">
                <div className="bg-secondary/20 px-5 py-3 border-b border-border/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Direct Messages
                </div>
                {friends.map((f, i) => (
                  <div 
                    key={f.friendship_id} 
                    onClick={() => setActiveChat({ type: 'friend', id: f.user_id, name: f.ign || f.username, avatar: f.avatar_url })}
                    className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors ${i !== friends.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-xl text-muted-foreground overflow-hidden shrink-0">
                      {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" /> : (f.ign ? f.ign[0].toUpperCase() : f.username[0].toUpperCase())}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{f.ign || f.username}</div>
                      <div className="text-xs text-muted-foreground font-mono">UID: {f.uid || 'Unknown'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'friends' && (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by IGN or UID..."
                className="w-full h-14 bg-white border border-border focus:border-primary outline-none rounded-2xl pl-12 pr-4 font-bold shadow-sm"
              />
              <Button type="submit" className="absolute right-2 top-2 h-10 rounded-xl" disabled={isSearching || !searchQuery}>
                Search
              </Button>
            </form>

            <div className="space-y-3">
              {searchResults.map(u => (
                <div key={u.id} className="bg-white border border-border p-4 rounded-[1.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-display font-black text-muted-foreground">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-lg" /> : (u.ign ? u.ign[0].toUpperCase() : u.username[0].toUpperCase())}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{u.ign || u.username}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">UID: {u.uid || 'N/A'}</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddFriend(u.id)} className="h-8 rounded-lg text-xs font-bold">
                    <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center text-muted-foreground font-bold p-8">No players found.</div>
              )}
            </div>
          </div>
        )}

        {view === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
               <div className="bg-white border border-border rounded-[1.5rem] p-8 text-center mt-4">
               <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
               <p className="font-bold text-muted-foreground">No pending requests.</p>
             </div>
            ) : (
              requests.map(r => (
                <div key={r.id} className="bg-white border border-border p-4 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-muted-foreground">
                      {r.avatar_url ? <img src={r.avatar_url} className="w-full h-full object-cover rounded-xl" /> : (r.ign ? r.ign[0].toUpperCase() : r.username[0].toUpperCase())}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{r.ign || r.username}</div>
                      <div className="text-xs text-muted-foreground font-mono">UID: {r.uid || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleResolveRequest(r.id, 'accepted')} className="flex-1 h-9 rounded-lg font-bold bg-primary text-white">
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button variant="outline" onClick={() => handleResolveRequest(r.id, 'rejected')} className="flex-1 h-9 rounded-lg font-bold">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
