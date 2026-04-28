import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { SessionIdleTimeout } from "@/components/session-idle-timeout";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { RootAuthHashRedirect } from "@/components/root-auth-hash-redirect";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sistema de Avaliação — Edital 45/2026",
  description: "Sistema de avaliação e ranqueamento de projetos do Edital 45/2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <ThemeProvider>
          <RootAuthHashRedirect />
          <SessionIdleTimeout />
          <div className="fixed bottom-4 right-4 z-[100] pb-[env(safe-area-inset-bottom,0px)]">
            <ThemeToggle />
          </div>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
