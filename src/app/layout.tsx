import type { Metadata } from "next";
import { Fraunces, Outfit, Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AppBackground } from "@/components/ui/app-background";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: { default: "Givora", template: "%s · Givora" },
  description: "Choose a gift, pay once, and share a private link. They unwrap it, then tell us where to send it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={cn("h-full", outfit.variable, fraunces.variable, "font-sans", geist.variable)}>
      <body className="relative flex min-h-full flex-col bg-transparent text-ink antialiased">
        <AppBackground />
        <Providers>
          <SiteHeader />
          <main className="relative z-10 flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
