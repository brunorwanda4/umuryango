import { FamilyEventsCalendar } from "@/components/family/family-events-calendar";
import { createTranslator } from "@/i18n/translate";

export default async function FamilyEventsPage(
  _props: PageProps<"/family/[familyName]/events">,
) {
  const t = createTranslator("FamilyEvents");

  return (
    <main className="flex min-h-svh flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-2xl tracking-normal sm:text-3xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            {t("description")}
          </p>
        </div>
      </header>
      <FamilyEventsCalendar />
    </main>
  );
}
