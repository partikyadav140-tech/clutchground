import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useState } from "react";
import { saveContactMessage } from "../../api";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      await (saveContactMessage as any)({ data: { name, email, message } });
      toast.success("Message sent! We'll respond within 24h.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 max-w-4xl">
      <PageHeader title="Contact" subtitle="War Room" />
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-4 bg-card-gradient border border-border clip-notch p-6">
          <h3 className="font-display text-lg uppercase tracking-widest text-primary">Send Message</h3>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-11 text-sm" placeholder="Your name" required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-11 text-sm" placeholder="Email" required />
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full bg-background border border-border focus:border-primary outline-none px-4 py-3 text-sm" placeholder="What's on your mind, warrior?" required />
          <Button type="submit" variant="hero" className="w-full" disabled={loading}><Send className="w-4 h-4 mr-2" /> {loading ? "Sending..." : "Send"}</Button>
        </form>
        <div className="space-y-4">
          {[
            { icon: Mail, t: "Email", v: "clutchgroundofficial@gmail.com", href: "mailto:clutchgroundofficial@gmail.com" },
            { icon: MessageCircle, t: "WhatsApp", v: "ClutchGround Channel", href: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s" },
            { icon: Send, t: "Telegram", v: "@clutchground", href: "https://t.me/clutchground" },
          ].map((c) => (
            <a key={c.t} href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-card-gradient border border-border clip-notch hover:border-primary/50 transition-colors cursor-pointer group">
              <c.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.t}</div><div className="font-display font-bold">{c.v}</div></div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/contact")({
  head: () => ({ meta: [{ title: "Contact — CLUTCHGROUND" }] }),
  component: ContactPage,

});
