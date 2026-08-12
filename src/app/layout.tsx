import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

// Deliberately using a system font stack (see globals.css --font-display /
// --font-body) instead of next/font/google: it removes a build-time
// dependency on fetching fonts.googleapis.com, which keeps builds
// reliable in network-restricted CI/sandbox environments without any
// visible quality tradeoff for this UI.

export const metadata: Metadata = {
  title: "EvoBuddy",
  description: "Hatch, care for, and grow your own original digital companion.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "EvoBuddy" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#5aa9e6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-app-bg)] text-[var(--color-app-fg)] font-[var(--font-body)]">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
