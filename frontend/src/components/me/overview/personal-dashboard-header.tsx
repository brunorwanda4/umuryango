import { DashboardHeader } from "@/components/common/dashboard/dashboard-header";
import { createTranslator } from "@/i18n/translate";

export function PersonalDashboardHeader({ firstName }: { firstName?: string }) {
  const t = createTranslator("PersonalOverview");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-RW", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <DashboardHeader
      title={
        firstName
          ? t((m) => m.PersonalOverview.header.welcomeBackNamed, {
              name: firstName,
            })
          : t((m) => m.PersonalOverview.header.welcomeBack)
      }
      subtitle={
        <>
          <span>{dateStr}</span>
          <span className="text-muted-foreground/50" aria-hidden="true">
            •
          </span>
          <span>Kigali, Rwanda</span>
        </>
      }
    />
  );
}
