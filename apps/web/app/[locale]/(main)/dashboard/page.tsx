import type { Metadata } from "next";
import { DashboardView } from "@/views/main/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your herd at a glance.",
};

const DashboardPage = () => <DashboardView />;

export default DashboardPage;
