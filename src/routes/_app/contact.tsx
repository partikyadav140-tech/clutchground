import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Send, HeadphonesIcon, Hash, ArrowRight, MapPin, Clock, Building2, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { saveContactMessage, getSocialLinks } from "../../api";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/contact")({
  head: () => ({ meta: [{ title: "Contact — CLUTCHGROUND" }] }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [socialLinks, setSocialLinks] = useState({
    whatsapp: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s",
    discord: "https://discord.gg/uYXFJswHdg",
    telegram: "https://t.me/clutchground",
    email: "clutchgroundofficial@gmail.com",
    instagram: "https://instagram.com/clutchground"
  });

  useEffect(() => {
    getSocialLinks().then(links => {
      if (links) {
        setSocialLinks(links);
      }
    });
  }, []);

  const channels = [
    { 
      icon: Mail, 
      label: "Email Support", 
      value: socialLinks.email, 
      href: socialLinks.email.startsWith("mailto:") ? socialLinks.email : `mailto:${socialLinks.email}`, 
      color: "#60a5fa", 
      bg: "rgba(96,165,250,0.1)", 
      bd: "rgba(96,165,250,0.2)" 
    },
    { 
      icon: MessageCircle, 
      label: "WhatsApp Channel", 
      value: "ClutchGround Updates", 
      href: socialLinks.whatsapp, 
      color: "#34d399", 
      bg: "rgba(52,211,153,0.1)", 
      bd: "rgba(52,211,153,0.2)" 
    },
    { 
      icon: Send, 
      label: "Telegram Group", 
      value: socialLinks.telegram.startsWith("http") ? socialLinks.telegram.split("/").pop() || "@clutchground" : (socialLinks.telegram.startsWith("@") ? socialLinks.telegram : `@${socialLinks.telegram}`), 
      href: socialLinks.telegram.startsWith("http") ? socialLinks.telegram : `https://t.me/${socialLinks.telegram.replace("@", "")}`, 
      color: "#38bdf8", 
      bg: "rgba(56,189,248,0.1)", 
      bd: "rgba(56,189,248,0.2)" 
    },
    { 
      icon: Hash, 
      label: "Discord Server", 
      value: "ClutchGround Community", 
      href: socialLinks.discord, 
      color: "#818cf8", 
      bg: "rgba(129,140,248,0.1)", 
      bd: "rgba(129,140,248,0.2)" 
    },
    { 
      icon: Instagram, 
      label: "Instagram Page", 
      value: socialLinks.instagram.startsWith("http") ? socialLinks.instagram.split("/").filter(Boolean).pop() || "@clutchground" : (socialLinks.instagram.startsWith("@") ? socialLinks.instagram : `@${socialLinks.instagram}`), 
      href: socialLinks.instagram.startsWith("http") ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace("@", "")}`, 
      color: "#ec4899", 
      bg: "rgba(236,72,153,0.1)", 
      bd: "rgba(236,72,153,0.2)" 
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      await (saveContactMessage as any)({ data: { name, email, message } });
      toast.success("Message sent! We'll respond within 24h.");
      setSent(true);
      setName(""); setEmail(""); setMessage("");
    } catch { toast.error("Failed to send message."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-5">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          <HeadphonesIcon className="w-3 h-3" /> Support
        </div>
        <h1 className="font-display font-black text-2xl text-foreground">Get in Touch</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* ── Business Info (UPI compliance) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Information</p>
          <div className="space-y-2.5">
            {[
              { icon: Building2, title: "CLUTCHGROUND", sub: "Skill-Based Esports Platform" },
              { icon: MapPin,    title: "Registered Address", sub: "Haryana, India — 124103" },
              { icon: Mail,      title: socialLinks.email, sub: "Official contact for disputes & refunds" },
              { icon: Clock,     title: "Support Hours", sub: "Mon – Sat, 10:00 AM – 8:00 PM IST" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground font-medium">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Quick channels ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">Direct Channels</p>
          <div className="flex flex-col gap-3">
            {channels.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border shadow-card press-effect active:scale-[0.98] transition-transform"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{ background: c.bg, borderColor: c.bd, color: c.color }}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{c.label}</p>
                  <p className="font-bold text-sm text-foreground truncate">{c.value}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* ── Contact form ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">Send a Message</p>
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                  <Send className="w-6 h-6" />
                </div>
                <p className="font-display font-black text-lg text-foreground mb-1">Message Sent!</p>
                <p className="text-sm text-muted-foreground mb-5">We'll respond within 24 hours.</p>
                <button onClick={() => setSent(false)}
                  className="h-10 px-6 rounded-xl text-xs font-black border border-border text-foreground bg-secondary press-effect active:scale-95">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {[
                  { label: "Your Name",     type: "text",  value: name,    set: setName,    ph: "John Warrior" },
                  { label: "Email Address", type: "email", value: email,   set: setEmail,   ph: "you@example.com" },
                ].map(({ label, type, value, set, ph }) => (
                  <div key={label}>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">{label}</label>
                    <input
                      type={type}
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder={ph}
                      required
                      className="w-full h-12 bg-secondary border border-border focus:border-primary/60 rounded-2xl px-4 text-sm font-semibold text-foreground outline-none transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    required
                    placeholder="How can we help you today?"
                    className="w-full bg-secondary border border-border focus:border-primary/60 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 press-effect active:scale-95 transition-all mt-1"
                  style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
