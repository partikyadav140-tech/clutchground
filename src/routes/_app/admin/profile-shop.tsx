import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";
import { AdminNavBar } from "@/components/AdminNavBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-client";
import { getProfileShopAdminConfig, saveProfileShopAdminConfig } from "@/api";
import type { ProfileCosmeticItem, ProfileShopConfig } from "@/lib/profile-customization";
import { DEFAULT_PROFILE_SHOP } from "@/lib/profile-customization";

export const Route = createFileRoute("/_app/admin/profile-shop")({
  head: () => ({ meta: [{ title: "Profile Shop — Admin" }] }),
  component: AdminProfileShopPage,
});

type Section = "animations" | "frames" | "banners";

function emptyItem(type: ProfileCosmeticItem["type"]): ProfileCosmeticItem {
  return {
    id: `${type}-${Date.now()}`,
    label: "New item",
    type,
    cost: 50,
    value: "custom",
  };
}

function AdminProfileShopPage() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<ProfileShopConfig>(DEFAULT_PROFILE_SHOP);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<Section>("animations");

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

  const items = config[section];

  const updateItem = (idx: number, patch: Partial<ProfileCosmeticItem>) => {
    setConfig((prev) => {
      const next = { ...prev };
      next[section] = prev[section].map((item, i) => (i === idx ? { ...item, ...patch } : item));
      return next;
    });
  };

  const addItem = () => {
    setConfig((prev) => ({
      ...prev,
      [section]: [...prev[section], emptyItem(section === "animations" ? "animation" : section === "frames" ? "frame" : "banner")],
    }));
  };

  const removeItem = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await (saveProfileShopAdminConfig as any)({ data: { adminId: user.id, config } });
      toast.success("Profile shop saved");
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <p className="font-bold text-muted-foreground">Admin access required</p>
        <Link to="/" className="text-primary text-sm font-bold mt-2 inline-block">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold text-xs h-9">
          <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="px-4 mb-4">
        <h1 className="font-display font-black text-xl flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Profile cosmetics shop
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Set CG coin prices for profile animations, frames, and banners.</p>
      </div>

      <div className="px-4 flex gap-2 mb-4">
        {(["animations", "frames", "banners"] as Section[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${
              section === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                className="flex-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm font-bold"
                value={item.label}
                onChange={(e) => updateItem(idx, { label: e.target.value })}
                placeholder="Label"
              />
              <button type="button" onClick={() => removeItem(idx)} className="p-2 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                CG cost
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm"
                  value={item.cost}
                  onChange={(e) => updateItem(idx, { cost: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                Value key
                <input
                  className="mt-1 w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm font-mono"
                  value={item.value}
                  onChange={(e) => updateItem(idx, { value: e.target.value })}
                />
              </label>
            </div>
            <input
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs font-mono text-muted-foreground"
              value={item.id}
              onChange={(e) => updateItem(idx, { id: e.target.value })}
              placeholder="Item ID"
            />
          </div>
        ))}
        <Button variant="outline" onClick={addItem} className="w-full rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Add {section.slice(0, -1)}
        </Button>
      </div>

      <AdminNavBar />
    </div>
  );
}
