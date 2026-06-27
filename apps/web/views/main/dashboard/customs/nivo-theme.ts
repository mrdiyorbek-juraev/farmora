import type { PartialTheme } from "@nivo/theming";

// Wire nivo's theme to the design-system CSS variables so charts
// inherit light/dark colours from the same tokens as the rest of the
// app. CSS variables resolve as SVG fill/stroke values in modern
// browsers.
export const nivoTheme: PartialTheme = {
  background: "transparent",
  text: {
    fontFamily: "inherit",
    fontSize: 12,
    fill: "var(--muted-foreground)",
  },
  axis: {
    domain: { line: { stroke: "var(--border)" } },
    ticks: {
      line: { stroke: "var(--border)" },
      text: { fill: "var(--muted-foreground)", fontSize: 11 },
    },
    legend: { text: { fill: "var(--muted-foreground)" } },
  },
  grid: {
    line: { stroke: "var(--border)", strokeDasharray: "3 3" },
  },
  legends: {
    text: { fill: "var(--muted-foreground)" },
  },
  tooltip: {
    container: {
      background: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md, 6px)",
      fontSize: 12,
      padding: "6px 10px",
      boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
    },
  },
};
