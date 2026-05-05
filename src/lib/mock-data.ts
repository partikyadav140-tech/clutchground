// Mock data for the v1. Replace with backend database queries when backend is fully wired.

export type Tournament = {
  id: string;
  title: string;
  game: "Free Fire" | "Free Fire MAX" | "Clash Squad";
  mode: "Solo" | "Duo" | "Squad";
  format: "Battle Royale" | "Knockout" | "League";
  entry: number; // 0 = free
  prize: number;
  slots: number;
  filled: number;
  startsAt: string;
  status: "open" | "live" | "upcoming" | "completed";
  banner: string;
};

export const tournaments: Tournament[] = [
  {
    id: "t1",
    title: "GOD CHAMPIONS CUP",
    game: "Free Fire",
    mode: "Squad",
    format: "Battle Royale",
    entry: 100,
    prize: 50000,
    slots: 48,
    filled: 41,
    startsAt: "Today 9:00 PM",
    status: "open",
    banner: "from-orange-600 to-red-700",
  },
  {
    id: "t2",
    title: "RAGE ROYALE #14",
    game: "Free Fire MAX",
    mode: "Solo",
    format: "Battle Royale",
    entry: 0,
    prize: 5000,
    slots: 50,
    filled: 50,
    startsAt: "Live now",
    status: "live",
    banner: "from-red-700 to-yellow-600",
  },
  {
    id: "t3",
    title: "CLASH KINGS LEAGUE",
    game: "Clash Squad",
    mode: "Squad",
    format: "League",
    entry: 200,
    prize: 100000,
    slots: 16,
    filled: 9,
    startsAt: "Sat 8:00 PM",
    status: "upcoming",
    banner: "from-amber-600 to-orange-700",
  },
  {
    id: "t4",
    title: "MIDNIGHT SHOWDOWN",
    game: "Free Fire",
    mode: "Duo",
    format: "Knockout",
    entry: 50,
    prize: 15000,
    slots: 32,
    filled: 22,
    startsAt: "Tonight 11 PM",
    status: "open",
    banner: "from-rose-700 to-orange-600",
  },
  {
    id: "t5",
    title: "ROOKIE FIRE NIGHT",
    game: "Free Fire",
    mode: "Solo",
    format: "Battle Royale",
    entry: 0,
    prize: 2000,
    slots: 60,
    filled: 14,
    startsAt: "Tomorrow 7 PM",
    status: "open",
    banner: "from-orange-500 to-red-600",
  },
  {
    id: "t6",
    title: "GOD INVITATIONAL",
    game: "Free Fire MAX",
    mode: "Squad",
    format: "League",
    entry: 500,
    prize: 250000,
    slots: 12,
    filled: 12,
    startsAt: "Next Sunday",
    status: "upcoming",
    banner: "from-yellow-600 via-orange-700 to-red-800",
  },
];

export type Player = {
  rank: number;
  ign: string;
  uid: string;
  team: string;
  kills: number;
  wins: number;
  points: number;
  region: string;
  badge?: "god" | "elite" | "veteran";
};

export const leaderboard: Player[] = [
  {
    rank: 1,
    ign: "ÐØØMxKING",
    uid: "1234567890",
    team: "GOD ALPHA",
    kills: 4128,
    wins: 312,
    points: 18420,
    region: "IN",
    badge: "god",
  },
  {
    rank: 2,
    ign: "RAGE_REAPER",
    uid: "1234567891",
    team: "PHANTOM SQUAD",
    kills: 3987,
    wins: 298,
    points: 17890,
    region: "IN",
    badge: "god",
  },
  {
    rank: 3,
    ign: "AlphaGhost77",
    uid: "1234567892",
    team: "TOXIC FANG",
    kills: 3712,
    wins: 271,
    points: 17120,
    region: "IN",
    badge: "elite",
  },
  {
    rank: 4,
    ign: "S1lentBlade",
    uid: "1234567893",
    team: "GOD ALPHA",
    kills: 3502,
    wins: 255,
    points: 16450,
    region: "BD",
    badge: "elite",
  },
  {
    rank: 5,
    ign: "NoScope_Devil",
    uid: "1234567894",
    team: "VENOM",
    kills: 3398,
    wins: 248,
    points: 16100,
    region: "PK",
    badge: "elite",
  },
  {
    rank: 6,
    ign: "Kr1ptik",
    uid: "1234567895",
    team: "PHOENIX",
    kills: 3210,
    wins: 230,
    points: 15580,
    region: "IN",
    badge: "veteran",
  },
  {
    rank: 7,
    ign: "ColdFury",
    uid: "1234567896",
    team: "TOXIC FANG",
    kills: 3104,
    wins: 219,
    points: 15010,
    region: "IN",
    badge: "veteran",
  },
  {
    rank: 8,
    ign: "BulletStorm",
    uid: "1234567897",
    team: "GOD BRAVO",
    kills: 2987,
    wins: 210,
    points: 14720,
    region: "NP",
    badge: "veteran",
  },
  {
    rank: 9,
    ign: "Vortex_OG",
    uid: "1234567898",
    team: "VENOM",
    kills: 2899,
    wins: 198,
    points: 14210,
    region: "IN",
  },
  {
    rank: 10,
    ign: "Sn1per_God",
    uid: "1234567899",
    team: "PHANTOM SQUAD",
    kills: 2811,
    wins: 188,
    points: 13890,
    region: "IN",
  },
];

export type Team = {
  id: string;
  name: string;
  tag: string;
  members: number;
  wins: number;
  rank: number;
  founded: string;
};

export const teams: Team[] = [
  { id: "tm1", name: "GOD ALPHA", tag: "GODA", members: 6, wins: 142, rank: 1, founded: "2024" },
  {
    id: "tm2",
    name: "PHANTOM SQUAD",
    tag: "PHNT",
    members: 5,
    wins: 128,
    rank: 2,
    founded: "2023",
  },
  { id: "tm3", name: "TOXIC FANG", tag: "TXC", members: 5, wins: 119, rank: 3, founded: "2024" },
  { id: "tm4", name: "VENOM", tag: "VNM", members: 4, wins: 102, rank: 4, founded: "2025" },
  { id: "tm5", name: "PHOENIX", tag: "PHX", members: 5, wins: 98, rank: 5, founded: "2024" },
  { id: "tm6", name: "GOD BRAVO", tag: "GODB", members: 6, wins: 87, rank: 6, founded: "2025" },
];
