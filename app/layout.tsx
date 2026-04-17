import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionIdleTimeout } from "@/components/session-idle-timeout";
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
    <html lang="pt-BR">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <SessionIdleTimeout />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
