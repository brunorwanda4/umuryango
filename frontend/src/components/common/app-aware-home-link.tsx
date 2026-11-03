"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { type AppLocale, getLocalizedHref } from "@/i18n/config";
import { APP_HOME_PATH, PUBLIC_HOME_PATH } from "@/lib/routes";
import { isNativeApp } from "@/service/native-bridge";

type AppAwareHomeLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  locale: AppLocale;
};

export function AppAwareHomeLink({
  locale,
  onClick,
  ...props
}: AppAwareHomeLinkProps) {
  const router = useRouter();

  return (
    <Link
      {...props}
      href={getLocalizedHref(PUBLIC_HOME_PATH, locale)}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && isNativeApp()) {
          event.preventDefault();
          router.push(getLocalizedHref(APP_HOME_PATH, locale));
        }
      }}
    />
  );
}
