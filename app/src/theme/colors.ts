// Dark, gradient-card visual language — adapted from a reference mockup.
// Palette only; screen content/metrics are unrelated to that reference.

export const colors = {
  bg: "#08080a",
  bgElev: "#0f0f13",
  ink: "#f6f5f3",
  inkDim: "rgba(246,245,243,0.52)",
  inkFaint: "rgba(246,245,243,0.3)",
  hairline: "rgba(255,255,255,0.08)",

  onCardLabel: "rgba(255,255,255,0.72)",
  onCardSub: "rgba(255,255,255,0.5)",
  onCardStrong: "#ffffff",
  sheen: "rgba(255,255,255,0.14)",

  accentLink: "#5b9fe0",
  // Warm accent used specifically on the food dashboard (plan, meal cards,
  // recipe modal, grocery list) — the rest of the app keeps accentLink.
  accentOrange: "#f5893a",
} as const;

// Each card "flavor" is a two-stop diagonal gradient, matching the reference's
// per-card treatment. Pick one per card type; don't mix within a card.
export const gradients = {
  mauve: ["#d99a9e", "#e6835f"],
  sage: ["#24463f", "#123330"],
  magenta: ["#e155a0", "#a6337f"],
  navy: ["#1c2550", "#090b1e"],
  amber: ["#eda23f", "#c1621f"],
  rust: ["#c1622a", "#7a3410"],
} as const;

export const accentBlue = "#5b9fe0";

export type GradientName = keyof typeof gradients;
