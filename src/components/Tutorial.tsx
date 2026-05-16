import { useEffect } from "react";
import { driver } from "driver.js";
import { confirmDialog } from "./ConfirmDialog";
import "driver.js/dist/driver.css";

export function Tutorial() {
  useEffect(() => {
    // Check if user has seen this interactive tutorial before
    const hasSeen = localStorage.getItem("god_esports_tutorial_driver_seen");

    if (!hasSeen) {
      // Small delay to let animations finish and DOM settle
      const timer = setTimeout(() => {
        const isMobile = window.innerWidth <= 900;
        const stepTarget = (selector: string) => (isMobile ? undefined : selector);

        const steps = [
          {
            popover: {
              title: "Welcome to CLUTCHGROUND! 👑",
              description:
                "The ultimate arena for competitive mobile gaming. Let me give you a quick live tour of how things work. Tap Next!",
              side: "over",
              align: "center",
            },
          },
          {
            element: stepTarget('a[href="/tournaments"]'),
            popover: {
              title: "🏆 Tournaments",
              description:
                "This is where the action happens. Browse active tournaments and join solo or squad battles for real cash prizes!",
              side: isMobile ? "over" : "bottom",
              align: isMobile ? "center" : "start",
            },
          },
          {
            element: stepTarget('a[href="/teams"]'),
            popover: {
              title: "🛡️ Teams & Squads",
              description:
                "Create your own squad or join an existing team. You need a verified team to enter squad tournaments.",
              side: isMobile ? "over" : "bottom",
              align: isMobile ? "center" : "start",
            },
          },
          {
            element: stepTarget('a[href="/wallet"]'),
            popover: {
              title: "💰 Your Wallet",
              description:
                "Manage your funds here. Add money to pay entry fees, and securely withdraw your tournament winnings with confidence.",
              side: isMobile ? "over" : "bottom",
              align: isMobile ? "center" : "start",
            },
          },
          {
            element: stepTarget('a[href="/leaderboard"]'),
            popover: {
              title: "👑 Global Leaderboard",
              description:
                "Every kill and placement earns you ELO points. Dominate matches to climb the ranks and see your name etched in the Hall of Fame.",
              side: isMobile ? "over" : "bottom",
              align: isMobile ? "center" : "start",
            },
          },
          {
            popover: {
              title: "🔥 Ready for Battle",
              description:
                "You are all set! Verify your Free Fire UID in your profile, join your first tournament, and claim your throne.",
              side: "over",
              align: "center",
            },
          },
        ];

        const driverObj = driver({
          showProgress: true,
          animate: true,
          allowClose: true,
          popoverClass: "driverjs-theme",
          overlayColor: "rgba(0,0,0,0.72)",
          topOffset: 64,
          steps: steps as any,
          onDestroyStarted: async () => {
            if (!driverObj.hasNextStep()) {
              driverObj.destroy();
              localStorage.setItem("god_esports_tutorial_driver_seen", "true");
            } else {
              const yes = await confirmDialog({
                title: "Skip Tutorial?",
                description: "Are you sure you want to skip the rest of the tour?",
                confirmText: "Skip",
                isDestructive: true,
              });
              if (yes) {
                driverObj.destroy();
                localStorage.setItem("god_esports_tutorial_driver_seen", "true");
              }
            }
          },
        });

        driverObj.drive();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
