import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { PwaInstallHint } from "@/components/pwa/pwa-install-hint";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://thetaskzen.vercel.app").replace(
  /\/$/,
  "",
);

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "Taskzen",
  title: "Taskzen — Academic workload, beautifully organized",
  description:
    "A premium academic productivity platform for students to organize subjects, tasks, deadlines, and progress.",
  authors: [{ name: "ManishCodez", url: "https://github.com/manishcodez" }],
  creator: "ManishCodez",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taskzen",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#171B26",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jakarta.variable} ${fraunces.variable} ${jetbrains.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <PwaRegister />
          <PwaInstallHint />
        </QueryProvider>
      </body>
    </html>
  );
}
