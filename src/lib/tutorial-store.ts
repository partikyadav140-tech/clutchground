import { create } from "zustand";

/* ──────────────────────────────────────────────────
   Tutorial Step Definition
   ────────────────────────────────────────────────── */
export interface TutorialStep {
  id: string;
  /** CSS selector for the target element to spotlight (null = fullscreen overlay) */
  target: string | null;
  title: string;
  description: string;
  /** Which page this step belongs to (used for auto-navigation) */
  page: string;
  /** "next" = user clicks Next, "action" = user must tap the target element */
  interaction: "next" | "action";
  /** Position of tooltip relative to target */
  position: "top" | "bottom" | "left" | "right" | "center";
  /** Optional emoji/icon prefix */
  emoji?: string;
  /** Phase label for grouping */
  phase?: string;
}

/* ──────────────────────────────────────────────────
   All Tutorial Steps (24 total)
   ────────────────────────────────────────────────── */
export const TUTORIAL_STEPS: TutorialStep[] = [
  // ═══ Phase 1: Welcome & Home Page ═══
  {
    id: "welcome",
    target: null,
    title: "Welcome to CLUTCHGROUND!",
    description: "The ultimate arena for competitive Free Fire gaming. Let us give you a quick interactive tour of everything you need to dominate the battleground!",
    page: "/",
    interaction: "next",
    position: "center",
    emoji: "🔥",
    phase: "Welcome",
  },
  {
    id: "player-card",
    target: "#tutorial-player-card",
    title: "Your Player Card",
    description: "This is your identity in the arena. It shows your In-Game Name (IGN), Free Fire UID, and your total coin balance. Tap your avatar anytime to view detailed stats!",
    page: "/",
    interaction: "next",
    position: "bottom",
    emoji: "🎮",
    phase: "Home Tour",
  },
  {
    id: "balance-pill",
    target: "#tutorial-wallet-pill",
    title: "Wallet",
    description: "Tap Wallet to view your balance, deposit coins, and withdraw winnings anytime!",
    page: "/",
    interaction: "next",
    position: "bottom",
    emoji: "💰",
    phase: "Home Tour",
  },
  {
    id: "quick-actions",
    target: "#tutorial-quick-actions",
    title: "Quick Actions",
    description: "Jump to your Wallet, Matches, Teams, or Ranks in one tap! These shortcuts help you navigate the app faster.",
    page: "/",
    interaction: "next",
    position: "bottom",
    emoji: "⚡",
    phase: "Home Tour",
  },
  {
    id: "featured-tournaments",
    target: "#tutorial-featured",
    title: "Featured Tournaments",
    description: "These are the BIG prize tournaments! Swipe through to browse featured battles with the highest prize pools. Look for the 🟢 FREE badge for free-entry tournaments!",
    page: "/",
    interaction: "next",
    position: "top",
    emoji: "🏆",
    phase: "Home Tour",
  },
  {
    id: "tournament-join",
    target: "#tutorial-battles",
    title: "Active Battles",
    description: "All active tournaments are listed here. Tap 'Join' to enter a battle or 'Info' to see the full details — schedule, room ID, rules, and live standings!",
    page: "/",
    interaction: "next",
    position: "top",
    emoji: "⚔️",
    phase: "Home Tour",
  },
  {
    id: "leaderboard-mini",
    target: "#tutorial-leaderboard",
    title: "Top Players",
    description: "The best warriors of the arena! Every kill and placement earns ELO points. Play matches to climb the ranks and see your name here!",
    page: "/",
    interaction: "next",
    position: "top",
    emoji: "👑",
    phase: "Home Tour",
  },

  // ═══ Phase 2: Navigation Tour ═══
  {
    id: "nav-home",
    target: "#tutorial-nav-home",
    title: "Home Tab",
    description: "You're on the Home page right now. This is your dashboard — player card, stats, tournaments, and leaderboard at a glance. Let's explore the other tabs!",
    page: "/",
    interaction: "next",
    position: "top",
    emoji: "🏠",
    phase: "Navigation",
  },
  {
    id: "nav-arena",
    target: "#tutorial-nav-arena",
    title: "Arena — Tap It!",
    description: "Tap the Arena tab to browse ALL active tournaments! This is where you find and join battles.",
    page: "/",
    interaction: "action",
    position: "top",
    emoji: "🏟️",
    phase: "Navigation",
  },
  {
    id: "nav-matches",
    target: "#tutorial-nav-matches",
    title: "Matches — Tap It!",
    description: "Tap Matches to see tournaments you've joined, room IDs, passwords, and live results.",
    page: "/tournaments",
    interaction: "action",
    position: "top",
    emoji: "🎯",
    phase: "Navigation",
  },
  {
    id: "nav-ranks",
    target: "#tutorial-nav-ranks",
    title: "Ranks — Tap It!",
    description: "Tap the Ranks tab to view the Global Leaderboard and see the season championship rewards!",
    page: "/matches",
    interaction: "action",
    position: "top",
    emoji: "🥇",
    phase: "Navigation",
  },
  {
    id: "ranks-page-rewards",
    target: "#tutorial-leaderboard-prize",
    title: "Weekly Prize",
    description: "The team or player securing the 1st position on the leaderboard at the weekly reset will receive a massive reward of 500 CG Coins! Dominate the arena to claim it!",
    page: "/leaderboard",
    interaction: "next",
    position: "bottom",
    emoji: "🏆",
    phase: "Navigation",
  },
  {
    id: "nav-profile",
    target: "#tutorial-nav-profile",
    title: "Profile — Tap It!",
    description: "Tap Profile to manage your account, edit your IGN & UID, change avatar, and access all settings!",
    page: "/leaderboard",
    interaction: "action",
    position: "top",
    emoji: "👤",
    phase: "Navigation",
  },

  // ═══ Phase 3: Profile Tour ═══
  {
    id: "profile-card",
    target: "#tutorial-profile-card",
    title: "Your Profile",
    description: "This card shows your IGN, username, Free Fire UID, and coin balance breakdown (Deposit vs Winnings). Make sure your UID is correct so admins can verify you!",
    page: "/profile",
    interaction: "next",
    position: "bottom",
    emoji: "📋",
    phase: "Profile",
  },
  {
    id: "profile-edit",
    target: "#tutorial-profile-edit",
    title: "Edit Profile",
    description: "Tap this button anytime to update your IGN, Free Fire UID, avatar photo, email, and phone number. A complete profile helps you get verified faster!",
    page: "/profile",
    interaction: "next",
    position: "bottom",
    emoji: "✏️",
    phase: "Profile",
  },
  {
    id: "profile-wallet",
    target: "#tutorial-profile-wallet",
    title: "Quick Menu",
    description: "From here you can access your Wallet, Squad Management, Match History, Notifications, Help & Support, and more. Everything is one tap away!",
    page: "/profile",
    interaction: "next",
    position: "top",
    emoji: "📱",
    phase: "Profile",
  },
  {
    id: "profile-squad-management-tap",
    target: "#tutorial-profile-squad-management",
    title: "Squad Management — Tap It!",
    description: "Tap the Squad Management tab to open the Squads portal! Let's explore how to join or create a team.",
    page: "/profile",
    interaction: "action",
    position: "top",
    emoji: "👥",
    phase: "Profile",
  },
  {
    id: "teams-join-squad",
    target: "#tutorial-teams-tab-join",
    title: "Join a Squad",
    description: "On this tab, you can search and request to join existing squads. Once the Squad Captain approves your request, you're in!",
    page: "/my-team",
    interaction: "next",
    position: "bottom",
    emoji: "🔍",
    phase: "Squads",
  },
  {
    id: "teams-create-squad",
    target: "#tutorial-teams-tab-create",
    title: "Create a Squad",
    description: "Want to lead your own squad? Tap the 'Create Squad' tab to name your team, upload a custom logo, and set up your roster of up to 4 players!",
    page: "/my-team",
    interaction: "next",
    position: "bottom",
    emoji: "👑",
    phase: "Squads",
  },

  // ═══ Phase 4: Header Features ═══
  {
    id: "header-chat",
    target: "#tutorial-header-chat",
    title: "Live Chat",
    description: "Chat with other players and admins in real-time! Get help, discuss strategies, and stay connected with the community.",
    page: "/teams",
    interaction: "next",
    position: "bottom",
    emoji: "💬",
    phase: "Features",
  },
  {
    id: "header-bell",
    target: "#tutorial-header-bell",
    title: "Notifications",
    description: "All your alerts appear here — tournament updates, team join requests, prize payouts, match start times, and admin messages. Enable push notifications to never miss a match!",
    page: "/teams",
    interaction: "next",
    position: "bottom",
    emoji: "🔔",
    phase: "Features",
  },
  {
    id: "profile-theme",
    target: "#tutorial-profile-theme",
    title: "Theme — Try It!",
    description: "Switch between dark and light mode from your Profile settings. Tap this option to change the look of the entire app.",
    page: "/profile",
    interaction: "action",
    position: "top",
    emoji: "🌗",
    phase: "Features",
  },
  {
    id: "header-tickets",
    target: "#header-support-tickets",
    title: "Support Tickets",
    description: "Need help? Tap the Ticket icon in the header to open a support ticket. Our admins are available 24/7 to assist you!",
    page: "/teams",
    interaction: "next",
    position: "bottom",
    emoji: "🎫",
    phase: "Features",
  },

  // ═══ Phase 5: Wallet Deep Dive ═══
  {
    id: "wallet-intro",
    target: null,
    title: "Wallet & Payments",
    description: "Let's explore the Wallet! This is where you manage all your money — set your username, add coins, track transactions, and withdraw your winnings. We'll navigate there now!",
    page: "/teams",
    interaction: "next",
    position: "center",
    emoji: "💳",
    phase: "Wallet",
  },
  {
    id: "wallet-balance",
    target: "#tutorial-wallet-balance",
    title: "Balance Overview",
    description: "Your total balance is split into two parts: Winnings (withdrawable to UPI/bank) and Deposited (for tournament entry fees only). 1 Coin = ₹1!",
    page: "/wallet",
    interaction: "next",
    position: "bottom",
    emoji: "💎",
    phase: "Wallet",
  },
  {
    id: "wallet-upi",
    target: "#tutorial-wallet-upi",
    title: "UPI & Username Setup",
    description: "Set your Primary UPI ID and display username here! Your UPI is required for deposits & withdrawals — use the same UPI for both. You can set it up now or come back later, just tap Next to continue!",
    page: "/wallet",
    interaction: "next",
    position: "bottom",
    emoji: "🔐",
    phase: "Wallet",
  },
  {
    id: "wallet-add-cash",
    target: "#tutorial-wallet-addcash",
    title: "How to Add Cash",
    description: "Tap the highlighted 'Add Cash' button to open the live deposit screen and follow the steps!",
    page: "/wallet",
    interaction: "action",
    position: "bottom",
    emoji: "💵",
    phase: "Wallet",
  },
  {
    id: "wallet-deposit-dialog",
    target: "#tutorial-deposit-dialog",
    title: "Deposit Cash Steps",
    description: "Follow these 3 easy steps to add cash:\n\n1. Select or enter the amount you want to deposit (minimum ₹10).\n2. Scan the generated QR code or click the UPI link to pay using any UPI app (GPay, PhonePe, Paytm).\n3. Copy the 12-digit UTR (Transaction ID) from your payment app, paste it here, and tap Submit to credit your coins instantly!",
    page: "/wallet",
    interaction: "next",
    position: "center",
    emoji: "💳",
    phase: "Wallet",
  },
  {
    id: "wallet-withdraw",
    target: "#tutorial-wallet-withdraw",
    title: "How to Withdraw",
    description: "Tap the highlighted 'Withdraw' button to open the cash-out form and view how it works!",
    page: "/wallet",
    interaction: "action",
    position: "bottom",
    emoji: "💸",
    phase: "Wallet",
  },
  {
    id: "wallet-withdraw-dialog",
    target: "#tutorial-withdraw-dialog",
    title: "Withdraw Winnings Steps",
    description: "To withdraw your hard-earned winnings:\n\n1. Enter the amount to withdraw (only Winnings balance can be withdrawn, not deposits).\n2. Your saved Primary UPI ID is pre-filled automatically.\n3. Enter the phone number linked to your UPI account.\n4. Click 'Confirm Withdrawal'. Winnings are verified and credited within 24-48 hours!",
    page: "/wallet",
    interaction: "next",
    position: "center",
    emoji: "💰",
    phase: "Wallet",
  },

  // ═══ Phase 6: Finale ═══
  {
    id: "complete",
    target: null,
    title: "You're All Set!",
    description: "You now know everything about CLUTCHGROUND! Verify your Free Fire UID in your profile, set up your UPI in the Wallet, join your first tournament, and claim your throne! 🏆",
    page: "/wallet",
    interaction: "next",
    position: "center",
    emoji: "🎉",
    phase: "Complete",
  },
];

const STORAGE_KEY = "clutchground_live_tutorial_completed";

/* ──────────────────────────────────────────────────
   Zustand Store
   ────────────────────────────────────────────────── */
interface TutorialStore {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  /** Has the user already completed the tutorial in a prior session? */
  isCompleted: boolean;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  /** Reset completed state (for "Replay Tutorial") */
  replayTutorial: () => void;
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  isActive: false,
  currentStep: 0,
  steps: TUTORIAL_STEPS,
  isCompleted:
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false,

  startTutorial: () => {
    set({ isActive: true, currentStep: 0 });
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep >= steps.length - 1) {
      get().completeTutorial();
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  skipTutorial: () => {
    set({ isActive: false, currentStep: 0, isCompleted: true });
    localStorage.setItem(STORAGE_KEY, "true");
    // Also mark old tutorial as seen
    localStorage.setItem("god_esports_tutorial_driver_seen", "true");
  },

  completeTutorial: () => {
    set({ isActive: false, currentStep: 0, isCompleted: true });
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem("god_esports_tutorial_driver_seen", "true");
  },

  replayTutorial: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("god_esports_tutorial_driver_seen");
    set({ isCompleted: false, isActive: true, currentStep: 0 });
  },
}));
