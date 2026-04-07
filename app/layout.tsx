import type { Metadata, Viewport } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import StripeRule from "@/components/ui/StripeRule";
import PwaRegister from "@/components/PwaRegister";
import { ToastProvider } from "@/components/ui/Toaster";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "L'Étudiant Salons",
  description: "La plateforme de gestion des salons de l'orientation L'Étudiant",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "L'Étudiant Salons",
  },
};

export const viewport: Viewport = {
  themeColor: "#E3001B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${sourceSerif4.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-le-gray-900">
        <StripeRule />
        <ToastProvider>
          {children}
        </ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
