import { DashboardHeader } from "@/components/common/dashboard/dashboard-header";
import { createTranslator } from "@/i18n/translate";

export function PersonalDashboardHeader({ firstName }: { firstName?: string }) {
  const t = createTranslator("PersonalOverview");

  return (
    <DashboardHeader
      title={
        firstName
          ? t((m) => m.PersonalOverview.header.welcomeBackNamed, {
              name: firstName,
            })
          : t((m) => m.PersonalOverview.header.welcomeBack)
      }
    />
  );
}
