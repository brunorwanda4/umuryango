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
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: enMessages.RegisterPage.metadataTitle,
  description: enMessages.RegisterPage.metadataDescription,
};

type RegisterPageProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const register = createTranslator(messages, "RegisterPage");

  return (
    <main className="flex min-h-dvh justify-center bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="flex w-full max-w-[34rem] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2 ">
            <Link
              href={getLocalizedHref("/auth/login", locale)}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={register("backAriaLabel")}
            >
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {register("heading")}
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{register("subheading")}</p>
        </div>

        <RegisterForm
          copy={messages.RegisterForm}
          loginHref={getLocalizedHref("/auth/login", locale)}
          verifiedHref={getLocalizedHref("/", locale)}
        />
      </div>
    </main>
  );
};

export default RegisterPage;
