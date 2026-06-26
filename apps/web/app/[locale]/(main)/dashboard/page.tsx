import { UserButton } from "@repo/auth/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your herd at a glance.",
};

const DashboardPage = () => {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Dashboard</h1>
        <UserButton />
      </header>

      <section className="rounded-lg border border-border p-6">
        <p className="text-muted-foreground">
          Welcome to your farm overview. Analytics and herd summary will live
          here.
        </p>
      </section>
    </main>
  );
};

export default DashboardPage;
