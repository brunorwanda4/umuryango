"use client"; // Error boundaries must be Client Components

import {
  ChevronDownIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { defaultLocale, getLocalizedHref, getMessages } from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const t = createTranslator(getMessages(defaultLocale), "ErrorPage");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-5 py-20 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <TriangleAlertIcon
          aria-hidden="true"
          className="size-8 text-destructive"
        />
      </div>

      <div className="flex flex-col gap-3 w-full">
        <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
          {t("title")}
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
                {error.name && (
                  <span className="font-semibold">{error.name}: </span>
                )}
                {error.message}
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => unstable_retry()}
          size="lg"
          className="h-12 w-full rounded-full sm:w-fit"
        >
          <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
          {t("tryAgain")}
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 w-full rounded-full sm:w-fit"
        >
          <Link href={getLocalizedHref("/", defaultLocale)}>
            {t("backHome")}
          </Link>
        </Button>
      </div>
    </main>
  );
}
