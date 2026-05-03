import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { MessageCircle, Heart, Share2, Send, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/community")({
  head: () => ({
    meta: [
      { title: "Community — GOD ESPORTS" },
      { name: "description", content: "Join the GOD ESPORTS community. Share clips, find squads, discuss strategy." },
    ],
  }),
  component: CommunityPage,
});

type Post = { u: string; t: string; time: string; likes: number; comments: number; liked?: boolean };

const initial: Post[] = [
  { u: "DOOMxKING", t: "Just locked 1st place in GOD Champions Cup. GG to all squads who fought 🔥", time: "2h", likes: 248, comments: 47 },
  { u: "RAGE_REAPER", t: "Looking for 2 squad mates for tonight's tournament. Must have rank Diamond+. DM me.", time: "4h", likes: 32, comments: 18 },
  { u: "ColdFury", t: "Tutorial: How I increased my K/D from 4 to 13 in 30 days. Long thread incoming...", time: "6h", likes: 512, comments: 89 },
  { u: "AlphaGhost77", t: "The new map rotation in Clash Squad is insane. Bermuda is back baby!", time: "8h", likes: 124, comments: 22 },
];

function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(initial);
  const [draft, setDraft] = useState("");

  const post = () => {
    if (!draft.trim()) return toast.error("Write something first, warrior.");
    setPosts([{ u: "You", t: draft.trim(), time: "now", likes: 0, comments: 0 }, ...posts]);
    setDraft("");
    toast.success("Posted to the arena.");
  };

  const like = (i: number) =>
    setPosts(posts.map((p, j) => j === i ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 max-w-4xl">
      <PageHeader title="Community" subtitle="Brotherhood Forum" />

      {/* Composer */}
      <div className="mt-8 bg-card-gradient border border-primary/30 clip-notch p-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-fire-gradient grid place-items-center font-display font-black text-primary-foreground shrink-0">Y</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={280}
            className="flex-1 bg-background/60 border border-border focus:border-primary outline-none p-3 text-sm resize-none"
            placeholder="Share a clip, call out a squad, post a strat..."
          />
        </div>
        <div className="flex items-center justify-between mt-3 pl-[3.25rem]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <button onClick={() => toast.info("Image upload coming soon.")} className="p-1.5 hover:text-primary"><ImageIcon className="w-4 h-4" /></button>
            <span className="text-[10px] uppercase tracking-widest">{draft.length}/280</span>
          </div>
          <Button variant="hero" size="sm" onClick={post}><Send className="w-4 h-4" /> Post</Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {posts.map((p, i) => (
          <div key={i} className="bg-card-gradient border border-border clip-notch p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-fire-gradient grid place-items-center font-display font-black text-primary-foreground">{p.u[0]}</div>
              <div><div className="font-bold">{p.u}</div><div className="text-xs text-muted-foreground">{p.time === "now" ? "just now" : `${p.time} ago`}</div></div>
            </div>
            <p className="text-foreground whitespace-pre-wrap">{p.t}</p>
            <div className="mt-4 flex gap-5 text-sm text-muted-foreground">
              <button onClick={() => like(i)} className={`flex items-center gap-1.5 transition-colors ${p.liked ? "text-primary" : "hover:text-primary"}`}>
                <Heart className={`w-4 h-4 ${p.liked ? "fill-current" : ""}`} /> {p.likes}
              </button>
              <button onClick={() => toast.info("Comments thread opening soon.")} className="flex items-center gap-1.5 hover:text-primary transition-colors"><MessageCircle className="w-4 h-4" /> {p.comments}</button>
              <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community#${i}`); toast.success("Post link copied!"); }} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Share2 className="w-4 h-4" /> Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
