import { createTranslator } from "@/i18n/translate";

export function PersonalDashboardHeader({ firstName }: { firstName?: string }) {
  const t = createTranslator("PersonalOverview");

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-fraunces text-4xl font-semibold tracking-tight sm:text-5xl">
          {firstName
            ? t("header.welcomeBackNamed", { name: firstName })
            : t("header.welcomeBack")}
        </h1>
      </div>
    </header>
  );
}
