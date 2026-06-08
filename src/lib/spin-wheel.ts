export type SpinSegment = {
  id: string;
  label: string;
  amount: number;
  quantity: number;
  color: string;
};

export type SpinPack = {
  id: string;
  spins: number;
  cost: number;
  label?: string;
};

export type SpinWheelConfig = {
  segments: SpinSegment[];
  activePrizeIds: string[];
  minDeposit: number;
  spinPacks: SpinPack[];
};

export const DEFAULT_SPIN_PACKS: SpinPack[] = [
  { id: "pack-1", spins: 1, cost: 9, label: "1 Spin" },
  { id: "pack-3", spins: 3, cost: 25, label: "3 Spins" },
  { id: "pack-5", spins: 5, cost: 40, label: "5 Spins" },
  { id: "pack-10", spins: 10, cost: 75, label: "10 Spins" },
  { id: "pack-20", spins: 20, cost: 140, label: "20 Spins" },
  { id: "pack-50", spins: 50, cost: 320, label: "50 Spins" },
];

export const SPIN_WHEEL_SETTINGS_KEY = "spin_wheel_config";
export const SPIN_MIN_DEPOSIT_DEFAULT = 100;
export const SPIN_MAX_ACTIVE_PRIZES = 3;

export const DEFAULT_SPIN_SEGMENTS: SpinSegment[] = [
  { id: "seg-1", label: "1 CG", amount: 1, quantity: 2, color: "#FF6B00" },
  { id: "seg-none", label: "No Luck", amount: 0, quantity: 2, color: "#64748B" },
  { id: "seg-5", label: "5 CG", amount: 5, quantity: 1, color: "#F59E0B" },
  { id: "seg-10", label: "10 CG", amount: 10, quantity: 1, color: "#10B981" },
  { id: "seg-25", label: "25 CG", amount: 25, quantity: 1, color: "#3B82F6" },
  { id: "seg-50", label: "50 CG", amount: 50, quantity: 1, color: "#8B5CF6" },
  { id: "seg-100", label: "100 CG", amount: 100, quantity: 1, color: "#EC4899" },
  { id: "seg-250", label: "250 CG", amount: 250, quantity: 1, color: "#EF4444" },
  { id: "seg-500", label: "500 CG", amount: 500, quantity: 1, color: "#FFD700" },
];

export const DEFAULT_SPIN_WHEEL_CONFIG: SpinWheelConfig = {
  segments: DEFAULT_SPIN_SEGMENTS,
  activePrizeIds: ["seg-1", "seg-none", "seg-5"],
  minDeposit: SPIN_MIN_DEPOSIT_DEFAULT,
  spinPacks: DEFAULT_SPIN_PACKS,
};

function normalizeSpinPacks(packs: SpinPack[] | undefined): SpinPack[] {
  if (!Array.isArray(packs) || packs.length === 0) return [...DEFAULT_SPIN_PACKS];
  return packs.map((p, i) => ({
    id: p.id || `pack-${i}`,
    spins: Math.max(1, Number(p.spins) || 1),
    cost: Math.max(1, Number(p.cost) || 9),
    label: p.label || `${p.spins || 1} Spin${(p.spins || 1) > 1 ? "s" : ""}`,
  }));
}

export function parseSpinWheelConfig(raw: string | null | undefined): SpinWheelConfig {
  if (!raw) return { ...DEFAULT_SPIN_WHEEL_CONFIG, segments: [...DEFAULT_SPIN_SEGMENTS] };
  try {
    const parsed = JSON.parse(raw) as Partial<SpinWheelConfig>;
    const segments =
      Array.isArray(parsed.segments) && parsed.segments.length > 0
        ? parsed.segments.map((s, i) => ({
            id: s.id || `seg-${i}`,
            label: s.label || `${s.amount ?? 0} CG`,
            amount: Math.max(0, Number(s.amount) || 0),
            quantity: Math.max(1, Number(s.quantity) || 1),
            color: s.color || DEFAULT_SPIN_SEGMENTS[i % DEFAULT_SPIN_SEGMENTS.length]?.color || "#FF6B00",
          }))
        : [...DEFAULT_SPIN_SEGMENTS];

    const activePrizeIds = Array.isArray(parsed.activePrizeIds)
      ? parsed.activePrizeIds.filter((id) => segments.some((s) => s.id === id)).slice(0, SPIN_MAX_ACTIVE_PRIZES)
      : DEFAULT_SPIN_WHEEL_CONFIG.activePrizeIds;

    return {
      segments,
      activePrizeIds: activePrizeIds.length > 0 ? activePrizeIds : [segments[0].id],
      minDeposit: Math.max(0, Number(parsed.minDeposit) || SPIN_MIN_DEPOSIT_DEFAULT),
      spinPacks: normalizeSpinPacks(parsed.spinPacks as SpinPack[] | undefined),
    };
  } catch {
    return {
      ...DEFAULT_SPIN_WHEEL_CONFIG,
      segments: [...DEFAULT_SPIN_SEGMENTS],
      spinPacks: [...DEFAULT_SPIN_PACKS],
    };
  }
}

export type WheelSlice = {
  sliceIndex: number;
  segmentId: string;
  segment: SpinSegment;
};

/** Expand segments into wheel slices by quantity */
export function buildWheelSlices(segments: SpinSegment[]): WheelSlice[] {
  const slices: WheelSlice[] = [];
  let idx = 0;
  for (const segment of segments) {
    for (let q = 0; q < segment.quantity; q++) {
      slices.push({ sliceIndex: idx++, segmentId: segment.id, segment });
    }
  }
  return slices;
}

export function pickRandomSliceIndexForSegment(slices: WheelSlice[], segmentId: string): number {
  const matches = slices.filter((s) => s.segmentId === segmentId);
  if (matches.length === 0) return 0;
  return matches[Math.floor(Math.random() * matches.length)].sliceIndex;
}

/** Degrees to add so slice center lands under the top pointer */
export function rotationDeltaForSlice(
  sliceIndex: number,
  totalSlices: number,
  currentRotation: number,
  extraSpins = 7,
): number {
  const sliceAngle = 360 / totalSlices;
  const sliceCenter = sliceIndex * sliceAngle + sliceAngle / 2;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const targetMod = (360 - sliceCenter + 360) % 360;
  let delta = (targetMod - currentMod + 360) % 360;
  if (delta < 20) delta += 360;
  return extraSpins * 360 + delta;
}

/** Start of today in IST as ISO string for DB comparison */
export function getTodayStartIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();
  const startIst = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - istOffset);
  return startIst.toISOString();
}
