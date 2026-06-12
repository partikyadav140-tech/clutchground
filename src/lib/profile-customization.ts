export type ProfileCosmeticItem = {
  id: string;
  label: string;
  type: "animation" | "frame" | "banner" | "effect";
  cost: number;
  preview?: string;
  value: string;
};

export type ProfileShopConfig = {
  frames: ProfileCosmeticItem[];
  effects: ProfileCosmeticItem[];
  banners: ProfileCosmeticItem[];
};

export const PROFILE_SHOP_SETTINGS_KEY = "profile_shop_config";

/* ── Open Animation Registry ── */

/* ── DP Animation Registry ── */
export type DpAnimationDef = {
  id: string;
  value: string;
  label: string;
  description: string;
  cost: number;
  color: string;
  emoji: string;
  tier: "free" | "common" | "rare" | "epic" | "legendary";
  type: "frame";
};

export const DP_ANIMATIONS: DpAnimationDef[] = [
  { id: "dp-none",  value: "none",  label: "None",       description: "No avatar animation border",                          cost: 0,   color: "#64748b", emoji: "👤", tier: "free", type: "frame" },
  { id: "dp-pulse", value: "pulse", label: "Heartbeat",   description: "Soft heartbeat pulse ripple around the avatar",       cost: 50,  color: "#94a3b8", emoji: "💓", tier: "common", type: "frame" },
  { id: "dp-glow",  value: "glow",  label: "Solar Flare", description: "Vibrant solar orange glow with breathing effect",   cost: 120, color: "#f97316", emoji: "🔥", tier: "rare", type: "frame" },
  { id: "dp-fire",  value: "fire",  label: "Inferno",     description: "Flames erupting from the avatar with floating embers", cost: 200, color: "#ef4444", emoji: "🌋", tier: "epic", type: "frame" },
  { id: "dp-neon",  value: "neon",  label: "Cyber Surge", description: "Spinning colorful neon RGB gradient ring border",     cost: 350, color: "#a78bfa", emoji: "🌈", tier: "legendary", type: "frame" },
];

/* ── Profile Banners Registry ── */
export type BannerPresetDef = {
  id: string;
  value: string;
  label: string;
  description: string;
  cost: number;
  color: string;
  emoji: string;
  tier: "free" | "common" | "rare" | "epic" | "legendary";
  type: "banner";
};

export const BANNER_PRESETS: BannerPresetDef[] = [
  { id: "banner-default", value: "default", label: "Default Space", description: "Standard deep space gradient background", cost: 0,   color: "#64748b", emoji: "🌌", tier: "free", type: "banner" },
  { id: "banner-blaze",   value: "blaze",   label: "Infernal Blaze", description: "Fiery orange-red static gradient background", cost: 80,  color: "#f97316", emoji: "🔥", tier: "rare", type: "banner" },
  { id: "banner-void",    value: "void",    label: "Deep Void",      description: "Dark cosmic violet static gradient background", cost: 80,  color: "#7c3aed", emoji: "👾", tier: "rare", type: "banner" },
  { id: "banner-royal",   value: "royal",   label: "Royal Purple",   description: "Sunset golden-purple luxury static gradient", cost: 120, color: "#fbbf24", emoji: "👑", tier: "epic", type: "banner" },
  // Animated banners
  { id: "banner-cyber-anim", value: "cyber_anim", label: "Cyber Wave (Animated)", description: "Looping cyan-magenta holographic wave background", cost: 250, color: "#06b6d4", emoji: "⚡", tier: "epic", type: "banner" },
  { id: "banner-fire-anim",  value: "fire_anim",  label: "Solar Wind (Animated)",  description: "Dynamic moving cosmic flame solar background",   cost: 350, color: "#ef4444", emoji: "☄️", tier: "legendary", type: "banner" },
];

/* ── Profile Effects Registry ── */
export type ProfileEffectDef = {
  id: string;
  value: string;
  label: string;
  description: string;
  cost: number;
  color: string;
  emoji: string;
  tier: "free" | "common" | "rare" | "epic" | "legendary";
  type: "effect";
};

export const PROFILE_EFFECTS: ProfileEffectDef[] = [
  { id: "effect-none",      value: "none",      label: "None",            description: "No profile card effects",                              cost: 0,   color: "#64748b", emoji: "❌", tier: "free", type: "effect" },
  { id: "effect-sparkles",  value: "sparkles",  label: "Magic Sparkles",   description: "Twinkling golden sparkles falling down the profile",    cost: 100, color: "#fbbf24", emoji: "✨", tier: "rare", type: "effect" },
  { id: "effect-hearts",    value: "hearts",    label: "Lovestruck",      description: "Floating neon pink hearts drifting upwards",           cost: 150, color: "#ec4899", emoji: "💖", tier: "rare", type: "effect" },
  { id: "effect-lightning", value: "lightning", label: "Electric Storm",  description: "Intermittent purple lightning sparks across the card",   cost: 250, color: "#a78bfa", emoji: "⚡", tier: "epic", type: "effect" },
  { id: "effect-flames",    value: "flames",    label: "Phoenix Aura",    description: "Rising animated flames at the bottom of the profile",   cost: 400, color: "#ef4444", emoji: "🔥", tier: "legendary", type: "effect" },
];

export const DEFAULT_PROFILE_SHOP: ProfileShopConfig = {
  frames: DP_ANIMATIONS.map((a) => ({
    id: a.id,
    label: a.label,
    type: "frame" as const,
    cost: a.cost,
    value: a.value,
  })),
  effects: PROFILE_EFFECTS.map((a) => ({
    id: a.id,
    label: a.label,
    type: "effect" as const,
    cost: a.cost,
    value: a.value,
  })),
  banners: BANNER_PRESETS.map((a) => ({
    id: a.id,
    label: a.label,
    type: "banner" as const,
    cost: a.cost,
    value: a.value,
  })),
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
      frames: p.frames?.length ? p.frames : DEFAULT_PROFILE_SHOP.frames,
      banners: p.banners?.length ? p.banners : DEFAULT_PROFILE_SHOP.banners,
      effects: p.effects?.length ? p.effects : DEFAULT_PROFILE_SHOP.effects,
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

// Legacy — kept for backwards compatibility but not used in new flow
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
