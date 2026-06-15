import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
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
        <Providers>
          {children}
          <div className="fixed right-4 top-4 sm:right-6 sm:top-6">
            <ThemeToggle />
          </div>
        </Providers>
      </body>
    </html>
  );
}
