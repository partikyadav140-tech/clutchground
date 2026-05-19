import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, MonitorSmartphone, X, Share, PlusSquare } from "lucide-react";

export function InstallPwaDialog() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasPrompted = localStorage.getItem("pwaPrompted");

    // Show the dialog automatically after 2.5 seconds if they haven't dismissed it before
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
      // Browser supports native install prompt and it's ready
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setShowDialog(false);
        localStorage.setItem("pwaPrompted", "true");
      }
    } else {
      // Fallback manual instructions for iOS Safari or dev mode
      setShowManualInstructions(true);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    if (dontShowAgain) {
      localStorage.setItem("pwaPrompted", "true");
    } else {
      // Just for this session, they can be prompted again later unless they clicked "Don't show again"
      sessionStorage.setItem("pwaSessionPrompted", "true");
    }
  };

  const handleDismissForever = () => {
    localStorage.setItem("pwaPrompted", "true");
    setShowDialog(false);
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

            {showManualInstructions ? (
              <div className="bg-secondary border border-border rounded-2xl p-4 text-left animate-in fade-in slide-in-from-bottom-4">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 text-center">How to install manually</p>
                <ol className="text-sm text-foreground space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center font-black text-xs shrink-0">1</div>
                    <span className="flex-1">Tap the <Share className="w-4 h-4 inline mx-1" /> <b>Share</b> button in your browser menu.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center font-black text-xs shrink-0">2</div>
                    <span className="flex-1">Scroll down and tap <PlusSquare className="w-4 h-4 inline mx-1" /> <b>Add to Home Screen</b>.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center font-black text-xs shrink-0">3</div>
                    <span className="flex-1">Confirm and enjoy the app!</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="pt-2">
                <Button 
                  onClick={handleInstall}
                  className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-cta-gradient text-cta-foreground shadow-[0_0_20px_rgba(255,107,0,0.3)] border border-primary/50 hover:scale-[1.02] transition-transform"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download App Now
                </Button>
                
                <div className="mt-4 flex flex-col items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-secondary accent-primary" 
                    />
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      Don't show this again
                    </span>
                  </label>
                  
                  {dontShowAgain ? (
                    <button 
                      onClick={handleDismissForever}
                      className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dismiss
                    </button>
                  ) : (
                    <button 
                      onClick={handleClose}
                      className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Maybe Later
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
