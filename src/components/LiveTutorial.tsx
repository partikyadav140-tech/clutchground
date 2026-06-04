import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, SkipForward, Sparkles, Trophy, Wallet, User, Zap } from "lucide-react";
import { useTutorialStore, type TutorialStep } from "../lib/tutorial-store";
import { useAuth } from "../lib/auth-client";
import { confirmDialog } from "./ConfirmDialog";

/* ──────────────────────────────────────────────────
   SPOTLIGHT RECT — measures the target element
   ────────────────────────────────────────────────── */
function useTargetRect(selector: string | null, isActive: boolean, step: number) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !selector) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
      } else {
        setRect(null);
      }
    };

    // Wait for DOM to settle after navigation
    const timer = setTimeout(measure, 400);
    // Also re-measure on scroll/resize
    const scrollContainer = document.getElementById("app-scroll-container");

    const handleResize = () => setTimeout(measure, 100);
    window.addEventListener("resize", handleResize);
    scrollContainer?.addEventListener("scroll", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      scrollContainer?.removeEventListener("scroll", handleResize);
    };
  }, [selector, isActive, step]);

  return rect;
}

/* ──────────────────────────────────────────────────
   SCROLL TARGET INTO VIEW
   ────────────────────────────────────────────────── */
function scrollTargetIntoView(selector: string | null) {
  if (!selector) return;
  setTimeout(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    const scrollContainer = document.getElementById("app-scroll-container");
    if (scrollContainer) {
      const elRect = el.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const isVisible =
        elRect.top >= containerRect.top - 20 &&
        elRect.bottom <= containerRect.bottom + 20;
      if (!isVisible) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, 200);
}

/* ──────────────────────────────────────────────────
   LIVE TUTORIAL COMPONENT
   ────────────────────────────────────────────────── */
export function LiveTutorial() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    isActive,
    currentStep,
    steps,
    isCompleted,
    startTutorial,
    nextStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();

  const step: TutorialStep | undefined = steps[currentStep];
  const rect = useTargetRect(step?.target ?? null, isActive, currentStep);
  const actionListenerRef = useRef<(() => void) | null>(null);

  // Auto-start on first login (delay to let page load)
  useEffect(() => {
    if (user && !isCompleted && !isActive) {
      const t = setTimeout(() => {
        // Also skip if old tutorial was already seen
        const oldSeen = localStorage.getItem("god_esports_tutorial_driver_seen");
        if (!oldSeen) {
          startTutorial();
        }
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [user, isCompleted, isActive]);

  // Handle page navigation when step changes
  useEffect(() => {
    if (!isActive || !step) return;

    const currentPath = router.state.location.pathname;
    const cleanPath = currentPath === "/" ? "/" : currentPath.replace(/\/$/, "");

    if (step.page !== cleanPath) {
      router.navigate({ to: step.page as any });
    }

    // Scroll target into view
    scrollTargetIntoView(step.target);
  }, [isActive, currentStep, step?.page]);

  // Handle "action" interaction — listen for clicks on the target
  useEffect(() => {
    // Clean up previous listener
    if (actionListenerRef.current) {
      actionListenerRef.current();
      actionListenerRef.current = null;
    }

    if (!isActive || !step || step.interaction !== "action" || !step.target) return;

    const attachListener = () => {
      const el = document.querySelector(step.target!);
      if (!el) return;

      const handler = (e: Event) => {
        // Allow the click to propagate naturally first
        setTimeout(() => {
          nextStep();
        }, 300);
      };

      el.addEventListener("click", handler, { once: true });
      actionListenerRef.current = () => el.removeEventListener("click", handler);
    };

    const timer = setTimeout(attachListener, 500);
    return () => {
      clearTimeout(timer);
      if (actionListenerRef.current) {
        actionListenerRef.current();
        actionListenerRef.current = null;
      }
    };
  }, [isActive, currentStep, step?.target, step?.interaction]);

  const handleSkip = useCallback(async () => {
    const yes = await confirmDialog({
      title: "Skip Tutorial?",
      description: "Are you sure you want to skip? You can replay it anytime from your Profile page.",
      confirmText: "Skip",
      isDestructive: true,
    });
    if (yes) skipTutorial();
  }, []);

  const handleNext = useCallback(() => {
    nextStep();
  }, []);

  if (!isActive || !step) return null;

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isWelcome = step.id === "welcome";
  const isComplete = step.id === "complete";
  const isWalletIntro = step.id === "wallet-intro";
  const isFullscreen = !step.target;
  const isActionStep = step.interaction === "action";

  // Spotlight padding — smaller for nav items
  const isNavStep = step?.target?.includes("tutorial-nav-");
  const PAD = isNavStep ? 6 : 12;
  const spotlightRect = rect
    ? {
        x: rect.left - PAD,
        y: rect.top - PAD,
        w: rect.width + PAD * 2,
        h: rect.height + PAD * 2,
        rx: isNavStep ? 14 : 20,
      }
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: isActionStep ? "none" : "auto" }}
      >
        {/* ── SVG Overlay with spotlight cutout ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: isActionStep ? "none" : "auto" }}
        >
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.x}
                  y={spotlightRect.y}
                  width={spotlightRect.w}
                  height={spotlightRect.h}
                  rx={spotlightRect.rx}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.75)"
            mask={spotlightRect ? "url(#tutorial-spotlight-mask)" : undefined}
          />
        </svg>

        {/* ── Animated glow ring around spotlight ── */}
        {spotlightRect && (
          <motion.div
            key={`ring-${currentStep}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute tutorial-spotlight-ring"
            style={{
              left: spotlightRect.x - 3,
              top: spotlightRect.y - 3,
              width: spotlightRect.w + 6,
              height: spotlightRect.h + 6,
              borderRadius: spotlightRect.rx + 3,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Action steps: clicks pass through overlay to real elements */}

        {/* ── Tooltip Card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute tutorial-tooltip"
            style={{
              ...getTooltipPosition(spotlightRect, step.position, isFullscreen),
              pointerEvents: "auto",
              zIndex: 20,
            }}
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[20px]"
              style={{ background: "var(--gradient-primary)" }} />

            {/* Close / Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Phase badge */}
            {step.phase && (
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    opacity: 0.9,
                  }}
                >
                  {step.phase}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
            )}

            {/* Emoji + Title */}
            <div className="flex items-center gap-2 mb-2">
              {step.emoji && (
                <span className="text-xl leading-none">{step.emoji}</span>
              )}
              <h3
                className="font-display font-black text-base text-foreground uppercase tracking-wide leading-tight"
                style={{ textShadow: "var(--glow-text)" }}
              >
                {step.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-[13px] text-muted-foreground font-semibold leading-relaxed mb-4 pr-4">
              {step.description}
            </p>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary mb-4 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--gradient-primary)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* ── Fullscreen Completion Screen ── */}
            {isComplete && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: Trophy, label: "Join Tournament", color: "var(--fire)", path: "/tournaments" },
                  { icon: User, label: "Set Up Profile", color: "var(--primary)", path: "/profile" },
                  { icon: Wallet, label: "Add Coins", color: "#10b981", path: "/wallet" },
                ].map(({ icon: Icon, label, color, path }) => (
                  <div
                    key={label}
                    onClick={() => {
                      completeTutorial();
                      router.navigate({ to: path as any });
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border bg-secondary/30 cursor-pointer hover:border-primary/40 transition-all active:scale-95 press-effect"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}15`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground text-center leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex items-center gap-2">
              {/* Back button (not on first step) */}
              {currentStep > 0 && !isComplete && (
                <button
                  onClick={() => useTutorialStore.getState().prevStep()}
                  className={`h-10 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border bg-secondary text-muted-foreground flex items-center justify-center gap-1 press-effect active:scale-95 transition-all ${isActionStep ? "flex-1" : ""}`}
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </button>
              )}

              {/* Main action button (only shown if not an action step or if it is the complete step) */}
              {(!isActionStep || isComplete) && (
                <button
                  onClick={isComplete ? completeTutorial : handleNext}
                  className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 press-effect active:scale-95 transition-all"
                  style={{
                    background: isComplete ? "var(--gradient-cta)" : "var(--gradient-primary)",
                    boxShadow: isComplete ? "var(--shadow-cta)" : undefined,
                    color: "#fff",
                  }}
                >
                  {isComplete ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Let's Go!
                    </>
                  ) : isWelcome ? (
                    <>
                      Start Tour
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Skip link */}
            {!isComplete && (
              <button
                onClick={handleSkip}
                className="w-full mt-2 py-1.5 text-[9px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
              >
                <SkipForward className="w-2.5 h-2.5" />
                Skip Tutorial
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────
   TOOLTIP POSITIONING — always uses `top`, clamped to viewport
   ────────────────────────────────────────────────── */
function getTooltipPosition(
  spotlightRect: { x: number; y: number; w: number; h: number } | null,
  position: string,
  isFullscreen: boolean
): React.CSSProperties {
  const MARGIN = 16;
  const TOOLTIP_WIDTH = Math.min(340, window.innerWidth - MARGIN * 2);
  const TOOLTIP_H = 300; // estimated tooltip height for placement math
  const GAP = 14;

  // ── Fullscreen / center (welcome, wallet-intro, complete) ──
  if (isFullscreen || !spotlightRect) {
    const viewH = window.innerHeight;
    const topPos = Math.max(MARGIN, (viewH - TOOLTIP_H) / 2);
    return {
      left: MARGIN,
      right: MARGIN,
      top: topPos,
      width: `calc(100vw - ${MARGIN * 2}px)`,
      maxWidth: 380,
      margin: "0 auto",
    };
  }

  const viewH = window.innerHeight;
  const viewW = window.innerWidth;

  // Center horizontally, clamped to viewport
  let left = spotlightRect.x + spotlightRect.w / 2 - TOOLTIP_WIDTH / 2;
  left = Math.max(MARGIN, Math.min(left, viewW - TOOLTIP_WIDTH - MARGIN));

  const spotTop = spotlightRect.y;
  const spotBottom = spotlightRect.y + spotlightRect.h;
  const spaceAbove = spotTop;
  const spaceBelow = viewH - spotBottom;

  // ── position: "top" → place ABOVE spotlight ──
  if (position === "top") {
    // Calculate ideal top: tooltip bottom edge should be at spotTop - GAP
    // So tooltip top = spotTop - GAP - TOOLTIP_H
    const idealTop = spotTop - GAP - TOOLTIP_H;

    if (idealTop >= MARGIN) {
      // Fits above perfectly
      return { left, top: idealTop, width: TOOLTIP_WIDTH, maxWidth: `calc(100vw - ${MARGIN * 2}px)` };
    }

    // Doesn't fit above — try below
    if (spaceBelow > TOOLTIP_H + GAP) {
      return { left, top: spotBottom + GAP, width: TOOLTIP_WIDTH, maxWidth: `calc(100vw - ${MARGIN * 2}px)` };
    }

    // Very cramped — center in available space, avoid overlapping spotlight
    // Place it in the center of the screen but at least at MARGIN from top
    const centeredTop = Math.max(MARGIN, (viewH - TOOLTIP_H) / 2);
    return {
      left: MARGIN,
      top: centeredTop,
      width: `calc(100vw - ${MARGIN * 2}px)`,
      maxWidth: 380,
    };
  }

  // ── position: "bottom" → place BELOW spotlight ──
  if (position === "bottom") {
    const idealTop = spotBottom + GAP;

    if (idealTop + TOOLTIP_H <= viewH - MARGIN) {
      // Fits below perfectly
      return { left, top: idealTop, width: TOOLTIP_WIDTH, maxWidth: `calc(100vw - ${MARGIN * 2}px)` };
    }

    // Doesn't fit below — try above
    const aboveTop = spotTop - GAP - TOOLTIP_H;
    if (aboveTop >= MARGIN) {
      return { left, top: aboveTop, width: TOOLTIP_WIDTH, maxWidth: `calc(100vw - ${MARGIN * 2}px)` };
    }

    // Cramped — center
    const centeredTop = Math.max(MARGIN, (viewH - TOOLTIP_H) / 2);
    return {
      left: MARGIN,
      top: centeredTop,
      width: `calc(100vw - ${MARGIN * 2}px)`,
      maxWidth: 380,
    };
  }

  // ── Default: pick side with more space ──
  if (spaceBelow >= spaceAbove) {
    const top = Math.min(spotBottom + GAP, viewH - TOOLTIP_H - MARGIN);
    return { left, top, width: TOOLTIP_WIDTH, maxWidth: `calc(100vw - ${MARGIN * 2}px)` };
  }
  const top = Math.max(MARGIN, spotTop - GAP - TOOLTIP_H);
  return { left, top, width: TOOLTIP_WIDTH, maxWidth: `calc(100vw - ${MARGIN * 2}px)` };
}
