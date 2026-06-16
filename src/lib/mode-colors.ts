export const TOURNAMENT_POSTERS = [
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319133/clutchground/posters/axuescfjvf4ldjhzjah2.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319134/clutchground/posters/jurlwo3f3ci0989sbron.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319135/clutchground/posters/effl14r1d2hdj2ccvytp.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319136/clutchground/posters/xt34djmrfhqqialfpyvw.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319137/clutchground/posters/utsi9880syth0wggn6jk.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319138/clutchground/posters/o19jvuwrbawybvm76fvg.jpg",
] as const;

export type TournamentMode = "Solo" | "Duo" | "Squad";

export const MODE_COLORS: Record<
  string,
  { label: string; color: string; glow: string; gradient: string; bg?: string }
> = {
  Solo: {
    label: "Solo",
    color: "#00c8ff",
    glow: "rgba(0,200,255,0.35)",
    gradient: "linear-gradient(135deg,#00c8ff,#0080ff)",
    bg: "rgba(0,200,255,0.08)",
  },
  Duo: {
    label: "Duo",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.35)",
    gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    bg: "rgba(167,139,250,0.08)",
  },
  Squad: {
    label: "Squad",
    color: "#ff6b00",
    glow: "rgba(255,107,0,0.35)",
    gradient: "linear-gradient(135deg,#ff6b00,#ff0055)",
    bg: "rgba(255,107,0,0.08)",
  },
};

/** Free Fire map images uploaded to Cloudinary */
export const MAP_IMAGES: Record<string, string> = {
  lone_wolf:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626109/clutchground/maps/lone_wolf.png",
  nextera:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626117/clutchground/maps/nextera.png",
  purgatory:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626125/clutchground/maps/purgatory.png",
  solara:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626134/clutchground/maps/solara.png",
  alpine:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626141/clutchground/maps/alpine.png",
  bermuda:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626147/clutchground/maps/bermuda.png",
  clash_squad:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626152/clutchground/maps/clash_squad.png",
  kalahari:
    "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1781626157/clutchground/maps/kalahari.png",
};

/** Map options for Battle Royale admin dropdown */
export const BR_MAP_OPTIONS = [
  { value: "bermuda", label: "Bermuda" },
  { value: "kalahari", label: "Kalahari" },
  { value: "nextera", label: "Nextera" },
  { value: "purgatory", label: "Purgatory" },
  { value: "solara", label: "Solara" },
  { value: "alpine", label: "Alpine" },
] as const;

export function getModeColors(mode: string) {
  return MODE_COLORS[mode] ?? MODE_COLORS.Solo;
}

export function getTournamentPoster(tournament: {
  id: number;
  banner?: string | null;
  map?: string | null;
  tournament_type?: string | null;
}) {
  // 1. Custom uploaded banner always wins
  if (tournament.banner?.startsWith("http")) return tournament.banner;
  // 2. Map-specific image (from admin map selection)
  if (tournament.map && MAP_IMAGES[tournament.map]) return MAP_IMAGES[tournament.map];
  // 3. Auto-map based on tournament_type for clash_squad / lone_wolf
  if (tournament.tournament_type === "clash_squad" && MAP_IMAGES.clash_squad)
    return MAP_IMAGES.clash_squad;
  if (tournament.tournament_type === "lone_wolf" && MAP_IMAGES.lone_wolf)
    return MAP_IMAGES.lone_wolf;
  // 4. Fallback to rotating posters
  return TOURNAMENT_POSTERS[tournament.id % TOURNAMENT_POSTERS.length];
}
