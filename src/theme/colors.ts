export type ThemeMode = "light" | "dark";

// Shared by the existing app primitives and the resident dashboard.
export const palettes = {
  dark: {
    bg: "#080d17", card: "#101927", border: "#233044",
    text: "#eef3f9", muted: "#aab6c8", primary: "#2946d8",
    danger: "#df3048", tint: "#101f4b",
  },
  light: {
    bg: "#f5f7fb", card: "#ffffff", border: "#e2e7f0",
    text: "#101d35", muted: "#52627a", primary: "#2946d8",
    danger: "#c81f34", tint: "#e7edff",
  },
};

export const dashboardPalettes = {
  light: {
    ...palettes.light,
    bg: "#f5f7fb", border: "#e2e7f0", subtle: "#708099",
    accent: "#2946d8", weather: "#eaf1ff", weatherBorder: "#d6e3fa",
    success: "#17744d", successSoft: "#edf8f1", successBorder: "#d2eadb",
    dangerSoft: "#fff0f0", dangerBorder: "#f3d8dc",
    warning: "#946015", warningSoft: "#fff5df",
    ocean: "#e5eff4", land: "#d1e5dd", landBorder: "#b7d5c9",
    road: "#ffffff", shadow: "#1b3150",
  },
  dark: {
    ...palettes.dark,
    bg: "#080d17", card: "#101927", border: "#233044", subtle: "#8b9ab1",
    accent: "#a1b2ff", weather: "#14233d", weatherBorder: "#253b5d",
    success: "#7ed5a9", successSoft: "#10271f", successBorder: "#244637",
    danger: "#ff8a99", dangerSoft: "#2a1822", dangerBorder: "#4e2b38",
    warning: "#edc079", warningSoft: "#30281c",
    ocean: "#0e2430", land: "#1d3a36", landBorder: "#31524b",
    road: "#64877b", shadow: "#000000",
  },
};

export type DashboardColors = typeof dashboardPalettes.light;

// Public authentication uses the same saved theme as the signed-in app.
export const authPalettes = {
  dark: {
    ...palettes.dark,
    success: dashboardPalettes.dark.success,
    accent: "#b5c1ff", input: "#0d1729", inputBorder: "#2b3952",
    inputFocus: "#121d34", focusBorder: "#a5b4fc", label: "#d4deed",
    placeholder: "#7e8ea8", badge: "#111c35", badgeBorder: "#283455",
    notice: "#141e37", errorBg: "#2a1523", errorBorder: "#683042",
    error: "#ff9dad", dangerLink: "#ff6b7a", emergency: "#ffb7c4",
  },
  light: {
    ...palettes.light,
    success: dashboardPalettes.light.success,
    accent: palettes.light.primary, input: "#ffffff", inputBorder: "#cbd5e1",
    inputFocus: "#f0f4ff", focusBorder: palettes.light.primary, label: "#263650",
    placeholder: "#64748b", badge: "#e7edff", badgeBorder: "#ccd7fb",
    notice: "#e7edff", errorBg: "#fff0f2", errorBorder: "#edbbc5",
    error: "#b6223d", dangerLink: "#b6223d", emergency: "#b6223d",
  },
};
