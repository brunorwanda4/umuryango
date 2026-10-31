import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getLocalizedHref,
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: enMessages.RegisterPage.metadataTitle,
  description: enMessages.RegisterPage.metadataDescription,
};

type RegisterPageProps = {
  searchParams?: Promise<LocaleSearchParams & { redirect?: string | string[] }>;
};

function resolvePostRegisterHref(
  searchParams:
    | (LocaleSearchParams & { redirect?: string | string[] })
    | undefined,
  locale: Parameters<typeof getLocalizedHref>[1],
) {
  const redirect = Array.isArray(searchParams?.redirect)
    ? searchParams?.redirect[0]
    : searchParams?.redirect;

  if (
    redirect?.startsWith("/") &&
    !redirect.startsWith("//") &&
    !redirect.startsWith("/auth/login") &&
    !redirect.startsWith("/auth/register")
  ) {
    return redirect;
  }

  return getLocalizedHref("/me", locale);
}

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  const resolvedSearchParams = await searchParams;
  const locale = resolveLocaleFromSearchParams(resolvedSearchParams);
  const messages = getMessages(locale);
  const register = createTranslator(messages, "RegisterPage");
  const postRegisterHref = resolvePostRegisterHref(
    resolvedSearchParams,
    locale,
  );

  return (
    <main className="flex min-h-dvh justify-center bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="flex w-full max-w-[34rem] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2 ">
            <Link
              href={getLocalizedHref("/auth/login", locale)}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={register((m) => m.RegisterPage.backAriaLabel)}
            >
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {register((m) => m.RegisterPage.heading)}
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {register((m) => m.RegisterPage.subheading)}
          </p>
        </div>

        <RegisterForm
          copy={messages.RegisterForm}
          loginHref={getLocalizedHref("/auth/login", locale)}
          verifiedHref={postRegisterHref}
        />
      </div>
    </main>
  );
};

export default RegisterPage;
