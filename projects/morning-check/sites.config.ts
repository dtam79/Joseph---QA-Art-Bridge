export type SiteTarget = {
  name: string;
  env: "main" | "staging";
  url: string;
  /** Extra pages to probe for accessibility (login, register, …). */
  pages?: { label: string; path: string }[];
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

// Auth pages every app exposes (live-verified HTTP 200 on all targets)
const AUTH_PAGES: { label: string; path: string }[] = [
  { label: "login", path: "/login/" },
  { label: "register", path: "/register/" },
];

export const SITES: SiteTarget[] = [
  // Art Bridge (Staging only)
  {
    name: "Art Bridge",
    env: "staging",
    url: e.ART_BRIDGE_STAGING_URL ?? "",
    pages: AUTH_PAGES,
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
    pages: AUTH_PAGES,
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
    pages: AUTH_PAGES,
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
    pages: AUTH_PAGES,
  },
  {
    name: "Oh-Good",
    env: "staging",
    url: e.OH_GOOD_STAGING_URL ?? "https://staging.oh-good.net",
    pages: AUTH_PAGES,
  },

  // Hands-On Trip — no real URL/credentials configured yet, so it stays
  // skipped until HANDS_MAIN_URL / HANDS_STAGING_URL are set.
  {
    name: "Hands-On Trip",
    env: "staging",
    url: e.HANDS_STAGING_URL ?? "",
  },
];
