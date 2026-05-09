import { useState } from "react";
import { MessageCircle, Send, Plus, Mail, Hash, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SpeedDial() {
  const [open, setOpen] = useState(false);

  const links = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s",
      color: "bg-[#25D366]",
    },
    {
      name: "Discord",
      icon: Hash,
      url: "https://discord.gg/uYXFJswHdg",
      color: "bg-[#5865F2]",
    },
    {
      name: "Telegram",
      icon: Send,
      url: "https://t.me/clutchground",
      color: "bg-[#0088cc]",
    },
    {
      name: "Email",
      icon: Mail,
      url: "mailto:clutchgroundofficial@gmail.com",
      color: "bg-[#D44638]",
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-center gap-3 lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-fire transition-transform active:scale-95"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-8 h-8" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-3 items-center mb-1"
          >
            {links.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: i * 0.05 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${link.color}`}
              >
                <link.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
