import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NERVA Marketplace — Buy & sell with XNV",
    template: "%s · NERVA Marketplace",
  },
  description:
    "A community-driven marketplace where physical goods are priced in NERVA (XNV), the CPU-minable privacy coin. Browse listings, pay with XNV, track invoices in real time.",
  keywords: [
    "NERVA",
    "XNV",
    "cryptocurrency",
    "marketplace",
    "privacy coin",
    "Monero fork",
    "CPU mining",
  ],
  authors: [{ name: "NERVA Marketplace Contributors" }],
  openGraph: {
    title: "NERVA Marketplace",
    description:
      "Buy and sell physical goods priced in NERVA (XNV). CPU-minable privacy coin.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NERVA Marketplace",
    description:
      "Buy and sell physical goods priced in NERVA (XNV). CPU-minable privacy coin.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
