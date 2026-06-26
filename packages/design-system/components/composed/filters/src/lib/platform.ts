"use client";

import { useEffect, useState } from "react";

// Match the rest of the platform's hotkey display: ⌥ on Mac, Alt on
// Win/Linux. We can't depend on @tanstack/hotkeys here (the DS
// package doesn't carry that dep), so this hook runs the same kind
// of platform check `formatForDisplay` does — but as a post-mount
// effect so SSR keeps a stable "Alt" placeholder and only the
// hydrated client swaps to the Mac glyph. Avoids hydration mismatch
// warnings without disabling them.
export function useAltKeyLabel(): string {
  const [label, setLabel] = useState("Alt");
  useEffect(() => {
    const ua = (
      navigator as Navigator & { userAgentData?: { platform?: string } }
    ).userAgentData?.platform;
    const isMac = ua
      ? /mac/i.test(ua)
      : /mac/i.test(navigator.platform ?? "");
    if (isMac) {
      setLabel("⌥");
    }
  }, []);
  return label;
}
