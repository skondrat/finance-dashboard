"use client";

import { TopBar } from "@/components/layout/top-bar";
import { AuthGuard } from "@/components/layout/auth-guard";
import { useCurrencyInvalidation } from "@/stores/currency-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useCurrencyInvalidation();

  return (
    <AuthGuard>
      <TopBar />
      <main className="flex-1 bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-6 py-6">{children}</div>
      </main>
    </AuthGuard>
  );
}
