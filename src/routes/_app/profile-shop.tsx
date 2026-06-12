import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Sparkles,
  Check,
  Lock,
  Crown,
  ShieldCheck,
  Zap,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-client";
import { GodCoin } from "@/components/GodCoin";
import { Button } from "@/components/ui/button";
import {
  DP_ANIMATIONS,
  BANNER_PRESETS,
  PROFILE_EFFECTS,
  ANIMATION_CLASS,
  type DpAnimationDef,
} from "@/lib/profile-customization";
import {
  getProfile,
  getProfileShop,
  purchaseProfileCosmetic,
  updateProfile,
} from "@/api";
import { ProfileEffectRenderer } from "@/components/profile/ProfileEffectRenderer";

export const Route = createFileRoute("/_app/profile-shop")({
  head: () => ({
    meta: [{ title: "Cosmetics Shop — ClutchGround" }],
  }),
  component: ProfileShopPage,
});

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  free:      { label: "Free",      color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", icon: Zap },
  common:    { label: "Common",    color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)",   icon: Star },
  rare:      { label: "Rare",      color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)",   icon: ShieldCheck },
  epic:      { label: "Epic",      color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", icon: Sparkles },
  legendary: { label: "Legendary", color: "#eab308", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)",   icon: Crown },
};

function ProfileShopPage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"dp" | "banners" | "effects">("dp");

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [p, shop] = await Promise.all([
        (getProfile as any)({ data: user.id }),
        getProfileShop(),
      ]);
      setProfile(p);
      setShopConfig(shop);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load shop");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-bold">Login to access the cosmetic shop</p>
          <Button asChild><Link to="/login">Login</Link></Button>
        </div>
      </div>
    );
  }

  const owned: string[] = profile?.owned_cosmetics || [];
  const equippedFrame = profile?.profile_frame || "none";
  const equippedBanner = profile?.banner_preset || "default";
  const equippedEffect = profile?.profile_effect || "none";
  const balance = (profile?.deposit_balance || 0) + (profile?.winning_balance || 0);

  const handleBuy = async (anim: any) => {
    if (!user || !profile) return;
    setPurchasing(anim.id);
    try {
      const res = await (purchaseProfileCosmetic as any)({
        data: {
          userId: user.id,
          itemId: anim.id,
        },
      });
      toast.success(`Unlocked ${anim.label}!`, { description: `${anim.cost} CG deducted` });
      await refresh();
      // Sync balance to navbar
      if (user) {
        const p = await (getProfile as any)({ data: user.id });
        setUser({ ...user, deposit_balance: p?.deposit_balance, winning_balance: p?.winning_balance });
      }
    } catch (e: any) {
      toast.error(e?.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquip = async (anim: any) => {
    if (!user) return;
    setEquipping(anim.id);
    try {
      const isFrame = anim.type === "frame" || activeTab === "dp";
      const isBanner = anim.type === "banner" || activeTab === "banners";
      const isEffect = anim.type === "effect" || activeTab === "effects";
      let fieldKey = "profile_frame";
      if (isFrame) fieldKey = "profile_frame";
      else if (isBanner) fieldKey = "banner_preset";
      else if (isEffect) fieldKey = "profile_effect";

      await (updateProfile as any)({
        data: {
          userId: user.id,
          [fieldKey]: anim.value,
        },
      });
      toast.success(`Equipped ${anim.label}!`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to equip");
    } finally {
      setEquipping(null);
    }
  };

  const tiers = ["all", "free", "common", "rare", "epic", "legendary"];
  const currentRegistry =
    activeTab === "dp"
      ? DP_ANIMATIONS
      : activeTab === "banners"
        ? BANNER_PRESETS
        : PROFILE_EFFECTS;

  const currentItems = useMemo(() => {
    const dbKey =
      activeTab === "dp"
        ? "frames"
        : activeTab === "banners"
          ? "banners"
          : "effects";

    const dbItems = (shopConfig && shopConfig[dbKey]) || [];

    // Map local registry items to update labels and costs
    const localMapped = currentRegistry.map((localItem) => {
      const dbItem = dbItems.find((d: any) => d.value === localItem.value || d.id === localItem.id);
      if (dbItem) {
        return {
          ...localItem,
          cost: dbItem.cost,
          label: dbItem.label,
        };
      }
      return localItem;
    });

    // Find any extra custom items that the admin added which aren't in currentRegistry
    const extraItems = dbItems
      .filter((d: any) => !currentRegistry.some((local) => local.value === d.value || local.id === d.id))
      .map((d: any) => ({
        id: d.id,
        value: d.value,
        label: d.label,
        description: "Custom admin cosmetic item",
        cost: d.cost,
        color: "#a78bfa",
        emoji: d.emoji || "✨",
        tier: "rare" as const,
        type: activeTab === "dp" ? ("frame" as const) : activeTab === "banners" ? ("banner" as const) : ("effect" as const),
      }));

    return [...localMapped, ...extraItems];
  }, [currentRegistry, shopConfig, activeTab]);

  const filteredAnims = filter === "all"
    ? currentItems
    : currentItems.filter((a) => a.tier === filter);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border/50 px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/profile" className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Profile Shop
            </div>
            <h1 className="font-display font-black text-xl text-foreground">
              {activeTab === "dp" && "DP Animations"}
              {activeTab === "banners" && "Profile Banners"}
              {activeTab === "effects" && "Profile Effects"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/50 border border-border rounded-xl px-3 py-2">
            <GodCoin className="w-4 h-4 text-amber-400" />
            <span className="font-display font-black text-sm text-foreground">{balance}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {activeTab === "dp" && "Add glowing, pulsating, and animated color effects around your profile picture!"}
          {activeTab === "banners" && "Change the moving gradient background behind your profile card!"}
          {activeTab === "effects" && "Overlay animated visual effects like flames, lightning, or sparkles on your profile!"}
        </p>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {[
            { id: "dp", label: "DP Anims" },
            { id: "banners", label: "Banners" },
            { id: "effects", label: "Effects" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setFilter("all"); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all press-effect ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground bg-secondary/40 border border-border"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier filter */}
      <div className="px-4 pt-2 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          {tiers.map((t) => {
            const tc = TIER_CONFIG[t];
            const isActive = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-muted-foreground bg-secondary/40 border border-border"
                }`}
                style={
                  isActive
                    ? { background: t === "all" ? "var(--gradient-primary)" : tc?.color || "var(--primary)" }
                    : {}
                }
              >
                {t === "all" ? "All" : tc?.label || t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Animations Grid */}
      <div className="px-4 mt-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAnims.map((anim, i) => {
              const isOwned = anim.cost === 0 || owned.includes(anim.id);
              const isEquipped = 
                anim.type === "frame"
                  ? equippedFrame === anim.value
                  : anim.type === "banner"
                    ? equippedBanner === anim.value
                    : equippedEffect === anim.value;

              const canAfford = balance >= anim.cost;
              const tc = TIER_CONFIG[anim.tier];
              const TierIcon = tc.icon;

              return (
                <motion.div
                  key={anim.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border overflow-hidden bg-card"
                  style={{ borderColor: isEquipped ? `${anim.color}60` : "var(--border)" }}
                >
                  <div className="flex gap-3 p-3">
                    {/* Preview box depending on tab */}
                    {activeTab === "dp" ? (
                      <div className="relative flex items-center justify-center shrink-0 bg-black/40 border border-border/40 rounded-2xl overflow-hidden" style={{ width: 90, height: 90 }}>
                        <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${anim.value === "none" ? "" : ANIMATION_CLASS[anim.value] || ""}`}>
                          <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-card bg-secondary/80 flex items-center justify-center">
                            <span className="text-xl">{anim.emoji}</span>
                          </div>
                        </div>
                      </div>
                    ) : activeTab === "banners" ? (
                      <div className={`relative shrink-0 border border-border/40 rounded-2xl overflow-hidden ${anim.value === "default" ? "profile-banner-default" : `profile-banner-${anim.value}`}`} style={{ width: 90, height: 90 }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="text-xl">{anim.emoji}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center shrink-0 bg-black/40 border border-border/40 rounded-2xl overflow-hidden" style={{ width: 90, height: 90 }}>
                        <ProfileEffectRenderer value={anim.value} />
                        <span className="text-xl relative z-10">{anim.emoji}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-display font-black text-sm text-foreground truncate">{anim.label}</h3>
                          {isEquipped && (
                            <span className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[8px] font-bold uppercase shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase"
                            style={{ color: tc.color, background: tc.bg, border: `1px solid ${tc.border}` }}
                          >
                            <TierIcon className="w-2.5 h-2.5" />
                            {tc.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                          {anim.description}
                        </p>
                      </div>

                      {/* Price + action */}
                      <div className="flex items-center justify-between mt-2">
                        {anim.cost === 0 ? (
                          <span className="text-xs font-bold text-emerald-500">Free</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                            <GodCoin className="w-3 h-3 text-amber-400" />
                            {anim.cost}
                          </span>
                        )}

                        {isEquipped ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                            <Check className="w-3 h-3" /> Equipped
                          </span>
                        ) : isOwned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 rounded-lg text-[10px] font-bold"
                            disabled={equipping === anim.id}
                            onClick={() => handleEquip(anim)}
                          >
                            {equipping === anim.id ? (
                              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Equip"
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 px-3 rounded-lg text-[10px] font-bold"
                            disabled={!canAfford || purchasing === anim.id}
                            onClick={() => handleBuy(anim)}
                          >
                            {purchasing === anim.id ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : !canAfford ? (
                              <span className="flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Not enough CG
                              </span>
                            ) : (
                              "Buy & Equip"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
