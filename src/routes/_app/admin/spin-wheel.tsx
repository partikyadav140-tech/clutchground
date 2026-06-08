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
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AdminNavBar } from "@/components/AdminNavBar";
import { Button } from "@/components/ui/button";
import { SpinWheel } from "@/components/spin-wheel/SpinWheel";
import { useAuth } from "@/lib/auth-client";
import {
  getSpinWheelAdminConfig,
  saveSpinWheelAdminConfig,
} from "@/api";
import {
  SPIN_MAX_ACTIVE_PRIZES,
  type SpinPack,
  type SpinSegment,
  type SpinWheelConfig,
} from "@/lib/spin-wheel";

export const Route = createFileRoute("/_app/admin/spin-wheel")({
  head: () => ({ meta: [{ title: "Spin Wheel — Admin" }] }),
  loader: async () => null,
  component: AdminSpinWheelPage,
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="font-display font-black text-sm">{title}</h2>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function AdminSpinWheelPage() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<SpinWheelConfig | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewRotation, setPreviewRotation] = useState(0);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-bold">Access denied</p>
      </div>
    );
  }

  if (!config) return null;

  const toggleActivePrize = (id: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const has = prev.activePrizeIds.includes(id);
      let next = has
        ? prev.activePrizeIds.filter((x) => x !== id)
        : [...prev.activePrizeIds, id];
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
      const n = prev.segments.length + 1;
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
      toast.success("Spin wheel saved");
      setPreviewRotation((r) => r + 30);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-28 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/admin" className="w-9 h-9 rounded-xl border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display font-black text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Spin wheel
          </h1>
          <p className="text-xs text-muted-foreground">Wheel display + active win prizes (max 3)</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-4 flex justify-center">
        <SpinWheel
          segments={config.segments}
          activePrizeIds={config.activePrizeIds}
          rotation={previewRotation}
          size={240}
        />
      </motion.div>

      <SectionCard title="Eligibility">
        <label className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
          Min deposit balance (CG)
        </label>
        <input
          type="number"
          min={0}
          value={config.minDeposit}
          onChange={(e) =>
            setConfig((p) => (p ? { ...p, minDeposit: Number(e.target.value) || 0 } : p))
          }
          className="w-full h-11 rounded-xl border border-border bg-secondary/40 px-4 text-sm font-semibold"
        />
        <p className="text-xs text-muted-foreground">
          Users need this much in deposit coins and get 1 spin per day (IST).
        </p>
      </SectionCard>

      <SectionCard title={`Active prizes (${config.activePrizeIds.length}/${SPIN_MAX_ACTIVE_PRIZES})`}>
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
          Users only win from these prizes. The wheel still shows all segments below.
        </p>
        {config.segments.map((seg) => {
          const active = config.activePrizeIds.includes(seg.id);
          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => toggleActivePrize(seg.id)}
              className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/20"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-sm font-bold truncate">{seg.label}</span>
                <span className="text-xs text-muted-foreground">({seg.amount} CG)</span>
              </div>
              {active ? (
                <ToggleRight className="w-6 h-6 text-primary shrink-0" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </SectionCard>

      <SectionCard title="Spin pack pricing">
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
          Users buy these packs for extra spins. Deposit coins used first, then withdrawable.
        </p>
        <div className="space-y-2">
          {(config.spinPacks || []).map((pack, i) => (
            <div key={pack.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
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
                className="h-10 rounded-lg border border-border bg-card px-2 text-xs font-semibold"
              />
              <input
                type="number"
                min={1}
                placeholder="Spins"
                value={pack.spins}
                onChange={(e) =>
                  setConfig((p) => {
                    if (!p) return p;
                    const spinPacks = [...(p.spinPacks || [])];
                    spinPacks[i] = { ...spinPacks[i], spins: Number(e.target.value) || 1 };
                    return { ...p, spinPacks };
                  })
                }
                className="h-10 rounded-lg border border-border bg-card px-2 text-xs font-semibold"
              />
              <input
                type="number"
                min={1}
                placeholder="Cost CG"
                value={pack.cost}
                onChange={(e) =>
                  setConfig((p) => {
                    if (!p) return p;
                    const spinPacks = [...(p.spinPacks || [])];
                    spinPacks[i] = { ...spinPacks[i], cost: Number(e.target.value) || 9 };
                    return { ...p, spinPacks };
                  })
                }
                className="h-10 rounded-lg border border-border bg-card px-2 text-xs font-semibold"
              />
              <button
                type="button"
                onClick={() =>
                  setConfig((p) => {
                    if (!p || (p.spinPacks?.length || 0) <= 1) return p;
                    return { ...p, spinPacks: p.spinPacks.filter((_, j) => j !== i) };
                  })
                }
                className="text-destructive p-2"
                disabled={(config.spinPacks?.length || 0) <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl mt-2"
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
          <Plus className="w-4 h-4 mr-2" /> Add pack
        </Button>
      </SectionCard>

      <SectionCard title="Wheel segments & quantities">
        <div className="space-y-3">
          {config.segments.map((seg, i) => (
            <div key={seg.id} className="rounded-xl border border-border p-3 space-y-2 bg-secondary/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">Segment {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSegment(i)}
                  className="text-destructive p-1"
                  disabled={config.segments.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Label"
                  value={seg.label}
                  onChange={(e) => updateSegment(i, { label: e.target.value })}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold col-span-2"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={seg.amount}
                  onChange={(e) => updateSegment(i, { amount: Number(e.target.value) || 0 })}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold"
                />
                <input
                  type="number"
                  min={1}
                  max={20}
                  placeholder="Qty on wheel"
                  value={seg.quantity}
                  onChange={(e) => updateSegment(i, { quantity: Number(e.target.value) || 1 })}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold"
                />
                <input
                  type="color"
                  value={seg.color}
                  onChange={(e) => updateSegment(i, { color: e.target.value })}
                  className="h-10 rounded-lg border border-border bg-card col-span-2"
                />
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={addSegment}>
          <Plus className="w-4 h-4 mr-2" /> Add segment
        </Button>
      </SectionCard>

      <Button className="w-full h-12 rounded-2xl font-bold" disabled={saving} onClick={handleSave}>
        {saving ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" /> Save spin wheel
          </>
        )}
      </Button>

      <AdminNavBar />
    </div>
  );
}
