import type { Metadata } from "next";
import { HerdDetailView } from "@/views/main/herd-detail";

export const metadata: Metadata = {
  title: "Animal · Herd",
  description: "Animal details.",
};

type HerdDetailPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

const HerdDetailPage = async ({ params }: HerdDetailPageProps) => {
  const { id } = await params;
  return <HerdDetailView id={id} />;
};

export default HerdDetailPage;
