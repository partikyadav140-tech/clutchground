import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Save,
  Sparkles,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Palette,
  Gift,
  Coins,
  ShoppingBag,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AdminNavBar } from "@/components/AdminNavBar";
import { Button } from "@/components/ui/button";
import { SpinWheel } from "@/components/spin-wheel/SpinWheel";
import { useAuth } from "@/lib/auth-client";
import { getSpinWheelAdminConfig, saveSpinWheelAdminConfig } from "@/api";
import { SkeletonAdminTable } from "@/components/SkeletonPage";
import {
  SPIN_MAX_ACTIVE_PRIZES,
  type SpinPack,
  type SpinSegment,
  type SpinWheelConfig,
} from "@/lib/spin-wheel";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/admin/spin-wheel")({
  head: () => ({ meta: [{ title: "Spin Wheel — Admin" }] }),
  loader: async () => null,
  component: AdminSpinWheelPage,
});

/* ── Collapsible Section ── */
function Section({
  title,
  icon: Icon,
  color,
  badge,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: any;
  color: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-secondary/30 transition-colors"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-[13px] text-foreground">{title}</h2>
        </div>
        {badge && (
          <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Field Label ── */
function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
        {children}
      </label>
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

function AdminSpinWheelPage() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<SpinWheelConfig | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const load = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const data = await (getSpinWheelAdminConfig as any)({ data: user.id });
      setConfig(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load config");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  if (loading || fetching) {
    return (
      <div className="min-h-[60vh] bg-background pb-6">
        <SkeletonAdminTable />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive font-bold">Access denied</p>
      </div>
    );
  }

  if (!config) return null;

  const activeCount = config.activePrizeIds.length;
  const totalSegments = config.segments.reduce((sum, s) => sum + (s.quantity || 1), 0);

  const toggleActivePrize = (id: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const has = prev.activePrizeIds.includes(id);
      let next = has ? prev.activePrizeIds.filter((x) => x !== id) : [...prev.activePrizeIds, id];
      if (next.length > SPIN_MAX_ACTIVE_PRIZES) {
        next = [...next.slice(1)];
      }
      return { ...prev, activePrizeIds: next };
    });
  };

  const updateSegment = (index: number, patch: Partial<SpinSegment>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const segments = [...prev.segments];
      segments[index] = { ...segments[index], ...patch };
      return { ...prev, segments };
    });
  };

  const addSegment = () => {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        segments: [
          ...prev.segments,
          {
            id: `seg-custom-${Date.now()}`,
            label: "10 CG",
            amount: 10,
            quantity: 1,
            color: "#22C55E",
          },
        ],
      };
    });
  };

  const removeSegment = (index: number) => {
    setConfig((prev) => {
      if (!prev || prev.segments.length <= 1) return prev;
      const removed = prev.segments[index];
      const segments = prev.segments.filter((_, i) => i !== index);
      const activePrizeIds = prev.activePrizeIds.filter((id) => id !== removed.id);
      return {
        ...prev,
        segments,
        activePrizeIds: activePrizeIds.length ? activePrizeIds : [segments[0].id],
      };
    });
  };

  const handleSave = async () => {
    if (!user || !config) return;
    setSaving(true);
    try {
      await (saveSpinWheelAdminConfig as any)({ data: { adminId: user.id, config } });
      toast.success("Spin wheel saved!");
      setPreviewRotation((r) => r + 30);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-28">
      {/* ── Header ── */}
      <div className="relative bg-card border-b border-border/50 px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Admin
            </div>
            <h1 className="font-display font-black text-xl text-foreground">Spin Wheel</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground active:scale-95 transition-all"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide" : "Preview"}
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 mt-3">
          {[
            { label: "Segments", value: config.segments.length, color: "text-blue-500" },
            { label: "On Wheel", value: totalSegments, color: "text-purple-500" },
            {
              label: "Active",
              value: `${activeCount}/${SPIN_MAX_ACTIVE_PRIZES}`,
              color: "text-emerald-500",
            },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-secondary/50 rounded-xl py-2 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              <p className={`font-display font-black text-sm ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 mt-4">
        {/* ── Live Preview (collapsible) ── */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-2xl border border-border p-4 flex justify-center shadow-sm">
                <SpinWheel
                  segments={config.segments}
                  activePrizeIds={config.activePrizeIds}
                  rotation={previewRotation}
                  size={220}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active Prizes ── */}
        <Section
          title="Winnable Prizes"
          icon={Gift}
          color="bg-emerald-500/10 text-emerald-500"
          badge={`${activeCount}/${SPIN_MAX_ACTIVE_PRIZES}`}
        >
          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 -mt-1">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Only <strong className="text-foreground">active prizes</strong> can be won. The wheel
              still shows all segments visually, but users can only land on these.
            </p>
          </div>
          <div className="space-y-2">
            {config.segments.map((seg) => {
              const active = config.activePrizeIds.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => toggleActivePrize(seg.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all active:scale-[0.98] ${
                    active
                      ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                      : "border-border bg-secondary/20"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border-2"
                    style={{
                      background: seg.color,
                      borderColor: active ? "var(--primary)" : "transparent",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{seg.label}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <GodCoin className="w-2.5 h-2.5 text-amber-400" />
                      {seg.amount} coins · {seg.quantity}× on wheel
                    </p>
                  </div>
                  {active ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase">
                        Active
                      </span>
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    </div>
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-muted-foreground/40 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Spin Packs ── */}
        <Section
          title="Spin Packs"
          icon={ShoppingBag}
          color="bg-violet-500/10 text-violet-500"
          badge={`${config.spinPacks?.length || 0} packs`}
        >
          <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 -mt-1">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Users buy these packs for extra spins.{" "}
              <strong className="text-foreground">Deposit coins</strong> are used first, then
              winning balance.
            </p>
          </div>
          <div className="space-y-2">
            {(config.spinPacks || []).map((pack, i) => (
              <div
                key={pack.id}
                className="bg-secondary/20 rounded-xl border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Pack {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((p) => {
                        if (!p || (p.spinPacks?.length || 0) <= 1) return p;
                        return { ...p, spinPacks: p.spinPacks.filter((_, j) => j !== i) };
                      })
                    }
                    className="text-destructive/70 hover:text-destructive p-1 transition-colors"
                    disabled={(config.spinPacks?.length || 0) <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                      Name
                    </label>
                    <input
                      placeholder="Label"
                      value={pack.label || ""}
                      onChange={(e) =>
                        setConfig((p) => {
                          if (!p) return p;
                          const spinPacks = [...(p.spinPacks || [])];
                          spinPacks[i] = { ...spinPacks[i], label: e.target.value };
                          return { ...p, spinPacks };
                        })
                      }
                      className="w-full h-10 rounded-lg border border-border bg-card px-2.5 text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                      Spins
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={pack.spins}
                      onChange={(e) =>
                        setConfig((p) => {
                          if (!p) return p;
                          const spinPacks = [...(p.spinPacks || [])];
                          spinPacks[i] = { ...spinPacks[i], spins: Number(e.target.value) || 1 };
                          return { ...p, spinPacks };
                        })
                      }
                      className="w-full h-10 rounded-lg border border-border bg-card px-2.5 text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-1">
                      Cost <GodCoin className="w-2 h-2 text-amber-400" />
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={pack.cost}
                      onChange={(e) =>
                        setConfig((p) => {
                          if (!p) return p;
                          const spinPacks = [...(p.spinPacks || [])];
                          spinPacks[i] = { ...spinPacks[i], cost: Number(e.target.value) || 9 };
                          return { ...p, spinPacks };
                        })
                      }
                      className="w-full h-10 rounded-lg border border-border bg-card px-2.5 text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl text-xs font-bold"
            onClick={() =>
              setConfig((p) => {
                if (!p) return p;
                const n = (p.spinPacks?.length || 0) + 1;
                const newPack: SpinPack = {
                  id: `pack-${Date.now()}`,
                  spins: n,
                  cost: n * 8,
                  label: `${n} Spins`,
                };
                return { ...p, spinPacks: [...(p.spinPacks || []), newPack] };
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add Pack
          </Button>
        </Section>

        {/* ── Wheel Segments ── */}
        <Section
          title="Wheel Segments"
          icon={Palette}
          color="bg-pink-500/10 text-pink-500"
          badge={`${config.segments.length} segments`}
          defaultOpen={false}
        >
          <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 -mt-1">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Define the visual segments of the wheel.{" "}
              <strong className="text-foreground">Quantity</strong> = how many times this segment
              appears on the wheel.
            </p>
          </div>
          <div className="space-y-3">
            {config.segments.map((seg, i) => (
              <div key={seg.id} className="rounded-xl border border-border overflow-hidden">
                {/* Segment header with color indicator */}
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-secondary/30">
                  <span
                    className="w-5 h-5 rounded-lg shrink-0 border border-border"
                    style={{ background: seg.color }}
                  />
                  <span className="text-xs font-bold text-foreground flex-1 truncate">
                    {seg.label || `Segment ${i + 1}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <GodCoin className="w-2.5 h-2.5 text-amber-400" />
                    {seg.amount}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSegment(i)}
                    className="text-destructive/60 hover:text-destructive p-1 transition-colors"
                    disabled={config.segments.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Segment fields */}
                <div className="grid grid-cols-2 gap-2 p-3">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                      Label
                    </label>
                    <input
                      value={seg.label}
                      onChange={(e) => updateSegment(i, { label: e.target.value })}
                      className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                      Amount (CG)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={seg.amount}
                      onChange={(e) => updateSegment(i, { amount: Number(e.target.value) || 0 })}
                      className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                      Qty on Wheel
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={seg.quantity}
                      onChange={(e) => updateSegment(i, { quantity: Number(e.target.value) || 1 })}
                      className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={seg.color}
                        onChange={(e) => updateSegment(i, { color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-border bg-card cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={seg.color}
                        onChange={(e) => updateSegment(i, { color: e.target.value })}
                        className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-xs font-mono font-bold outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl text-xs font-bold"
            onClick={addSegment}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Segment
          </Button>
        </Section>

        {/* ── Save Button ── */}
        <div className="sticky bottom-20 z-20 pt-2">
          <Button
            className="w-full h-13 rounded-2xl font-bold text-sm shadow-lg"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Spin Wheel
              </>
            )}
          </Button>
        </div>
      </div>

      <AdminNavBar />
    </div>
  );
}
