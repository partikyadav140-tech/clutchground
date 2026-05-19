import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, MonitorSmartphone, X } from "lucide-react";

export function InstallPwaDialog() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Check if the user has already declined or installed
    const hasPrompted = localStorage.getItem("pwaPrompted");

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install dialog if not previously prompted
      if (!hasPrompted) {
        setShowDialog(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowDialog(false);
    localStorage.setItem("pwaPrompted", "true");
  };

  const handleClose = () => {
    setShowDialog(false);
    localStorage.setItem("pwaPrompted", "true");
  };

  return (
    <Dialog open={showDialog} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="relative">
          {/* Header Graphic */}
          <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border-b border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/10 shadow-[0_0_30px_rgba(255,107,0,0.3)]">
              <MonitorSmartphone className="w-8 h-8 text-primary" />
            </div>
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display font-black text-2xl text-foreground uppercase tracking-wider">
                Install ClutchGround
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground pt-2">
                Get the ultimate esports experience! Install the ClutchGround app on your device for lightning-fast access, offline capabilities, and instant notifications.
              </DialogDescription>
            </DialogHeader>

            <div className="pt-2">
              <Button 
                onClick={handleInstall}
                className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-cta-gradient text-cta-foreground shadow-[0_0_20px_rgba(255,107,0,0.3)] border border-primary/50 hover:scale-[1.02] transition-transform"
              >
                <Download className="w-4 h-4 mr-2" />
                Download App Now
              </Button>
              <button 
                onClick={handleClose}
                className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
