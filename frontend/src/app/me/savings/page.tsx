import { createTranslator } from "@/i18n/translate";

export default async function SavingsGoalsPage() {
  const t = createTranslator("PersonalSettings");
  return <div>{t((m) => m.PersonalSettings.savingsGoalsPage)}</div>;
}
