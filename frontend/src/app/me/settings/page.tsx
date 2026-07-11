import { SidebarIconStyleSettings } from "@/components/app-shell/sidebar-icon-style-settings";

export default async function SettingsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">Personal settings</h1>
        <p className="text-muted-foreground text-sm">
          Preferences for your workspace experience.
        </p>
      </div>
      <SidebarIconStyleSettings />
    </div>
  );
}
