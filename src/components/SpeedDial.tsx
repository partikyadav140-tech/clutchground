import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Plus, Mail, Hash, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocialLinks } from "../api";
import { Link } from "@tanstack/react-router";

export function SpeedDial() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [socialLinks, setSocialLinks] = useState({
    whatsapp: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s",
    discord: "https://discord.gg/uYXFJswHdg",
    telegram: "https://t.me/clutchground",
    email: "clutchgroundofficial@gmail.com",
  });

  useEffect(() => {
    getSocialLinks().then((links) => {
      if (links) {
        setSocialLinks(links);
      }
    });
  }, []);

  // Scroll direction detection — hide on scroll down, show on scroll up
  useEffect(() => {
    const threshold = 15; // Minimum scroll delta to trigger
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (delta > threshold && currentY > 80) {
          // Scrolling DOWN past 80px — hide
          setVisible(false);
          if (open) setOpen(false);
        } else if (delta < -threshold) {
          // Scrolling UP — show
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  const safeWhatsapp =
    socialLinks.whatsapp || "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s";
  const safeDiscord = socialLinks.discord || "https://discord.gg/uYXFJswHdg";
  const safeTelegram = socialLinks.telegram || "https://t.me/clutchground";
  const safeEmail = socialLinks.email || "clutchgroundofficial@gmail.com";

  const links = [
    {
      name: "Spin Wheel",
      icon: Sparkles,
      url: "/spin-wheel",
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
      internal: true,
    },
    { name: "WhatsApp", icon: MessageCircle, url: safeWhatsapp, color: "bg-[#25D366]" },
    { name: "Discord", icon: Hash, url: safeDiscord, color: "bg-[#5865F2]" },
    {
      name: "Telegram",
      icon: Send,
      url: safeTelegram.startsWith("http")
        ? safeTelegram
        : `https://t.me/${safeTelegram.replace("@", "")}`,
      color: "bg-[#0088cc]",
    },
    {
      name: "Email",
      icon: Mail,
      url: safeEmail.startsWith("mailto:") ? safeEmail : `mailto:${safeEmail}`,
      color: "bg-[#D44638]",
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-center gap-3 lg:hidden"
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Main FAB button */}
          <button
            onClick={() => setOpen(!open)}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-fire transition-transform active:scale-95"
          >
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Plus className="w-8 h-8" />
            </motion.div>
          </button>

          {/* Expanded links */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3 items-center mb-1"
              >
                {links.map((link, i) => {
                  const content = (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.3, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.3, y: 20 }}
                      transition={{
                        delay: i * 0.04,
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                      className="relative group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform ${link.color}`}
                      >
                        <link.icon className="w-5 h-5" />
                      </div>
                      {/* Tooltip */}
                      <span className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-card border border-border text-[10px] font-bold text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        {link.name}
                      </span>
                    </motion.div>
                  );

                  if (link.internal) {
                    return (
                      <Link key={link.name} to={link.url as any} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
