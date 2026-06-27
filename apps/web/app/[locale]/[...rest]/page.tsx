import { notFound } from "next/navigation";

// With a dynamic `[locale]` root segment and no middleware, Next.js
// can't infer that a nested URL is unmatched — the dynamic segment
// absorbs it, so `not-found.tsx` never fires on its own. This
// catch-all explicitly triggers the nearest not-found boundary
// (`[locale]/not-found.tsx`) for any unmatched path under a locale.
const CatchAllPage = () => {
  notFound();
};

export default CatchAllPage;
