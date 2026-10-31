import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getLocalizedHref,
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: enMessages.ForgotPasswordPage.metadataTitle,
  description: enMessages.ForgotPasswordPage.metadataDescription,
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

const ForgotPasswordPage = async ({
  searchParams,
}: ForgotPasswordPageProps) => {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const page = createTranslator(messages, "ForgotPasswordPage");
  const shared = createTranslator(messages, "Shared");

  return (
    <main className="flex min-h-dvh justify-center bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="flex w-full max-w-[34rem] flex-col gap-7">
        <Link
          href={getLocalizedHref("/auth/login", locale)}
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={page((m) => m.ForgotPasswordPage.backAriaLabel)}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </Link>

        <div className="flex items-center gap-2">
          <Image
            src="/brand/umuryango-inverted-icon.png"
            alt={shared((m) => m.Shared.brand)}
            width={32}
            height={32}
            priority
            className="rounded-lg"
          />
          <span className="text-base font-semibold">
            {shared((m) => m.Shared.brand)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {page((m) => m.ForgotPasswordPage.heading)}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {page((m) => m.ForgotPasswordPage.subheading)}
          </p>
        </div>

        <ForgotPasswordForm
          copy={messages.ForgotPasswordForm}
          loginHref={getLocalizedHref("/auth/login", locale)}
        />
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
