import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AdminNavBar } from "@/components/AdminNavBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-client";
import { getProfileShopAdminConfig, saveProfileShopAdminConfig } from "@/api";
import { GodCoin } from "@/components/GodCoin";
import type { ProfileCosmeticItem, ProfileShopConfig } from "@/lib/profile-customization";
import {
  DEFAULT_PROFILE_SHOP,
  DP_ANIMATIONS,
  BANNER_PRESETS,
  PROFILE_EFFECTS,
  ANIMATION_CLASS,
} from "@/lib/profile-customization";
import { ProfileEffectRenderer } from "@/components/profile/ProfileEffectRenderer";

export const Route = createFileRoute("/_app/admin/profile-shop")({
  head: () => ({ meta: [{ title: "Profile Shop — Admin" }] }),
  component: AdminProfileShopPage,
});

function AdminProfileShopPage() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<ProfileShopConfig>(DEFAULT_PROFILE_SHOP);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"dp" | "banners" | "effects">("dp");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const data = await (getProfileShopAdminConfig as any)({ data: user.id });
      setConfig(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load shop");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    setExpandedIdx(null);
  }, [activeTab]);

  const currentItems =
    activeTab === "dp"
      ? config.frames || []
      : activeTab === "banners"
        ? config.banners || []
        : config.effects || [];

  const updateItem = (idx: number, patch: Partial<ProfileCosmeticItem>) => {
    setConfig((prev) => {
      const key = activeTab === "dp" ? "frames" : activeTab === "banners" ? "banners" : "effects";
      const items = (prev[key] || []).map((item, i) => (i === idx ? { ...item, ...patch } : item));
      return { ...prev, [key]: items };
    });
  };

  const addItem = () => {
    const type =
      activeTab === "dp"
        ? ("frame" as const)
        : activeTab === "banners"
          ? ("banner" as const)
          : ("effect" as const);
    const newItem: ProfileCosmeticItem = {
      id: `${type}-custom-${Date.now()}`,
      label: `New ${activeTab === "dp" ? "DP Anim" : activeTab === "banners" ? "Banner" : "Effect"}`,
      type,
      cost: 100,
      value: `custom_${Date.now()}`,
    };
    setConfig((prev) => {
      const key = activeTab === "dp" ? "frames" : activeTab === "banners" ? "banners" : "effects";
      return {
        ...prev,
        [key]: [...(prev[key] || []), newItem],
      };
    });
    setExpandedIdx(currentItems.length);
  };

  const removeItem = (idx: number) => {
    if (currentItems.length <= 1) return;
    setConfig((prev) => {
      const key = activeTab === "dp" ? "frames" : activeTab === "banners" ? "banners" : "effects";
      const items = (prev[key] || []).filter((_, i) => i !== idx);
      return { ...prev, [key]: items };
    });
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await (saveProfileShopAdminConfig as any)({ data: { adminId: user.id, config } });
      toast.success("Profile shop saved!");
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-bold text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-card border-b border-border/50 px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Admin
            </div>
            <h1 className="font-display font-black text-xl text-foreground">
              {activeTab === "dp" && "DP Animations"}
              {activeTab === "banners" && "Profile Banners"}
              {activeTab === "effects" && "Profile Effects"}
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl font-bold text-xs h-9 px-4"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-secondary/50 rounded-xl py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground font-display">
              Items
            </p>
            <p className="font-display font-black text-sm text-blue-500">{currentItems.length}</p>
          </div>
          <div className="flex-1 bg-secondary/50 rounded-xl py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground font-display">
              Free
            </p>
            <p className="font-display font-black text-sm text-emerald-500">
              {currentItems.filter((a) => a.cost === 0).length}
            </p>
          </div>
          <div className="flex-1 bg-secondary/50 rounded-xl py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground font-display">
              Paid
            </p>
            <p className="font-display font-black text-sm text-amber-500">
              {currentItems.filter((a) => a.cost > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide border-b border-border/20 bg-card">
        <div className="flex gap-2 min-w-max pb-1">
          {[
            { id: "dp", label: "DP Animations" },
            { id: "banners", label: "Banners" },
            { id: "effects", label: "Effects" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
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

      <div className="px-4 mt-4 space-y-3">
        {/* Info */}
        <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            Manage{" "}
            <strong className="text-foreground">
              {activeTab === "dp"
                ? "DP Animations"
                : activeTab === "banners"
                  ? "Banners"
                  : "Effects"}
            </strong>{" "}
            that users can buy. Change <strong className="text-foreground">names and prices</strong>
            .
          </p>
        </div>

        {/* Items List */}
        {currentItems.map((item, idx) => {
          const isExpanded = expandedIdx === idx;
          const registryDef =
            activeTab === "dp"
              ? DP_ANIMATIONS.find((a) => a.value === item.value)
              : activeTab === "banners"
                ? BANNER_PRESETS.find((a) => a.value === item.value)
                : PROFILE_EFFECTS.find((a) => a.value === item.value);

          return (
            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Collapsed header */}
              <button
                type="button"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-secondary/20 transition-colors"
              >
                <span className="text-xl">{registryDef?.emoji || "✨"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{item.value}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-foreground shrink-0">
                  <GodCoin className="w-3 h-3 text-amber-400" />
                  {item.cost}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded editor */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
                      {/* Visual Preview */}
                      <div className="flex justify-center py-2 bg-black/20 rounded-xl">
                        {activeTab === "dp" ? (
                          <div
                            className="relative flex items-center justify-center bg-black/40 border border-border/40 rounded-2xl overflow-hidden"
                            style={{ width: 100, height: 100 }}
                          >
                            <div
                              className={`relative w-14 h-14 rounded-full flex items-center justify-center ${item.value === "none" ? "" : ANIMATION_CLASS[item.value] || ""}`}
                            >
                              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-card bg-secondary/80 flex items-center justify-center">
                                <span className="text-2xl">{registryDef?.emoji || "✨"}</span>
                              </div>
                            </div>
                          </div>
                        ) : activeTab === "banners" ? (
                          <div
                            className={`relative border border-border/40 rounded-2xl overflow-hidden ${item.value === "default" ? "profile-banner-default" : `profile-banner-${item.value}`}`}
                            style={{ width: 100, height: 100 }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <span className="text-2xl">{registryDef?.emoji || "🌌"}</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="relative flex items-center justify-center bg-black/40 border border-border/40 rounded-2xl overflow-hidden"
                            style={{ width: 100, height: 100 }}
                          >
                            <ProfileEffectRenderer value={item.value} />
                            <span className="text-2xl relative z-10">
                              {registryDef?.emoji || "🔥"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                            Display Name
                          </label>
                          <input
                            className="w-full h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm font-bold outline-none focus:border-primary"
                            value={item.label}
                            onChange={(e) => updateItem(idx, { label: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-1">
                            Price <GodCoin className="w-2 h-2 text-amber-400" />
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="w-full h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm font-bold outline-none focus:border-primary"
                            value={item.cost}
                            onChange={(e) => updateItem(idx, { cost: Number(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                          Value Key
                        </label>
                        <input
                          className="w-full h-10 rounded-lg border border-border bg-secondary/20 px-3 text-xs font-mono text-muted-foreground outline-none"
                          value={item.value}
                          onChange={(e) => updateItem(idx, { value: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                          Item ID
                        </label>
                        <input
                          className="w-full h-10 rounded-lg border border-border bg-secondary/20 px-3 text-xs font-mono text-muted-foreground outline-none"
                          value={item.id}
                          onChange={(e) => updateItem(idx, { id: e.target.value })}
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={currentItems.length <= 1}
                        className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Cosmetic
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Add new */}
        <Button
          variant="outline"
          onClick={addItem}
          className="w-full h-11 rounded-xl text-xs font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Cosmetic
        </Button>
      </div>

      <AdminNavBar />
    </div>
  );
}
