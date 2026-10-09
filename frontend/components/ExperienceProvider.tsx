"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ExperienceMode = "beginner" | "advanced";

interface ExperienceContextType {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  isBeginner: boolean;
  isAdvanced: boolean;
}

const ExperienceContext = createContext<ExperienceContextType>({
  mode: "beginner",
  setMode: () => {},
  isBeginner: true,
  isAdvanced: false,
});

export const useExperience = () => useContext(ExperienceContext);

export const ExperienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ExperienceMode>("beginner");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("prosper_experience_mode") as ExperienceMode;
      if (stored === "beginner" || stored === "advanced") {
        setModeState(stored);
      }
    } catch (e) {
      // localStorage may not be accessible in all environments
    }
    setMounted(true);
  }, []);

  const setMode = (newMode: ExperienceMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("prosper_experience_mode", newMode);
      window.dispatchEvent(new Event("experience-mode-changed"));
    } catch (e) {}
  };

  return (
    <ExperienceContext.Provider
      value={{
        mode,
        setMode,
        isBeginner: mode === "beginner",
        isAdvanced: mode === "advanced",
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
};
