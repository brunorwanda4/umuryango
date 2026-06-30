import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import enMessages from "@/messages/en.json";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: enMessages.Metadata.title.default,
    template: enMessages.Metadata.title.template,
  },
  description: enMessages.Metadata.description,
  applicationName: enMessages.Metadata.applicationName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: enMessages.Metadata.applicationName,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    "Rwanda Family",
    "family management",
    "family finance",
    "contribution tracking",
    "expense management",
    "savings goals",
    "family projects",
    "family reports",
  ],
  authors: [{ name: enMessages.Metadata.applicationName }],
  creator: enMessages.Metadata.applicationName,
  publisher: enMessages.Metadata.applicationName,
  openGraph: {
    type: "website",
    locale: "en",
    siteName: enMessages.Metadata.applicationName,
    title: enMessages.Metadata.applicationName,
    description: enMessages.Metadata.openGraphDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: enMessages.Metadata.applicationName,
    description: enMessages.Metadata.twitterDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
