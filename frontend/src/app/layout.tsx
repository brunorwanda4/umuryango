import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
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
