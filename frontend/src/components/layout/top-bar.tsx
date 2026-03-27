"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CurrencyToggle } from "./currency-toggle";
import { ThemeToggle } from "./theme-toggle";

const tabs = [
  { label: "PORTFOLIO", href: "/portfolio" },
  { label: "BUDGET", href: "/budget" },
  { label: "CASHFLOW", href: "/cashflow" },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-surface">
      <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/portfolio" className="font-display text-on-surface font-medium text-lg">
            FINANCE
          </Link>
          <nav className="flex items-center gap-6">
            {tabs.map((tab) => {
              const isActive = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "font-mono text-xs uppercase tracking-[0.1em] py-4 border-b-2 transition-colors",
                    isActive
                      ? "text-on-surface border-primary"
                      : "text-on-surface-variant border-transparent hover:text-on-surface"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <CurrencyToggle />
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-mono text-on-surface-variant">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
