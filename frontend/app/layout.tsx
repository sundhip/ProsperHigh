"use client";

import React, { useState, Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ExperienceProvider } from "@/components/ExperienceProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { usePathname } from "next/navigation";
import { GuidedTour } from "@/components/GuidedTour";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ProsperHigh — Explainable Multi-Agent Investment Intelligence</title>
        <meta name="description" content="Understand your investments. Understand why. Model-Agnostic Multi-Agent Architecture." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Anti-theme flash inline script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('prosper_theme') || 'system';
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-primary antialiased selection:bg-accent selection:text-black min-h-screen">
        <ThemeProvider>
          <ExperienceProvider>
            {isAuthPage ? (
              /* Dedicated Clean Auth Experience (Ref A & D) */
              <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 w-full max-w-5xl mx-auto">
                <header className="flex items-center justify-between py-4 border-b border-border-subtle">
                  <a href="/" className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-2xl bg-accent text-black flex items-center justify-center font-black font-display text-base shadow-md shrink-0">
                      PH
                    </div>
                    <span className="font-extrabold text-lg tracking-tight font-display text-primary">
                      Prosper<span className="text-accent">High</span>
                    </span>
                  </a>
                  <a
                    href="/"
                    className="text-xs font-semibold text-secondary-muted hover:text-primary transition-colors flex items-center space-x-1"
                  >
                    <span>Back to platform</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </header>

                <main className="flex-1 flex items-center justify-center py-6 w-full">
                  {children}
                </main>

                <footer className="py-4 text-center text-xs text-secondary-muted flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border-subtle">
                  <p className="font-bold text-primary font-display">
                    PROSPER<span className="text-accent">HIGH</span> <span className="font-normal text-secondary-muted">• Financial Decision Intelligence</span>
                  </p>
                  <p className="text-[11px] text-secondary-muted">
                    Explainable Multi-Agent Investment Intelligence
                  </p>
                </footer>
              </div>
            ) : (
              /* Desktop App Container: Rounded bento shell with outer margin (Ref B, C, D) */
              <div className="min-h-screen p-0 md:p-3 lg:p-4 flex flex-col justify-between w-full">
                <div className="flex-1 flex w-full gap-3 lg:gap-4 relative">
                  {/* Dark Rounded Sidebar Panel */}
                  <Sidebar onStartTour={() => setIsTourOpen(true)} />

                  {/* Main Content Area in rounded bento surface */}
                  <div className="flex-1 flex flex-col min-w-0 min-h-full">
                    <TopHeader />

                    <main className="flex-1 p-4 sm:p-6 lg:p-7 w-full">
                      {children}
                    </main>

                    <footer className="mt-8 border-t border-border-subtle py-5 px-6 text-center text-xs text-secondary-muted flex flex-col sm:flex-row items-center justify-between gap-2">
                      <p className="font-bold text-primary font-display">
                        PROSPER<span className="text-accent">HIGH</span> <span className="font-normal text-secondary-muted">• Financial Decision Intelligence</span>
                      </p>
                      <p className="text-[11px] text-secondary-muted">
                        Understand your investments. Understand why.
                      </p>
                    </footer>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Guided Tour Overlay */}
            <Suspense fallback={null}>
              <GuidedTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
            </Suspense>
          </ExperienceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
