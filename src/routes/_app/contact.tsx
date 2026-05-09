import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Send, HeadphonesIcon, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { saveContactMessage } from "../../api";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/contact")({
  head: () => ({ meta: [{ title: "Contact Us — Professional Esports Arena" }] }),
  component: ContactPage,
});

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
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <HeadphonesIcon className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">We're here to help you</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Links */}
          <div className="space-y-3">
            <h2 className="font-display font-black text-lg text-foreground px-1 mb-1">
              Direct Channels
            </h2>
            {[
              {
                icon: Mail,
                t: "Email Support",
                v: "clutchgroundofficial@gmail.com",
                href: "mailto:clutchgroundofficial@gmail.com",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                icon: MessageCircle,
                t: "WhatsApp Channel",
                v: "ClutchGround Updates",
                href: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s",
                color: "text-green-500",
                bg: "bg-green-50",
              },
              {
                icon: Send,
                t: "Telegram Group",
                v: "@clutchground",
                href: "https://t.me/clutchground",
                color: "text-sky-500",
                bg: "bg-sky-50",
              },
              {
                icon: Hash,
                t: "Discord Server",
                v: "ClutchGround Community",
                href: "https://discord.gg/uYXFJswHdg",
                color: "text-indigo-500",
                bg: "bg-indigo-50",
              },
            ].map((c, i) => (
              <motion.a
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                key={c.t}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.color} group-hover:scale-110 transition-transform`}
                >
                  <c.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    {c.t}
                  </div>
                  <div className="font-display font-black text-foreground text-sm">{c.v}</div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 lg:mt-0"
          >
            <h2 className="font-display font-black text-lg text-foreground px-1 mb-3">
              Send a Message
            </h2>
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-[1.5rem] border border-border shadow-sm p-6 space-y-4"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                  Your Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none px-4 py-3 text-sm rounded-xl transition-all font-semibold resize-none"
                  placeholder="How can we help you today?"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-primary mt-2"
              >
                <Send className="w-4 h-4 mr-2" /> {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
