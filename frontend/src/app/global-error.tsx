"use client"; // Error boundaries must be Client Components

import { Geist, Geist_Mono, Inter } from "next/font/google";
import { useEffect } from "react";
import { defaultLocale, getMessages } from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = createTranslator(getMessages(defaultLocale), "GlobalErrorPage");

  return (
    // global-error must include html and body tags
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* metadata exports are not supported in global-error; use a title element */}
        <title>{t("title")}</title>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-5 py-20 text-center sm:px-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">
              500
            </p>
            <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
              {t("heading")}
            </h1>
            <p className="mx-auto max-w-md text-lg leading-8 text-muted-foreground">
              {t("description")}
            </p>
            {error.digest ? (
              <p className="text-sm text-muted-foreground">
                {t("reference", { digest: error.digest })}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            {t("tryAgain")}
          </button>
        </main>
      </body>
    </html>
  );
}
