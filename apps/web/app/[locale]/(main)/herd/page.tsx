import type { Metadata } from "next";
import { HerdView } from "@/views/main/herd";

export const metadata: Metadata = {
  title: "Herd List",
  description: "All cattle in your herd.",
};

const HerdListPage = () => <HerdView />;

export default HerdListPage;
