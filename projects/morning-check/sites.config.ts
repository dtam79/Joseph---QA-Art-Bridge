export type SiteTarget = {
  name: string;
  env: "main" | "staging";
  url: string;
  login?: { type: "wp" | "woo"; url: string; userEnv: string; passEnv: string };
};

const e = process.env;
const L = (
  type: "wp" | "woo",
  base: string,
  path: string,
  u: string,
  p: string
) => (base ? { type, url: base + path, userEnv: u, passEnv: p } : undefined);

export const SITES: SiteTarget[] = [
  // Art Bridge (Staging only)
  {
    name: "Art Bridge",
    env: "staging",
    url: e.ART_BRIDGE_STAGING_URL ?? "",
    login: L(
      "wp",
      e.ART_BRIDGE_STAGING_URL ?? "",
      "/login/",
      "ART_BRIDGE_USER",
      "ART_BRIDGE_PASS"
    ),
  },

  // Hot Deal (Main & Staging)
  {
    name: "Hot Deal",
    env: "main",
    url: e.HOT_DEAL_MAIN_URL ?? "https://hot-deal.shop",
    login: L(
      "woo",
      e.HOT_DEAL_MAIN_URL ?? "https://hot-deal.shop",
      "/my-account/",
      "HOT_DEAL_USER",
      "HOT_DEAL_PASS"
    ),
  },
  {
    name: "Hot Deal",
    env: "staging",
    url: e.HOT_DEAL_STAGING_URL ?? "https://staging.hot-deal.shop",
    login: L(
      "woo",
      e.HOT_DEAL_STAGING_URL ?? "https://staging.hot-deal.shop",
      "/my-account/",
      "HOT_DEAL_USER",
      "HOT_DEAL_PASS"
    ),
  },

  // Oh-Good (Main & Staging)
  {
    name: "Oh-Good",
    env: "main",
    url: e.OH_GOOD_MAIN_URL ?? "https://oh-good.net",
  },
  {
    name: "Oh-Good",
    env: "staging",
    url: e.OH_GOOD_STAGING_URL ?? "https://staging.oh-good.net",
  },

  // Hands-On Trip (Staging only - dev.oh-good.net)
  {
    name: "Hands-On Trip",
    env: "staging",
    url: e.HANDS_STAGING_URL ?? "https://dev.oh-good.net",
  },
];
