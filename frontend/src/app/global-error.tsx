"use client"; // Error boundaries must be Client Components

import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { useEffect, useState } from "react";
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleCopy = () => {
    const errorText = [
      `Name: ${error.name}`,
      `Message: ${error.message}`,
      error.digest ? `Digest: ${error.digest}` : "",
      error.stack ? `Stack: ${error.stack}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

            {error.message && (
              <div className="mx-auto mt-4 w-full max-w-md text-left">
                <details className="group rounded-lg border border-border bg-muted/50 p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-xs font-medium text-muted-foreground select-none">
                    <span>View Error Details</span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 group-open:-rotate-180"
                    />
                  </summary>
                  <div className="mt-3 font-mono text-xs text-destructive break-all whitespace-pre-wrap border-t border-border pt-3 leading-relaxed">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-destructive">
                        {error.name || "Error"}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background hover:bg-muted border border-border text-[10px] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <CheckIcon className="size-3 text-green-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="size-3" />
                            <span>Copy Error</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mb-2">{error.message}</p>
                    {error.stack && (
                      <details className="mt-3 group/stack [&_summary::-webkit-details-marker]:hidden">
                        <summary className="cursor-pointer text-[10px] text-muted-foreground underline select-none hover:text-foreground transition-colors">
                          Show Stack Trace
                        </summary>
                        <pre className="mt-2 max-h-40 overflow-y-auto text-[10px] text-muted-foreground bg-background p-2.5 rounded border border-border font-mono whitespace-pre scrollbar-thin">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </details>
              </div>
            )}
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
