"use client";

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";

const scriptProps = { suppressHydrationWarning: true } as ThemeProviderProps["scriptProps"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem scriptProps={scriptProps}>
      {children}
    </NextThemesProvider>
  );
}
