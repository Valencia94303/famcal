// Time-based theme configuration for dynamic, energetic aesthetics

export type ThemeTime = "morning" | "afternoon" | "evening" | "night";

export interface Theme {
  name: ThemeTime;
  background: string;
  backgroundSecondary: string;
  accent: string;
  accentSecondary: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export const themes: Record<ThemeTime, Theme> = {
  morning: {
    name: "morning",
    background: "from-amber-100 via-orange-100 to-rose-100",
    backgroundSecondary: "from-yellow-200/50 to-orange-200/50",
    accent: "#f97316", // orange-500
    accentSecondary: "#fb923c", // orange-400
    cardBg: "bg-white/80 backdrop-blur-xl",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
  },
  afternoon: {
    name: "afternoon",
    background: "from-sky-200 via-indigo-200 to-purple-200",
    backgroundSecondary: "from-blue-300/50 to-indigo-300/50",
    accent: "#6366f1", // indigo-500
    accentSecondary: "#818cf8", // indigo-400
    cardBg: "bg-white/75 backdrop-blur-xl",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
  },
  evening: {
    name: "evening",
    background: "from-rose-200 via-pink-200 to-purple-300",
    backgroundSecondary: "from-pink-300/50 to-purple-300/50",
    accent: "#ec4899", // pink-500
    accentSecondary: "#f472b6", // pink-400
    cardBg: "bg-white/80 backdrop-blur-xl",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
  },
  night: {
    name: "night",
    background: "from-slate-900 via-indigo-950 to-slate-900",
    backgroundSecondary: "from-indigo-900/30 to-purple-900/30",
    accent: "#a78bfa", // violet-400
    accentSecondary: "#c4b5fd", // violet-300
    cardBg: "bg-slate-800/80 backdrop-blur-xl",
    textPrimary: "text-white",
    textSecondary: "text-slate-200",
    textMuted: "text-slate-400",
  },
};

export function getThemeForTime(date: Date = new Date()): Theme {
  const hour = date.getHours();

  if (hour >= 6 && hour < 11) {
    return themes.morning;
  } else if (hour >= 11 && hour < 17) {
    return themes.afternoon;
  } else if (hour >= 17 && hour < 21) {
    return themes.evening;
  } else {
    return themes.night;
  }
}

export function getNextThemeChange(date: Date = new Date()): Date {
  const hour = date.getHours();
  const nextChange = new Date(date);
  nextChange.setMinutes(0, 0, 0);

  if (hour < 6) {
    nextChange.setHours(6);
  } else if (hour < 11) {
    nextChange.setHours(11);
  } else if (hour < 17) {
    nextChange.setHours(17);
  } else if (hour < 21) {
    nextChange.setHours(21);
  } else {
    nextChange.setDate(nextChange.getDate() + 1);
    nextChange.setHours(6);
  }

  return nextChange;
}
