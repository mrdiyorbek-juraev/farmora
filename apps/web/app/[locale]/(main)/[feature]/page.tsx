import { notFound } from "next/navigation";

import { findSoonFeature } from "@/constants/navigation";
import { ComingSoon } from "@/views/main/coming-soon";

interface FeaturePageProps {
  params: Promise<{ feature: string }>;
}

// Shared placeholder for every "coming soon" sidebar item. Single-segment
// paths that aren't a known upcoming feature fall through to the nearest
// not-found boundary so real 404s still behave.
const FeaturePage = async ({ params }: FeaturePageProps) => {
  const { feature } = await params;
  const item = findSoonFeature(feature);

  if (!item) {
    notFound();
  }

  return (
    <ComingSoon
      description={item.description}
      icon={item.icon}
      title={item.title}
    />
  );
};

export default FeaturePage;
