import { AlertCircleIcon } from "lucide-react";
import { SidebarIconStyleSettings } from "@/components/app-shell/sidebar-icon-style-settings";
import { PersonalProfileSettings } from "@/components/settings/personal-profile-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CurrentUser } from "@/hooks/use-current-user";
import { serverApiRequest } from "@/service/server-api";

export default async function SettingsPage() {
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
        <h1 className="font-bold text-2xl tracking-tight">Personal settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, account details, security, and workspace
          preferences.
        </p>
      </div>

      {user ? (
        <PersonalProfileSettings user={user} />
      ) : (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Profile unavailable</AlertTitle>
          <AlertDescription>
            {response.message ?? "Your profile could not be loaded."}
          </AlertDescription>
        </Alert>
      )}

      <SidebarIconStyleSettings />
    </div>
  );
}
