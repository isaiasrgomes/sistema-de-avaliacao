import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { SessionIdleTimeout } from "@/components/session-idle-timeout";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
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
          <SessionIdleTimeout />
          <div className="fixed right-4 top-4 z-[100]">
            <ThemeToggle />
          </div>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
