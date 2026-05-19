import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export function InstallPwaDialog() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasPrompted = localStorage.getItem("pwaPrompted");

    if (hasPrompted !== "true") {
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setShowDialog(false);
        localStorage.setItem("pwaPrompted", "true");
      }
    } else {
      toast.info("Native install unavailable. Tap 'Share' and 'Add to Home Screen' in your browser menu.");
      setShowDialog(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    if (dontShowAgain) {
      localStorage.setItem("pwaPrompted", "true");
    } else {
      sessionStorage.setItem("pwaSessionPrompted", "true");
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm bg-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(255,107,0,0.15)] rounded-[2rem] p-0 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-8 flex flex-col items-center text-center">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all press-effect"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(255,107,0,0.2)] mb-6">
            <Logo size={48} withText={false} />
          </div>

          <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider mb-2">
            Get The App
          </h2>
          
          <p className="text-sm text-white/60 mb-8 font-medium leading-relaxed max-w-[260px]">
            Install <strong className="text-primary font-bold">CLUTCHGROUND</strong> for a faster, fullscreen esports experience with instant push alerts.
          </p>

          <button 
            onClick={handleInstall}
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] border border-primary/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 press-effect relative overflow-hidden group"
            style={{ background: "linear-gradient(135deg, var(--primary), #cc5500)" }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Download className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Install Now</span>
          </button>
          
          <div className="mt-5 flex flex-col items-center gap-4 w-full">
            <label className="flex items-center gap-2.5 cursor-pointer group px-2">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="peer appearance-none w-5 h-5 rounded-md border border-white/20 bg-white/5 checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-white/50 group-hover:text-white/80 transition-colors">
                Don't show this again
              </span>
            </label>
            
            <button 
              onClick={handleClose}
              className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
