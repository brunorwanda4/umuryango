import type { Metadata } from "next";
import { BackButton } from "@/components/common/back-button";
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

  return (
    <main className="flex min-h-dvh justify-center bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="flex w-full max-w-[34rem] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BackButton
              href={getLocalizedHref("/auth/login", locale)}
              label={page((m) => m.ForgotPasswordPage.backAriaLabel)}
            />
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {page((m) => m.ForgotPasswordPage.heading)}
            </h1>
          </div>
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
