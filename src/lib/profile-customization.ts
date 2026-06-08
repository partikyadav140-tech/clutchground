export type ProfileCosmeticItem = {
  id: string;
  label: string;
  type: "animation" | "frame" | "banner";
  cost: number;
  preview?: string;
  value: string;
};

export type ProfileShopConfig = {
  animations: ProfileCosmeticItem[];
  frames: ProfileCosmeticItem[];
  banners: ProfileCosmeticItem[];
};

export const PROFILE_SHOP_SETTINGS_KEY = "profile_shop_config";

export const DEFAULT_PROFILE_SHOP: ProfileShopConfig = {
  animations: [
    { id: "anim-none", label: "None", type: "animation", cost: 0, value: "none" },
    { id: "anim-pulse", label: "Pulse", type: "animation", cost: 50, value: "pulse" },
    { id: "anim-glow", label: "Glow", type: "animation", cost: 75, value: "glow" },
    { id: "anim-fire", label: "Fire", type: "animation", cost: 100, value: "fire" },
    { id: "anim-neon", label: "Neon", type: "animation", cost: 150, value: "neon" },
  ],
  frames: [
    { id: "frame-none", label: "None", type: "frame", cost: 0, value: "none" },
    { id: "frame-bronze", label: "Bronze", type: "frame", cost: 30, value: "bronze" },
    { id: "frame-gold", label: "Gold", type: "frame", cost: 80, value: "gold" },
    { id: "frame-diamond", label: "Diamond", type: "frame", cost: 150, value: "diamond" },
  ],
  banners: [
    { id: "banner-default", label: "Default", type: "banner", cost: 0, value: "default" },
    { id: "banner-blaze", label: "Blaze", type: "banner", cost: 40, value: "blaze" },
    { id: "banner-void", label: "Void", type: "banner", cost: 60, value: "void" },
    { id: "banner-royal", label: "Royal", type: "banner", cost: 100, value: "royal" },
  ],
};

export const BANNER_GRADIENTS: Record<string, string> = {
  default: "linear-gradient(135deg, #1a2234 0%, #0c1018 50%, #1a1030 100%)",
  blaze: "linear-gradient(135deg, #ff6b00 0%, #ff0055 50%, #1a0a00 100%)",
  void: "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #0c1018 100%)",
  royal: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #7c3aed 100%)",
};

export type AchievementDef = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_win", label: "First Booyah", emoji: "🏆", description: "Won your first match" },
  { id: "veteran", label: "Veteran", emoji: "🎖️", description: "Played 10+ matches" },
  { id: "slayer", label: "Slayer", emoji: "💀", description: "50+ total kills" },
  { id: "champion", label: "Champion", emoji: "👑", description: "5+ first place finishes" },
  { id: "high_roller", label: "High Roller", emoji: "💰", description: "Earned 1000+ CG" },
  { id: "captain", label: "Squad Captain", emoji: "🛡️", description: "Leads a squad" },
];

export function computeAchievements(stats: {
  matchesPlayed?: number;
  totalKills?: number;
  firstPlaces?: number;
  totalEarnings?: number;
  isCaptain?: boolean;
}): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  if ((stats.firstPlaces || 0) >= 1) unlocked.push(ACHIEVEMENT_DEFS.find((a) => a.id === "first_win")!);
  if ((stats.matchesPlayed || 0) >= 10) unlocked.push(ACHIEVEMENT_DEFS.find((a) => a.id === "veteran")!);
  if ((stats.totalKills || 0) >= 50) unlocked.push(ACHIEVEMENT_DEFS.find((a) => a.id === "slayer")!);
  if ((stats.firstPlaces || 0) >= 5) unlocked.push(ACHIEVEMENT_DEFS.find((a) => a.id === "champion")!);
  if ((stats.totalEarnings || 0) >= 1000) unlocked.push(ACHIEVEMENT_DEFS.find((a) => a.id === "high_roller")!);
  if (stats.isCaptain) unlocked.push(ACHIEVEMENT_DEFS.find((a) => a.id === "captain")!);
  return unlocked.filter(Boolean);
}

export function parseProfileShopConfig(raw: string | null | undefined): ProfileShopConfig {
  if (!raw) return { ...DEFAULT_PROFILE_SHOP };
  try {
    const p = JSON.parse(raw) as Partial<ProfileShopConfig>;
    return {
      animations: p.animations?.length ? p.animations : DEFAULT_PROFILE_SHOP.animations,
      frames: p.frames?.length ? p.frames : DEFAULT_PROFILE_SHOP.frames,
      banners: p.banners?.length ? p.banners : DEFAULT_PROFILE_SHOP.banners,
    };
  } catch {
    return { ...DEFAULT_PROFILE_SHOP };
  }
}

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export const ANIMATION_CLASS: Record<string, string> = {
  none: "",
  pulse: "profile-anim-pulse",
  glow: "profile-anim-glow",
  fire: "profile-anim-fire",
  neon: "profile-anim-neon",
};

export const FRAME_CLASS: Record<string, string> = {
  none: "",
  bronze: "profile-frame-bronze",
  gold: "profile-frame-gold",
  diamond: "profile-frame-diamond",
};
