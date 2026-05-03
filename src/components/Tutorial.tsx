import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function Tutorial() {
  useEffect(() => {
    // Check if user has seen this interactive tutorial before
    const hasSeen = localStorage.getItem("god_esports_tutorial_driver_seen");
    
    if (!hasSeen) {
      // Small delay to let animations finish and DOM settle
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          animate: true,
          allowClose: true,
          popoverClass: 'driverjs-theme',
          steps: [
            { 
              popover: { 
                title: 'Welcome to CLUTCHGROUND! 👑', 
                description: 'The ultimate arena for competitive mobile gaming. Let me give you a quick live tour of how things work. Tap Next!', 
                side: "over", 
                align: 'center' 
              } 
            },
            { 
              element: 'a[href="/tournaments"]', 
              popover: { 
                title: '🏆 Tournaments', 
                description: 'This is where the action happens. Tap here later to browse active tournaments and join solo or squad battles for real cash prizes!', 
                side: "bottom", 
                align: 'start' 
              } 
            },
            { 
              element: 'a[href="/teams"]', 
              popover: { 
                title: '🛡️ Teams & Squads', 
                description: 'Create your own squad or join an existing team. You need a verified team to enter squad tournaments. Tap here to manage them!', 
                side: "bottom", 
                align: 'start' 
              } 
            },
            { 
              element: 'a[href="/wallet"]', 
              popover: { 
                title: '💰 Your Wallet', 
                description: 'Manage your funds here. Add money to pay entry fees, and securely withdraw all your massive tournament winnings!', 
                side: "bottom", 
                align: 'start' 
              } 
            },
            { 
              element: 'a[href="/leaderboard"]', 
              popover: { 
                title: '👑 Global Leaderboard', 
                description: 'Every kill and placement earns you ELO points. Dominate your matches to climb the ranks and see your name etched here!', 
                side: "bottom", 
                align: 'start' 
              } 
            },
            { 
              popover: { 
                title: '🔥 Ready for Battle', 
                description: 'You are all set! Verify your Free Fire UID in your profile, join your first tournament, and claim your throne.', 
                side: "over", 
                align: 'center' 
              } 
            }
          ],
          onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the rest of the tour?")) {
              driverObj.destroy();
              localStorage.setItem("god_esports_tutorial_driver_seen", "true");
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
