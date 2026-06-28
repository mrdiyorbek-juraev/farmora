import { config, withAnalyzer } from "@repo/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

// Baseline HTTP security headers applied to every response. CSP is left
// off here because it needs per-feature tuning (Clerk, PostHog, Supabase)
// — wire it via @repo/security/Nosecone when ready.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

let nextConfig: NextConfig = {
  ...config,
  // biome-ignore lint/suspicious/useAwait: Next's headers() must be async
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
