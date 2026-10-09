"use client";

import React, { useState, Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ExperienceProvider } from "@/components/ExperienceProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { GuidedTour } from "@/components/GuidedTour";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(false);

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
      <body className="bg-background text-charcoal flex min-h-screen antialiased selection:bg-slate-900 selection:text-white dark:selection:bg-sky-500 dark:selection:text-slate-900">
        <ThemeProvider>
          <ExperienceProvider>
            {/* Main App Container */}
            <div className="flex w-full min-h-screen">
              {/* Left Sidebar Shell */}
              <Sidebar onStartTour={() => setIsTourOpen(true)} />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <TopHeader />

                <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
                  {children}
                </main>

                <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-bold text-slate-900 dark:text-white">
                    PROSPER<span className="text-[#C9A96E]">HIGH</span> — Decision Intelligence Platform v3.2
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Understand your investments. Understand why. Model-Agnostic Multi-Agent Architecture.
                  </p>
                </footer>
              </div>
            </div>

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
