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

export function getModeColors(mode: string) {
  return MODE_COLORS[mode] ?? MODE_COLORS.Solo;
}

export function getTournamentPoster(tournament: { id: number; banner?: string | null }) {
  if (tournament.banner?.startsWith("http")) return tournament.banner;
  return TOURNAMENT_POSTERS[tournament.id % TOURNAMENT_POSTERS.length];
}
