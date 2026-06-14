import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
    default: "Rwanda Family",
    template: "%s | Rwanda Family",
  },
  description:
    "Rwanda Family helps families securely manage money, contributions, expenses, savings, debts, projects, documents, announcements, events, and reports in one trusted place.",
  applicationName: "Rwanda Family",
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
  authors: [{ name: "Rwanda Family" }],
  creator: "Rwanda Family",
  publisher: "Rwanda Family",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Rwanda Family",
    title: "Rwanda Family",
    description:
      "A secure family management platform for finances, contributions, projects, documents, announcements, events, and reports.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rwanda Family",
    description:
      "Securely manage family money, contributions, projects, documents, announcements, events, and reports.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
