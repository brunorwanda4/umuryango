import { AlertCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import { SidebarIconStyleSettings } from "@/components/app-shell/sidebar-icon-style-settings";
import { PersonalProfileSettings } from "@/components/settings/personal-profile-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CurrentUser } from "@/hooks/use-current-user";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";
import { serverApiRequest } from "@/service/server-api";

export const metadata: Metadata = {
  title: enMessages.PersonalSettings.metadataTitle,
  description: enMessages.PersonalSettings.metadataDescription,
};

export default async function SettingsPage() {
  const t = createTranslator("PersonalSettings");
  const response = await serverApiRequest<undefined, { user?: CurrentUser }>(
    "get",
    "/auth/me",
    undefined,
    { cache: "no-store" },
  );
  const user = response.data?.user;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">
          {t((m) => m.PersonalSettings.title)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t((m) => m.PersonalSettings.description)}
        </p>
      </div>

      {user ? (
        <PersonalProfileSettings user={user} />
      ) : (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>
            {t((m) => m.PersonalSettings.profileUnavailableTitle)}
          </AlertTitle>
          <AlertDescription>
            {response.message ??
              t((m) => m.PersonalSettings.profileUnavailableDesc)}
          </AlertDescription>
        </Alert>
      )}

      <SidebarIconStyleSettings />
    </div>
  );
}
